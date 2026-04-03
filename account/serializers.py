from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.urls import reverse
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserProfile


def build_profile_picture_url(user, profile, request=None):
    if not profile:
        return None

    if profile.profile_picture_blob:
        path = reverse("profile-picture-db", kwargs={"id": user.id})
        return request.build_absolute_uri(path) if request else path

    if profile.profile_picture:
        url = profile.profile_picture.url
        return request.build_absolute_uri(url) if request else url

    return None


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
    def _persist_picture_blob(self, instance, uploaded_file):
        if not uploaded_file:
            return

        file_bytes = uploaded_file.read()
        uploaded_file.seek(0)

        instance.profile_picture_blob = file_bytes
        instance.profile_picture_name = getattr(uploaded_file, "name", None)
        instance.profile_picture_content_type = getattr(uploaded_file, "content_type", None)

    def create(self, validated_data):
        uploaded_file = validated_data.get("profile_picture")
        instance = super().create(validated_data)
        if uploaded_file:
            self._persist_picture_blob(instance, uploaded_file)
            instance.save(
                update_fields=[
                    "profile_picture_blob",
                    "profile_picture_name",
                    "profile_picture_content_type",
                ]
            )
        return instance

    def update(self, instance, validated_data):
        uploaded_file = validated_data.get("profile_picture")
        instance = super().update(instance, validated_data)
        if uploaded_file:
            self._persist_picture_blob(instance, uploaded_file)
            instance.save(
                update_fields=[
                    "profile_picture_blob",
                    "profile_picture_name",
                    "profile_picture_content_type",
                ]
            )
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request") if hasattr(self, "context") else None
        data["profile_picture"] = build_profile_picture_url(instance.user, instance, request)
        return data

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
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "phone_number", "profile_picture"]

    def get_profile_picture(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            profile = UserProfile.objects.filter(user=obj).first()
        request = self.context.get("request")
        return build_profile_picture_url(obj, profile, request)

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
        return UserProfileSerializer(profile, context=self.context).data if profile else None


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
            "therapist_status",
            "is_therapist_approved",
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
            "therapist_status",
            "is_therapist_approved",
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
        return AdminUserProfileSerializer(profile, context=self.context).data if profile else None


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "therapist_status",
            "is_therapist_approved",
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


class PatientDashboardSerializer(serializers.Serializer):
    """
    Dedicated serializer for patient dashboard endpoint.
    Returns patient info and assigned therapist.
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
