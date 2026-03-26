from rest_framework import serializers
from medicals.models import TherapistPatientAssignment
from .models import Exercise, ExercisePlan
from account.serializers import UserBasicSerializer


class ExerciseSerializer(serializers.ModelSerializer):
    """
    Full exercise serializer with all fields.
    """

    created_by_details = UserBasicSerializer(source="created_by", read_only=True)

    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "description",
            "target_area",
            "difficulty",
            "video_file",
            "youtube_url",
            "thumbnail",
            "instructions",
            "safety_notes",
            "created_by",
            "created_by_details",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        """
        Ensure at least one video source is provided.
        """
        video_file = attrs.get("video_file")
        youtube_url = attrs.get("youtube_url")

        # Check if we're updating and need to get existing values
        if self.instance:
            video_file = video_file if video_file is not None else self.instance.video_file
            youtube_url = youtube_url if youtube_url is not None else self.instance.youtube_url

        if not video_file and not youtube_url:
            raise serializers.ValidationError(
                "Either video file or YouTube URL must be provided."
            )

        return attrs


class ExerciseListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing exercises.
    """

    created_by_details = UserBasicSerializer(source="created_by", read_only=True)

    class Meta:
        model = Exercise
        fields = [
            "id",
            "name",
            "target_area",
            "difficulty",
            "thumbnail",
            "created_by_details",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


class ExerciseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating exercises.
    """

    class Meta:
        model = Exercise
        fields = [
            "name",
            "description",
            "target_area",
            "difficulty",
            "video_file",
            "youtube_url",
            "thumbnail",
            "instructions",
            "safety_notes",
            "is_active",
        ]

    def validate(self, attrs):
        """
        Ensure at least one video source is provided.
        """
        video_file = attrs.get("video_file")
        youtube_url = attrs.get("youtube_url")

        # Check if we're updating and need to get existing values
        if self.instance:
            video_file = video_file if video_file is not None else self.instance.video_file
            youtube_url = youtube_url if youtube_url is not None else self.instance.youtube_url

        if not video_file and not youtube_url:
            raise serializers.ValidationError(
                "Either video file or YouTube URL must be provided."
            )

        return attrs

    def create(self, validated_data):
        # Automatically set created_by to current user
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ExercisePlanSerializer(serializers.ModelSerializer):
    therapist = serializers.PrimaryKeyRelatedField(read_only=True)
    therapist_name = serializers.CharField(source="therapist.get_full_name", read_only=True)
    patient_name = serializers.CharField(source="patient.get_full_name", read_only=True)
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)
    duration = serializers.IntegerField(source="exercise_duration", read_only=True)
    notes = serializers.CharField(source="special_instructions", read_only=True)

    class Meta:
        model = ExercisePlan
        fields = [
            "id",
            "patient",
            "patient_name",
            "therapist",
            "therapist_name",
            "exercise",
            "exercise_name",
            "exercise_duration",
            "duration",
            "rest_duration",
            "sets",
            "frequency",
            "special_instructions",
            "notes",
            "assigned_date",
            "scheduled_date",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ExercisePlanCreateSerializer(serializers.ModelSerializer):
    duration = serializers.IntegerField(source="exercise_duration")
    notes = serializers.CharField(
        source="special_instructions", allow_blank=True, required=False
    )

    class Meta:
        model = ExercisePlan
        fields = [
            "patient",
            "exercise",
            "duration",
            "rest_duration",
            "sets",
            "frequency",
            "notes",
            "is_active",
            "scheduled_date",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        therapist = getattr(request, "user", None)
        patient = attrs.get("patient")

        if not therapist or not therapist.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        if getattr(therapist, "role", None) != "THERAPIST":
            raise serializers.ValidationError("Only therapists can manage exercise plans.")

        is_assigned = TherapistPatientAssignment.objects.filter(
            therapist=therapist,
            patient=patient,
            is_active=True,
        ).exists()

        if not is_assigned:
            raise serializers.ValidationError(
                {"patient": "You can only assign plans to your active patients."}
            )

        return attrs
