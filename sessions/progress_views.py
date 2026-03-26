from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import (
    Case,
    Count,
    DurationField,
    ExpressionWrapper,
    F,
    Max,
    Q,
    Sum,
    Value,
    When,
)
from django.db.models.functions import Coalesce, Concat, TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from medicals.models import TherapistPatientAssignment

from .models import Session
from .progress_serializers import (
    DailyProgressSerializer,
    WeeklyProgressSerializer,
    PatientProgressSummarySerializer,
)


User = get_user_model()


def calculate_streak(patient):
    today = timezone.now().date()
    streak = 0
    check_date = today

    while True:
        has_completion = Session.objects.filter(
            patient=patient,
            status=Session.StatusChoices.COMPLETED,
            end_time__date=check_date,
        ).exists()

        if has_completion:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    return streak


def _duration_sum_expression():
    return Sum(
        Case(
            When(
                end_time__isnull=False,
                then=ExpressionWrapper(
                    F("end_time") - F("start_time"),
                    output_field=DurationField(),
                ),
            ),
            default=Value(timedelta(0)),
            output_field=DurationField(),
        )
    )


def _duration_to_seconds(duration_value):
    if not duration_value:
        return 0
    return int(duration_value.total_seconds())


def _get_target_patient(request, allow_admin=False):
    user = request.user
    patient_id = request.query_params.get("patient_id")

    if user.role == "PATIENT":
        return user

    if user.role == "THERAPIST":
        if not patient_id:
            raise ValidationError({"patient_id": "patient_id is required for therapists."})

        assigned_patient_ids = TherapistPatientAssignment.objects.filter(
            therapist=user,
            is_active=True,
        ).values_list("patient_id", flat=True)

        patient = User.objects.filter(
            id=patient_id,
            role="PATIENT",
            id__in=assigned_patient_ids,
        ).first()
        if not patient:
            raise PermissionDenied("You can only access progress for your assigned patients.")
        return patient

    if allow_admin and user.role == "ADMIN":
        if not patient_id:
            raise ValidationError({"patient_id": "patient_id is required for admins."})

        patient = User.objects.filter(id=patient_id, role="PATIENT").first()
        if not patient:
            raise NotFound("Patient not found.")
        return patient

    raise PermissionDenied("You do not have permission to access this resource.")


class PatientDailyProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = _get_target_patient(request, allow_admin=False)

        date_param = request.query_params.get("date")
        target_date = parse_date(date_param) if date_param else timezone.localdate()
        if target_date is None:
            raise ValidationError({"date": "Invalid date format. Use YYYY-MM-DD."})

        day_sessions = Session.objects.filter(patient=patient, start_time__date=target_date)

        data = day_sessions.aggregate(
            total_sessions=Count("id"),
            completed_sessions=Count("id", filter=Q(status=Session.StatusChoices.COMPLETED)),
            skipped_sessions=Count("id", filter=Q(status=Session.StatusChoices.SKIPPED)),
            total_duration=_duration_sum_expression(),
        )

        total_sessions = data["total_sessions"] or 0
        completed_sessions = data["completed_sessions"] or 0
        skipped_sessions = data["skipped_sessions"] or 0

        payload = {
            "date": target_date,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "skipped_sessions": skipped_sessions,
            "missed_sessions": skipped_sessions,
            "completion_percentage": round(
                (completed_sessions / total_sessions * 100.0) if total_sessions else 0.0,
                2,
            ),
            "total_duration_seconds": _duration_to_seconds(data["total_duration"]),
        }

        return Response(DailyProgressSerializer(payload).data)


class PatientWeeklyProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = _get_target_patient(request, allow_admin=False)

        week_start_param = request.query_params.get("week_start")
        if week_start_param:
            week_start = parse_date(week_start_param)
            if week_start is None:
                raise ValidationError(
                    {"week_start": "Invalid date format. Use YYYY-MM-DD."}
                )
        else:
            today = timezone.localdate()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)

        week_sessions = Session.objects.filter(
            patient=patient,
            start_time__date__gte=week_start,
            start_time__date__lte=week_end,
        )

        data = week_sessions.aggregate(
            total_sessions=Count("id"),
            completed_sessions=Count("id", filter=Q(status=Session.StatusChoices.COMPLETED)),
            total_exercise_time=_duration_sum_expression(),
        )

        total_sessions = data["total_sessions"] or 0
        completed_sessions = data["completed_sessions"] or 0

        payload = {
            "week_start": week_start,
            "week_end": week_end,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "completion_percentage": round(
                (completed_sessions / total_sessions * 100.0) if total_sessions else 0.0,
                2,
            ),
            "total_exercise_time_seconds": _duration_to_seconds(
                data["total_exercise_time"]
            ),
        }

        return Response(WeeklyProgressSerializer(payload).data)


class PatientProgressSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patient = _get_target_patient(request, allow_admin=True)

        summary = Session.objects.filter(patient=patient).aggregate(
            total_sessions_all_time=Count("id"),
            completed_all_time=Count(
                "id", filter=Q(status=Session.StatusChoices.COMPLETED)
            ),
            last_session_date=Max(TruncDate("start_time")),
        )

        payload = {
            "patient_id": patient.id,
            "patient_name": patient.get_full_name(),
            "total_sessions_all_time": summary["total_sessions_all_time"] or 0,
            "completed_all_time": summary["completed_all_time"] or 0,
            "current_streak": calculate_streak(patient),
            "last_session_date": summary["last_session_date"],
        }

        return Response(PatientProgressSummarySerializer(payload).data)


class TherapistPatientsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "THERAPIST":
            raise PermissionDenied("Only therapists can access this endpoint.")

        assigned_patient_ids = TherapistPatientAssignment.objects.filter(
            therapist=request.user,
            is_active=True,
        ).values_list("patient_id", flat=True)

        patients = (
            User.objects.filter(id__in=assigned_patient_ids, role="PATIENT")
            .annotate(
                patient_name=Concat(
                    F("first_name"),
                    Value(" "),
                    Coalesce(F("last_name"), Value("")),
                ),
                total_sessions_all_time=Count("sessions", distinct=True),
                completed_all_time=Count(
                    "sessions",
                    filter=Q(sessions__status=Session.StatusChoices.COMPLETED),
                    distinct=True,
                ),
                last_session_date=Max(TruncDate("sessions__start_time")),
            )
            .order_by("first_name", "last_name")
        )

        payload = [
            {
                "patient_id": patient.id,
                "patient_name": patient.patient_name,
                "total_sessions_all_time": patient.total_sessions_all_time,
                "completed_all_time": patient.completed_all_time,
                "current_streak": calculate_streak(patient),
                "last_session_date": patient.last_session_date,
            }
            for patient in patients
        ]

        return Response(PatientProgressSummarySerializer(payload, many=True).data)
