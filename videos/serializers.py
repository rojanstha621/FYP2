from rest_framework import serializers
from .models import Video, VideoAssignment, DailyVideoLog
from account.serializers import UserBasicSerializer
from medicals.models import TherapistPatientAssignment


class VideoSerializer(serializers.ModelSerializer):
    """
    Full video serializer with all fields.
    Used by admin for full CRUD operations.
    """
    
    created_by_details = UserBasicSerializer(source="created_by", read_only=True)
    assignment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "description",
            "youtube_url",
            "youtube_embed_url",
            "thumbnail_url",
            "is_active",
            "created_by",
            "created_by_details",
            "assignment_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "youtube_embed_url",
            "thumbnail_url",
            "created_at",
            "updated_at",
        ]
    
    def get_assignment_count(self, obj):
        """Get total number of active assignments for this video"""
        return obj.assignments.filter(is_active=True).count()
    
    def validate_youtube_url(self, value):
        """Validate YouTube URL format"""
        from .models import extract_youtube_video_id
        
        video_id = extract_youtube_video_id(value)
        if not video_id:
            raise serializers.ValidationError(
                "Invalid YouTube URL. Please provide a valid YouTube video URL."
            )
        return value


class VideoListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing videos.
    Used for therapist video browsing.
    """
    
    assignment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "description",
            "thumbnail_url",
            "youtube_embed_url",
            "assignment_count",
            "created_at",
        ]
        read_only_fields = fields
    
    def get_assignment_count(self, obj):
        """Get total number of active assignments"""
        return obj.assignments.filter(is_active=True).count()


class DailyVideoLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for a single day's log entry."""

    class Meta:
        model = DailyVideoLog
        fields = ["id", "scheduled_date", "status", "viewed", "viewed_at"]
        read_only_fields = fields


class VideoAssignmentSerializer(serializers.ModelSerializer):
    """
    Video assignment serializer with full details.
    """

    video_details = VideoListSerializer(source="video", read_only=True)
    therapist_details = UserBasicSerializer(source="therapist", read_only=True)
    patient_details = UserBasicSerializer(source="patient", read_only=True)
    # Schedule progress summary (read-only, computed)
    schedule_end_date = serializers.SerializerMethodField()
    daily_logs = DailyVideoLogSerializer(many=True, read_only=True)
    schedule_progress = serializers.SerializerMethodField()

    class Meta:
        model = VideoAssignment
        fields = [
            "id",
            "video",
            "video_details",
            "therapist",
            "therapist_details",
            "patient",
            "patient_details",
            "notes",
            "segment_start_seconds",
            "segment_end_seconds",
            "repeat_count",
            "pause_between_repeats_seconds",
            # schedule fields
            "schedule_start_date",
            "schedule_duration_days",
            "scheduled_time",
            "schedule_end_date",
            "is_scheduled",
            "daily_logs",
            "schedule_progress",
            "assigned_at",
            "is_active",
            "viewed",
            "viewed_at",
        ]
        read_only_fields = [
            "id",
            "assigned_at",
            "viewed",
            "viewed_at",
            "schedule_end_date",
            "is_scheduled",
            "daily_logs",
            "schedule_progress",
        ]

    def get_schedule_end_date(self, obj):
        d = obj.get_schedule_end_date()
        return str(d) if d else None

    def get_schedule_progress(self, obj):
        """Return day-by-day summary counts for the therapist overview."""
        if not obj.is_scheduled:
            return None
        logs = obj.daily_logs.all()
        return {
            "total_days": obj.schedule_duration_days,
            "viewed_days": logs.filter(viewed=True).count(),
            "missed_days": logs.filter(status=DailyVideoLog.DayStatus.MISSED).count(),
            "pending_days": logs.filter(status=DailyVideoLog.DayStatus.PENDING).count(),
        }
    
    def validate(self, attrs):
        """Validate assignment constraints"""
        video = attrs.get("video")
        therapist = attrs.get("therapist")
        patient = attrs.get("patient")

        start = attrs.get(
            "segment_start_seconds",
            self.instance.segment_start_seconds if self.instance else None,
        )
        end = attrs.get(
            "segment_end_seconds",
            self.instance.segment_end_seconds if self.instance else None,
        )
        repeat_count = attrs.get(
            "repeat_count",
            self.instance.repeat_count if self.instance else 1,
        )
        pause_between_repeats_seconds = attrs.get(
            "pause_between_repeats_seconds",
            self.instance.pause_between_repeats_seconds if self.instance else 0,
        )

        if (start is None) != (end is None):
            raise serializers.ValidationError(
                "Provide both segment start and end times, or leave both empty."
            )

        if start is not None and end is not None and end <= start:
            raise serializers.ValidationError(
                {"segment_end_seconds": "Segment end time must be greater than start time."}
            )

        if repeat_count is None or repeat_count < 1:
            raise serializers.ValidationError(
                {"repeat_count": "Repeat count must be at least 1."}
            )

        if repeat_count > 1 and start is None:
            raise serializers.ValidationError(
                {"repeat_count": "Repeat count greater than 1 requires segment start and end times."}
            )

        if pause_between_repeats_seconds is None or pause_between_repeats_seconds < 0:
            raise serializers.ValidationError(
                {"pause_between_repeats_seconds": "Pause between repeats cannot be negative."}
            )

        if pause_between_repeats_seconds > 0 and repeat_count == 1:
            raise serializers.ValidationError(
                {
                    "pause_between_repeats_seconds": (
                        "Pause between repeats is only used when repeat count is greater than 1."
                    )
                }
            )
        
        # For create operations
        if not self.instance:
            # Check if video is active
            if video and not video.is_active:
                raise serializers.ValidationError(
                    {"video": "Cannot assign an inactive video."}
                )
            
            # Check if therapist is assigned to patient
            if therapist and patient:
                assignment_exists = TherapistPatientAssignment.objects.filter(
                    therapist=therapist,
                    patient=patient,
                    is_active=True
                ).exists()
                
                if not assignment_exists:
                    raise serializers.ValidationError(
                        "You are not assigned to this patient."
                    )
            
            # Check for duplicate assignment
            if video and patient and therapist:
                duplicate = VideoAssignment.objects.filter(
                    video=video,
                    patient=patient,
                    therapist=therapist,
                    is_active=True
                ).exists()
                
                if duplicate:
                    raise serializers.ValidationError(
                        "This video is already assigned to this patient."
                    )
        
        return attrs


class VideoAssignmentCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating video assignments.
    Therapist is set automatically from request.user.
    """

    class Meta:
        model = VideoAssignment
        fields = [
            "id",
            "video",
            "patient",
            "notes",
            "segment_start_seconds",
            "segment_end_seconds",
            "repeat_count",
            "pause_between_repeats_seconds",
            "schedule_start_date",
            "schedule_duration_days",
            "scheduled_time",
        ]
        read_only_fields = ["id"]
    
    def validate(self, attrs):
        """Validate assignment constraints"""
        video = attrs.get("video")
        patient = attrs.get("patient")
        start = attrs.get("segment_start_seconds")
        end = attrs.get("segment_end_seconds")
        repeat_count = attrs.get("repeat_count", 1)
        pause_between_repeats_seconds = attrs.get("pause_between_repeats_seconds", 0)
        
        # Therapist comes from context
        therapist = self.context.get("request").user if self.context.get("request") else None
        
        if not therapist:
            raise serializers.ValidationError("Authentication required.")

        if (start is None) != (end is None):
            raise serializers.ValidationError(
                "Provide both segment start and end times, or leave both empty."
            )

        if start is not None and end is not None and end <= start:
            raise serializers.ValidationError(
                {"segment_end_seconds": "Segment end time must be greater than start time."}
            )

        if repeat_count is None or repeat_count < 1:
            raise serializers.ValidationError(
                {"repeat_count": "Repeat count must be at least 1."}
            )

        if repeat_count > 1 and start is None:
            raise serializers.ValidationError(
                {"repeat_count": "Repeat count greater than 1 requires segment start and end times."}
            )

        if pause_between_repeats_seconds is None or pause_between_repeats_seconds < 0:
            raise serializers.ValidationError(
                {"pause_between_repeats_seconds": "Pause between repeats cannot be negative."}
            )

        if pause_between_repeats_seconds > 0 and repeat_count == 1:
            raise serializers.ValidationError(
                {
                    "pause_between_repeats_seconds": (
                        "Pause between repeats is only used when repeat count is greater than 1."
                    )
                }
            )
        
        # Check if video is active
        if video and not video.is_active:
            raise serializers.ValidationError(
                {"video": "Cannot assign an inactive video."}
            )
        
        # Check if therapist is assigned to patient
        if therapist and patient:
            assignment_exists = TherapistPatientAssignment.objects.filter(
                therapist=therapist,
                patient=patient,
                is_active=True
            ).exists()
            
            if not assignment_exists:
                raise serializers.ValidationError(
                    {"patient": "You are not assigned to this patient."}
                )
        
        # Check for duplicate assignment
        if video and patient and therapist:
            duplicate = VideoAssignment.objects.filter(
                video=video,
                patient=patient,
                therapist=therapist,
                is_active=True
            ).exists()

            if duplicate:
                raise serializers.ValidationError(
                    "This video is already assigned to this patient."
                )

        # Validate schedule fields: all-or-nothing
        schedule_start = attrs.get("schedule_start_date")
        schedule_days = attrs.get("schedule_duration_days")
        schedule_time = attrs.get("scheduled_time")
        schedule_fields = [schedule_start, schedule_days, schedule_time]
        filled = [f for f in schedule_fields if f is not None]
        if 0 < len(filled) < 3:
            raise serializers.ValidationError(
                "Provide all three schedule fields (start date, duration days, time) or leave all empty."
            )
        if schedule_days is not None and schedule_days < 1:
            raise serializers.ValidationError(
                {"schedule_duration_days": "Duration must be at least 1 day."}
            )

        return attrs

    def create(self, validated_data):
        """Set therapist from request user and reactivate prior soft-deleted assignment."""
        therapist = self.context["request"].user
        validated_data["therapist"] = therapist

        existing_assignment = VideoAssignment.objects.filter(
            video=validated_data["video"],
            patient=validated_data["patient"],
            therapist=therapist,
        ).first()

        if existing_assignment and not existing_assignment.is_active:
            create_defaults = {
                "notes": "",
                "segment_start_seconds": None,
                "segment_end_seconds": None,
                "repeat_count": 1,
                "pause_between_repeats_seconds": 0,
                "schedule_start_date": None,
                "schedule_duration_days": None,
                "scheduled_time": None,
            }

            for field, default in create_defaults.items():
                setattr(existing_assignment, field, validated_data.get(field, default))

            existing_assignment.is_active = True
            existing_assignment.viewed = False
            existing_assignment.viewed_at = None
            existing_assignment.full_clean()
            existing_assignment.save()
            return existing_assignment

        return super().create(validated_data)


class PatientVideoSerializer(serializers.ModelSerializer):
    """
    Serializer for patient viewing assigned videos.
    Shows video details with assignment info.
    """

    video_details = VideoListSerializer(source="video", read_only=True)
    therapist_name = serializers.CharField(source="therapist.get_full_name", read_only=True)
    schedule_end_date = serializers.SerializerMethodField()
    is_scheduled = serializers.BooleanField(read_only=True)
    is_available_today = serializers.SerializerMethodField()
    today_log = serializers.SerializerMethodField()

    class Meta:
        model = VideoAssignment
        fields = [
            "id",
            "video_details",
            "therapist_name",
            "notes",
            "segment_start_seconds",
            "segment_end_seconds",
            "repeat_count",
            "pause_between_repeats_seconds",
            # schedule
            "schedule_start_date",
            "schedule_duration_days",
            "scheduled_time",
            "schedule_end_date",
            "is_scheduled",
            "is_available_today",
            "today_log",
            "assigned_at",
            "viewed",
            "viewed_at",
        ]
        read_only_fields = fields

    def get_schedule_end_date(self, obj):
        d = obj.get_schedule_end_date()
        return str(d) if d else None

    def get_is_available_today(self, obj):
        return obj.is_available_today()

    def get_today_log(self, obj):
        from datetime import date
        if not obj.is_scheduled:
            return None
        today = date.today()
        log = obj.daily_logs.filter(scheduled_date=today).first()
        if log:
            return DailyVideoLogSerializer(log).data
        return None
