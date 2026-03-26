from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from medicals.models import TherapistPatientAssignment
from myproject.pagination import StandardPagination
from myproject.utils import api_response, api_error

from .models import Session, SetLog
from .serializers import SessionSerializer, SessionCreateSerializer, SetLogSerializer


class SessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    queryset = Session.objects.select_related("patient", "exercise_plan").all()

    def get_serializer_class(self):
        if self.action == "create":
            return SessionCreateSerializer
        return SessionSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Session.objects.select_related("patient", "exercise_plan").all()

        if user.role == "THERAPIST":
            assigned_patient_ids = TherapistPatientAssignment.objects.filter(
                therapist=user,
                is_active=True,
            ).values_list("patient_id", flat=True)
            return Session.objects.select_related("patient", "exercise_plan").filter(
                patient_id__in=assigned_patient_ids
            )

        if user.role == "PATIENT":
            return Session.objects.select_related("patient", "exercise_plan").filter(
                patient=user
            )

        return Session.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != "PATIENT":
            return api_error(
                message="Only patients can create sessions.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(
            patient=request.user,
            status=Session.StatusChoices.IN_PROGRESS,
            start_time=timezone.now(),
        )

        read_serializer = SessionSerializer(session, context={"request": request})
        return api_response(
            data=read_serializer.data,
            message="Session created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        session = self.get_object()

        if request.user.role != "PATIENT" or session.patient_id != request.user.id:
            return api_error(
                message="Only the session owner can complete this session.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        session.status = Session.StatusChoices.COMPLETED
        session.end_time = timezone.now()

        notes = request.data.get("notes")
        if notes is not None:
            session.notes = notes

        session.save(update_fields=["status", "end_time", "notes"])
        return api_response(
            data=SessionSerializer(session, context={"request": request}).data,
            message="Session completed successfully",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def skip(self, request, pk=None):
        session = self.get_object()

        if request.user.role != "PATIENT" or session.patient_id != request.user.id:
            return api_error(
                message="Only the session owner can skip this session.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        session.status = Session.StatusChoices.SKIPPED
        session.end_time = timezone.now()

        notes = request.data.get("notes")
        if notes is not None:
            session.notes = notes

        session.save(update_fields=["status", "end_time", "notes"])
        return api_response(
            data=SessionSerializer(session, context={"request": request}).data,
            message="Session skipped successfully",
            status_code=status.HTTP_200_OK,
        )


class SetLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SetLogSerializer
    queryset = SetLog.objects.select_related("session").all()

    def _get_session(self):
        session_pk = self.kwargs.get("session_pk")
        if session_pk is None:
            return None

        try:
            return Session.objects.get(pk=session_pk)
        except Session.DoesNotExist:
            return None

    def get_queryset(self):
        session = self._get_session()
        if session is None:
            return SetLog.objects.none()

        user = self.request.user
        if user.role != "PATIENT" or session.patient_id != user.id:
            return SetLog.objects.none()

        return SetLog.objects.filter(session=session).order_by("set_number")

    def list(self, request, *args, **kwargs):
        if request.user.role != "PATIENT":
            return api_error(
                message="Only patients can view set logs.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        session = self._get_session()
        if session is None:
            return api_error(
                message="Session not found.",
                code="not_found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if session.patient_id != request.user.id:
            return api_error(
                message="You can only view set logs for your own sessions.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(self.get_queryset(), many=True)
        return api_response(
            data=serializer.data,
            message="Set logs retrieved successfully",
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        if request.user.role != "PATIENT":
            return api_error(
                message="Only patients can create set logs.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        session = self._get_session()
        if session is None:
            return api_error(
                message="Session not found.",
                code="not_found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if session.patient_id != request.user.id:
            return api_error(
                message="You can only log sets for your own sessions.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(session=session)
        return api_response(
            data=serializer.data,
            message="Set log created successfully",
            status_code=status.HTTP_201_CREATED,
        )
