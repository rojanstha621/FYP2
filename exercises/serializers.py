from rest_framework import serializers
from .models import Exercise
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
