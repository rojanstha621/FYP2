from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserProfile


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        # IMPORTANT: authenticate uses username keyword (mapped to USERNAME_FIELD)
        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError({"detail": "Invalid credentials"})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "Account is disabled"})

        attrs["user"] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        # just basic presence validation
        if not attrs.get("refresh"):
            raise serializers.ValidationError({"refresh": "Refresh token is required"})
        return attrs

    def save(self, **kwargs):
        refresh_token = self.validated_data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()  # requires token_blacklist app
        return {}


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "is_active", "created_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "profile_picture",
            "address",
            "bio",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class MeSerializer(serializers.Serializer):
    """
    Combined 'me' response:
    - user fields
    - profile fields
    """

    user = UserBasicSerializer()
    profile = UserProfileSerializer()


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    For updating user's own basic info (NOT role, NOT is_active).
    """

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password]
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return {}

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "password",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")

        # Create user
        role = validated_data.get("role")

        user = User.objects.create(
            email=validated_data["email"],
            first_name=validated_data.get("first_name"),
            last_name=validated_data.get("last_name"),
            phone_number=validated_data.get("phone_number"),
            role=role,
            is_active=True,
        )

        # If therapist registers, set status to PENDING and not approved
        if role == "THERAPIST":
            user.therapist_status = User.TherapistStatusChoices.PENDING
            user.is_therapist_approved = False

        user.set_password(password)
        user.save()

        # Create empty profile automatically
        UserProfile.objects.create(user=user)

        return user


class TherapistSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "phone_number"]

class TherapistPublicDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "profile",
        ]
        read_only_fields = ["id", "profile"]

    def get_profile(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            from .models import UserProfile
            profile = UserProfile.objects.filter(user=obj).first()
        return UserProfileSerializer(profile).data if profile else None


class AdminUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "profile_picture",
            "address",
            "bio",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "created_at",
            "updated_at",
            "profile",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "profile"]

    def get_profile(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            profile = UserProfile.objects.filter(user=obj).first()
        return AdminUserProfileSerializer(profile).data if profile else None


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
        ]

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required")
        qs = User.objects.filter(email=value).exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("Email already exists")
        return value


class TherapistInfoSerializer(serializers.Serializer):
    """
    Serializer for assigned therapist info in patient dashboard.
    """
    id = serializers.UUIDField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=15, allow_blank=True)


class TodayExerciseSerializer(serializers.Serializer):
    """
    Serializer for today's assigned exercises in patient dashboard.
    """
    plan_id = serializers.IntegerField()
    exercise_name = serializers.CharField(max_length=200)
    exercise_duration = serializers.IntegerField()
    rest_duration = serializers.IntegerField()
    sets = serializers.IntegerField()
    special_instructions = serializers.CharField(max_length=5000, allow_blank=True)
    status = serializers.CharField(max_length=20)


class TodayProgressSummarySerializer(serializers.Serializer):
    """
    Serializer for today's progress summary in patient dashboard.
    """
    total_exercises_assigned = serializers.IntegerField()
    total_exercises_completed = serializers.IntegerField()
    total_sets_completed = serializers.IntegerField()


class PatientDashboardSerializer(serializers.Serializer):
    """
    Dedicated serializer for patient dashboard endpoint.
    Returns patient info, assigned therapist, today's exercises, and progress.
    """
    
    class PatientInfoSerializer(serializers.Serializer):
        """Nested serializer for patient info"""
        id = serializers.UUIDField()
        full_name = serializers.SerializerMethodField()
        email = serializers.EmailField()

        def get_full_name(self, obj):
            return obj.get_full_name()

    patient = PatientInfoSerializer(source="*")
    assigned_therapist = serializers.SerializerMethodField()
    today_exercises = serializers.SerializerMethodField()
    today_summary = serializers.SerializerMethodField()

    def get_assigned_therapist(self, obj):
        """
        Get the currently active assigned therapist.
        Returns None if no active assignment exists.
        """
        from medicals.models import TherapistPatientAssignment
        from account.models import User
        
        assignment = TherapistPatientAssignment.objects.filter(
            patient=obj,
            is_active=True,
            therapist__role="THERAPIST",
            therapist__therapist_status=User.TherapistStatusChoices.APPROVED,
        ).select_related("therapist").first()

        if not assignment:
            return None

        therapist = assignment.therapist
        return TherapistInfoSerializer({
            "id": therapist.id,
            "first_name": therapist.first_name,
            "last_name": therapist.last_name,
            "email": therapist.email,
            "phone_number": therapist.phone_number or "",
        }).data

    def get_today_exercises(self, obj):
        """
        Get exercises assigned for today.
        Includes exercise details and completion status.
        """
        from django.utils import timezone
        from exercises.models import ExercisePlan, ExerciseSession
        
        today = timezone.now().date()

        # Get all exercise plans for today
        plans = ExercisePlan.objects.filter(
            patient=obj,
            scheduled_date=today,
            is_active=True,
        ).select_related("exercise")

        exercises_data = []
        for plan in plans:
            # Get the session status for this plan
            session = ExerciseSession.objects.filter(
                exercise_plan=plan
            ).order_by("-created_at").first()
            
            status = session.status if session else "PENDING"

            exercises_data.append({
                "plan_id": plan.id,
                "exercise_name": plan.exercise.name,
                "exercise_duration": plan.exercise_duration,
                "rest_duration": plan.rest_duration,
                "sets": plan.sets,
                "special_instructions": plan.special_instructions,
                "status": status,
            })

        return exercises_data

    def get_today_summary(self, obj):
        """
        Calculate today's progress summary.
        Returns total assigned, completed, and sets completed.
        """
        from django.utils import timezone
        from exercises.models import ExercisePlan, ExerciseSession
        
        today = timezone.now().date()

        # Get all exercise plans for today
        plans = ExercisePlan.objects.filter(
            patient=obj,
            scheduled_date=today,
            is_active=True,
        ).values_list("id", flat=True)

        total_assigned = len(plans)
        
        # Get completed sessions for today
        completed_sessions = ExerciseSession.objects.filter(
            exercise_plan_id__in=plans,
            status="COMPLETED",
        )

        total_completed = completed_sessions.count()
        total_sets_completed = sum(
            session.sets_completed for session in completed_sessions
        )

        return {
            "total_exercises_assigned": total_assigned,
            "total_exercises_completed": total_completed,
            "total_sets_completed": total_sets_completed,
        }