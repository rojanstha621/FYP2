from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from myproject.pagination import StandardPagination
from myproject.utils import api_response, api_error

from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackCreateSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    queryset = Feedback.objects.select_related("therapist", "patient").all()

    def get_serializer_class(self):
        if self.action == "create":
            return FeedbackCreateSerializer
        return FeedbackSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Feedback.objects.select_related("therapist", "patient").all()

        if user.role == "THERAPIST":
            return Feedback.objects.select_related("therapist", "patient").filter(
                therapist=user
            )

        if user.role == "PATIENT":
            return Feedback.objects.select_related("therapist", "patient").filter(
                patient=user
            )

        return Feedback.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != "THERAPIST":
            return api_error(
                message="Only therapists can create feedback.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        feedback = serializer.save(therapist=request.user)

        return api_response(
            data=FeedbackSerializer(feedback, context={"request": request}).data,
            message="Feedback created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return api_response(
            data=serializer.data,
            message="Feedback retrieved successfully",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        if request.user.role != "PATIENT":
            return api_error(
                message="Only patients can mark feedback as read.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        feedback = self.get_object()
        if feedback.patient_id != request.user.id:
            return api_error(
                message="You can only mark your own feedback as read.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        if not feedback.is_read:
            feedback.is_read = True
            feedback.save(update_fields=["is_read"])

        return api_response(
            data=FeedbackSerializer(feedback, context={"request": request}).data,
            message="Feedback marked as read",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        if request.user.role != "PATIENT":
            return api_error(
                message="Only patients can access unread count.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        count = Feedback.objects.filter(patient=request.user, is_read=False).count()
        return Response({"unread_count": count})
