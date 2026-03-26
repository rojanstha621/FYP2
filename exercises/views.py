from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend

from myproject.utils import APIResponse, api_response, api_error
from myproject.pagination import StandardPagination
from .models import Exercise
from .serializers import (
    ExerciseSerializer,
    ExerciseListSerializer,
    ExerciseCreateUpdateSerializer,
    ExercisePlanSerializer,
    ExercisePlanCreateSerializer,
)
from .permissions import IsTherapistOrAdmin
from .models import ExercisePlan
from rest_framework.decorators import action


class ExerciseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing exercises.
    - Therapists/Admins: Full CRUD
    - Patients: Read-only
    - Supports filtering by target_area, difficulty
    - Supports search by name, description
    """

    queryset = Exercise.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated, IsTherapistOrAdmin]
    pagination_class = StandardPagination
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["target_area", "difficulty", "is_active"]
    search_fields = ["name", "description", "target_area"]
    ordering_fields = ["created_at", "name", "difficulty"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """
        Use different serializers for different actions.
        """
        if self.action == "list":
            return ExerciseListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ExerciseCreateUpdateSerializer
        return ExerciseSerializer

    def get_queryset(self):
        """
        Admins and therapists can see all exercises (including inactive).
        Patients see only active exercises.
        """
        user = self.request.user

        if user.role in ["ADMIN", "THERAPIST"]:
            # Show all exercises for admins/therapists
            return Exercise.objects.all()

        # Show only active exercises for patients
        return Exercise.objects.filter(is_active=True)

    def list(self, request, *args, **kwargs):
        """
        List exercises with filtering and search.
        """
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return APIResponse.send(
            is_success=True,
            message="Exercises retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific exercise.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        return APIResponse.send(
            is_success=True,
            message="Exercise retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        """
        Create a new exercise. Only therapists/admins allowed.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Get full exercise details with ExerciseSerializer
        exercise = Exercise.objects.get(id=serializer.instance.id)
        response_serializer = ExerciseSerializer(exercise)

        return APIResponse.send(
            is_success=True,
            message="Exercise created successfully",
            result=response_serializer.data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """
        Update an exercise. Only therapists/admins allowed.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Get full exercise details
        response_serializer = ExerciseSerializer(instance)

        return APIResponse.send(
            is_success=True,
            message="Exercise updated successfully",
            result=response_serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Delete an exercise. Only therapists/admins allowed.
        """
        instance = self.get_object()
        self.perform_destroy(instance)

        return APIResponse.send(
            is_success=True,
            message="Exercise deleted successfully",
            status_code=status.HTTP_200_OK,
        )


class ExercisePlanViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    queryset = ExercisePlan.objects.select_related("patient", "therapist", "exercise").all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "frequency", "patient", "exercise"]
    search_fields = ["patient__first_name", "patient__last_name", "exercise__name"]
    ordering_fields = ["created_at", "assigned_date", "scheduled_date"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ExercisePlanCreateSerializer
        return ExercisePlanSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return ExercisePlan.objects.select_related("patient", "therapist", "exercise").all()

        if user.role == "THERAPIST":
            return ExercisePlan.objects.select_related("patient", "therapist", "exercise").filter(
                therapist=user
            )

        if user.role == "PATIENT":
            return ExercisePlan.objects.select_related("patient", "therapist", "exercise").filter(
                patient=user,
                is_active=True,
            )

        return ExercisePlan.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = ExercisePlanSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ExercisePlanSerializer(queryset, many=True)
        return api_response(
            data=serializer.data,
            message="Exercise plans retrieved successfully",
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        plan = self.get_object()
        serializer = ExercisePlanSerializer(plan)
        return api_response(
            data=serializer.data,
            message="Exercise plan retrieved successfully",
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        if request.user.role != "THERAPIST":
            return api_error(
                message="Only therapists can create exercise plans.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save(therapist=request.user)
        return api_response(
            data=ExercisePlanSerializer(plan).data,
            message="Exercise plan created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        if request.user.role != "THERAPIST":
            return api_error(
                message="Only therapists can update exercise plans.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        if instance.therapist_id != request.user.id:
            return api_error(
                message="You can only update your own plans.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save(therapist=request.user)
        return api_response(
            data=ExercisePlanSerializer(plan).data,
            message="Exercise plan updated successfully",
            status_code=status.HTTP_200_OK,
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "THERAPIST":
            return api_error(
                message="Only therapists can delete exercise plans.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        if instance.therapist_id != request.user.id:
            return api_error(
                message="You can only delete your own plans.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        self.perform_destroy(instance)
        return api_response(
            data=None,
            message="Exercise plan deleted successfully",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        if request.user.role != "THERAPIST":
            return api_error(
                message="Only therapists can toggle plan status.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        plan = self.get_object()
        if plan.therapist_id != request.user.id:
            return api_error(
                message="You can only toggle your own plans.",
                code="permission_denied",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        plan.is_active = not plan.is_active
        plan.save(update_fields=["is_active"])
        return api_response(
            data=ExercisePlanSerializer(plan).data,
            message="Exercise plan status updated successfully",
            status_code=status.HTTP_200_OK,
        )

