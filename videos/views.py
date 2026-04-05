from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from myproject.pagination import StandardPagination
from myproject.utils import api_response

from .models import Video, VideoAssignment, DailyVideoLog
from .serializers import (
    VideoSerializer,
    VideoListSerializer,
    VideoAssignmentSerializer,
    VideoAssignmentCreateSerializer,
    PatientVideoSerializer,
    DailyVideoLogSerializer,
)
from account.permissions import IsAdminRole, IsTherapistApproved, IsPatient
from .permissions import CanManageVideoAssignment, IsAssignedPatient


class VideoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Video Management (Admin only).
    
    Admin can:
    - Create videos
    - List all videos
    - Update videos
    - Delete videos
    - Toggle active status
    """
    
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]
    
    def perform_create(self, serializer):
        """Set created_by to current admin user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """Toggle video active status"""
        video = self.get_object()
        video.is_active = not video.is_active
        video.save()
        
        serializer = self.get_serializer(video)
        return api_response(
            data={"video": serializer.data},
            message=f"Video {'activated' if video.is_active else 'deactivated'} successfully.",
            status_code=status.HTTP_200_OK,
        )


class ActiveVideoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing active videos (Therapist only).
    
    Therapists can:
    - List all active videos
    - View individual video details
    - Search and filter videos
    """
    
    queryset = Video.objects.filter(is_active=True)
    serializer_class = VideoListSerializer
    permission_classes = [IsAuthenticated, IsTherapistApproved]
    pagination_class = StandardPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]


class VideoAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Video Assignments (Therapist).
    
    Therapists can:
    - Assign videos to their patients
    - View their assignments
    - Unassign (deactivate) videos
    - Update assignment notes
    """
    
    serializer_class = VideoAssignmentSerializer
    permission_classes = [IsAuthenticated, IsTherapistApproved]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["patient", "video", "is_active"]
    search_fields = ["video__title", "patient__email", "patient__first_name"]
    ordering_fields = ["assigned_at"]
    ordering = ["-assigned_at"]
    
    def get_queryset(self):
        """Return only assignments created by the current therapist"""
        return VideoAssignment.objects.filter(
            therapist=self.request.user,
            is_active=True
        ).select_related("video", "patient", "therapist")
    
    def get_serializer_class(self):
        """Use simplified serializer for create action"""
        if self.action == "create":
            return VideoAssignmentCreateSerializer
        return VideoAssignmentSerializer
    
    def perform_create(self, serializer):
        """Therapist is set automatically from request.user in serializer"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of deleting"""
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=["get"])
    def my_assignments(self, request):
        """Get all assignments made by the current therapist"""
        assignments = self.get_queryset()
        
        # Apply filters
        patient_id = request.query_params.get("patient", None)
        if patient_id:
            assignments = assignments.filter(patient_id=patient_id)
        
        page = self.paginate_queryset(assignments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(assignments, many=True)
        return api_response(
            data=serializer.data,
            message="Assignments retrieved successfully",
            status_code=status.HTTP_200_OK,
        )
    
    @action(detail=False, methods=["get"])
    def by_patient(self, request):
        """Get assignments grouped by patient."""
        from account.serializers import UserBasicSerializer

        patients_data = []
        patient_ids = self.get_queryset().values_list("patient", flat=True).distinct()

        for patient_id in patient_ids:
            from account.models import User
            patient = User.objects.get(id=patient_id)
            assignment_count = self.get_queryset().filter(patient=patient).count()

            patients_data.append({
                "patient": UserBasicSerializer(patient).data,
                "assignment_count": assignment_count,
                "assignments": VideoAssignmentSerializer(
                    self.get_queryset().filter(patient=patient).prefetch_related("daily_logs"),
                    many=True,
                ).data,
            })

        return api_response(
            data=patients_data,
            message="Assignments grouped by patient retrieved successfully",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def schedule_progress(self, request, pk=None):
        """
        Return full day-by-day progress log for a single scheduled assignment.
        Therapist only — must own the assignment.
        """
        assignment = self.get_object()

        if not assignment.is_scheduled:
            return api_response(
                data={},
                message="This assignment has no schedule.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        logs = assignment.daily_logs.all()
        viewed_days = logs.filter(viewed=True).count()
        missed_days = logs.filter(status=DailyVideoLog.DayStatus.MISSED).count()
        pending_days = logs.filter(status=DailyVideoLog.DayStatus.PENDING).count()

        return api_response(
            data={
                "assignment_id": assignment.id,
                "patient": assignment.patient.get_full_name(),
                "video_title": assignment.video.title,
                "schedule_start_date": str(assignment.schedule_start_date),
                "schedule_end_date": str(assignment.get_schedule_end_date()),
                "scheduled_time": assignment.scheduled_time.strftime("%H:%M"),
                "total_days": assignment.schedule_duration_days,
                "viewed_days": viewed_days,
                "missed_days": missed_days,
                "pending_days": pending_days,
                "daily_logs": DailyVideoLogSerializer(logs, many=True).data,
            },
            message="Schedule progress retrieved successfully",
            status_code=status.HTTP_200_OK,
        )


def _backfill_missed_days(assignment):
    """
    For scheduled assignments, mark any past days (before today) that have no
    VIEWED log as MISSED.  Called lazily whenever the patient fetches their videos.
    """
    if not assignment.is_scheduled:
        return
    today = timezone.localdate()
    current = assignment.schedule_start_date
    end = assignment.get_schedule_end_date()
    while current < today and current <= end:
        log, created = DailyVideoLog.objects.get_or_create(
            assignment=assignment,
            scheduled_date=current,
            defaults={"status": DailyVideoLog.DayStatus.MISSED},
        )
        if not created and log.status == DailyVideoLog.DayStatus.PENDING and not log.viewed:
            log.status = DailyVideoLog.DayStatus.MISSED
            log.save(update_fields=["status"])
        current += timedelta(days=1)


class PatientVideoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Patient's assigned videos.

    Patients can:
    - View only videos assigned to them
    - Mark videos as viewed (creates a DailyVideoLog for scheduled assignments)
    - Non-scheduled or un-scheduled videos follow the original single-view behaviour
    """

    serializer_class = PatientVideoSerializer
    permission_classes = [IsAuthenticated, IsPatient]
    pagination_class = StandardPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["video__title", "therapist__first_name"]
    ordering_fields = ["assigned_at", "viewed"]
    ordering = ["-assigned_at"]

    def get_queryset(self):
        """Return active videos assigned to the current patient."""
        return VideoAssignment.objects.filter(
            patient=self.request.user,
            is_active=True,
        ).select_related("video", "therapist").prefetch_related("daily_logs")

    def list(self, request, *args, **kwargs):
        """Backfill missed days before returning the list."""
        qs = self.get_queryset()
        for assignment in qs:
            _backfill_missed_days(assignment)
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def mark_viewed(self, request, pk=None):
        """
        Mark a video as viewed by the patient for today.

        For scheduled assignments:
          - Must be within the schedule window and past the scheduled_time.
          - Creates / updates the DailyVideoLog for today.
          - Once viewed today, the video is locked until the next day.
        For non-scheduled assignments:
          - Works exactly as before (sets viewed=True once).
        """
        assignment = self.get_object()
        now = timezone.now()
        today = timezone.localdate()

        if assignment.is_scheduled:
            # Guard: check availability
            if not assignment.is_available_today():
                # Determine reason
                end_date = assignment.get_schedule_end_date()
                if today < assignment.schedule_start_date:
                    msg = (
                        f"This video is not available yet. "
                        f"It unlocks on {assignment.schedule_start_date} "
                        f"at {assignment.scheduled_time.strftime('%H:%M')}."
                    )
                elif today > end_date:
                    msg = "The schedule for this video has ended."
                elif timezone.localtime(now).time() < assignment.scheduled_time:
                    msg = (
                        f"This video unlocks today at "
                        f"{assignment.scheduled_time.strftime('%H:%M')}."
                    )
                else:
                    msg = "You have already watched this video today. It will be available again tomorrow."
                return api_response(
                    data={},
                    message=msg,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            # Create or update today's DailyVideoLog
            log, _ = DailyVideoLog.objects.get_or_create(
                assignment=assignment,
                scheduled_date=today,
                defaults={
                    "status": DailyVideoLog.DayStatus.VIEWED,
                    "viewed": True,
                    "viewed_at": now,
                },
            )
            if not log.viewed:
                log.viewed = True
                log.status = DailyVideoLog.DayStatus.VIEWED
                log.viewed_at = now
                log.save(update_fields=["viewed", "status", "viewed_at"])

            # Also mark the overall assignment as viewed (first time flag)
            if not assignment.viewed:
                assignment.viewed = True
                assignment.viewed_at = now
                assignment.save(update_fields=["viewed", "viewed_at"])

        else:
            # Non-scheduled: original behaviour
            if not assignment.viewed:
                assignment.viewed = True
                assignment.viewed_at = now
                assignment.save(update_fields=["viewed", "viewed_at"])

            # Keep a per-day log for non-scheduled assignments as well so
            # patients can submit a difficulty level for today.
            log, _ = DailyVideoLog.objects.get_or_create(
                assignment=assignment,
                scheduled_date=today,
                defaults={
                    "status": DailyVideoLog.DayStatus.VIEWED,
                    "viewed": True,
                    "viewed_at": now,
                },
            )
            if not log.viewed:
                log.viewed = True
                log.status = DailyVideoLog.DayStatus.VIEWED
                log.viewed_at = now
                log.save(update_fields=["viewed", "status", "viewed_at"])

        serializer = self.get_serializer(assignment)
        return api_response(
            data={"assignment": serializer.data},
            message="Video marked as viewed.",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def log_difficulty(self, request, pk=None):
        """
        Log today's perceived difficulty level for an assignment.

        Patient must watch the video first for the same day.
        """
        assignment = self.get_object()
        today = timezone.localdate()
        now = timezone.now()

        difficulty_level = str(request.data.get("difficulty_level", "")).upper()
        valid_choices = {choice[0] for choice in DailyVideoLog.DifficultyLevel.choices}

        if difficulty_level not in valid_choices:
            return api_response(
                data={},
                message="Invalid difficulty level. Choose EASY, MEDIUM, DIFFICULT, or HARD.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        log = assignment.daily_logs.filter(scheduled_date=today).first()

        if log is None:
            if assignment.is_scheduled:
                return api_response(
                    data={},
                    message="Please mark this video as watched today before logging difficulty.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            if not assignment.viewed:
                return api_response(
                    data={},
                    message="Please watch this video before logging difficulty.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            log = DailyVideoLog.objects.create(
                assignment=assignment,
                scheduled_date=today,
                status=DailyVideoLog.DayStatus.VIEWED,
                viewed=True,
                viewed_at=assignment.viewed_at or now,
            )

        if not log.viewed:
            return api_response(
                data={},
                message="Please mark this video as watched today before logging difficulty.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        log.difficulty_level = difficulty_level
        log.save(update_fields=["difficulty_level"])

        return api_response(
            data={
                "today_log": DailyVideoLogSerializer(log).data,
                "assignment_id": assignment.id,
            },
            message="Difficulty logged successfully.",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get viewing statistics for the patient (scheduled + non-scheduled)."""
        assignments = self.get_queryset()

        total_assigned = assignments.count()
        total_viewed = assignments.filter(viewed=True).count()
        total_unviewed = total_assigned - total_viewed

        # Scheduled-specific stats
        scheduled_qs = assignments.filter(
            schedule_start_date__isnull=False,
            schedule_duration_days__isnull=False,
            scheduled_time__isnull=False,
        )
        total_scheduled_days = sum(
            a.schedule_duration_days for a in scheduled_qs if a.schedule_duration_days
        )
        viewed_days = DailyVideoLog.objects.filter(
            assignment__in=scheduled_qs,
            viewed=True,
        ).count()
        missed_days = DailyVideoLog.objects.filter(
            assignment__in=scheduled_qs,
            status=DailyVideoLog.DayStatus.MISSED,
        ).count()
        remaining_days = max(total_scheduled_days - viewed_days - missed_days, 0)

        return api_response(
            data={
                "total_assigned": total_assigned,
                "total_viewed": total_viewed,
                "total_unviewed": total_unviewed,
                "completion_rate": round(
                    (total_viewed / total_assigned * 100) if total_assigned > 0 else 0, 2
                ),
                "scheduled": {
                    "total_days": total_scheduled_days,
                    "viewed_days": viewed_days,
                    "missed_days": missed_days,
                    "remaining_days": remaining_days,
                },
            },
            message="Video statistics retrieved successfully",
            status_code=status.HTTP_200_OK,
        )

