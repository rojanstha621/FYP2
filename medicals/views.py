from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from myproject.utils import APIResponse
from .models import MedicalHistory, TherapistPatientAssignment
from .serializers import (
    MedicalHistorySerializer,
    MedicalHistoryDetailSerializer,
    TherapistPatientAssignmentSerializer,
)
from .permissions import (
    IsPatientOrTherapistReadOnly,
    IsTherapistReadOnly,
    IsPatientOwner,
)


class MedicalHistoryViewSet(viewsets.ModelViewSet):

    queryset = MedicalHistory.objects.all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [
        IsAuthenticated,
        IsPatientOrTherapistReadOnly,
        IsTherapistReadOnly,
    ]

    def get_queryset(self):

        user = self.request.user

        if user.role == "PATIENT":
            return MedicalHistory.objects.filter(patient=user)

        elif user.role == "THERAPIST":
            # Therapists can see medical history of their assigned patients
            assigned_patients = TherapistPatientAssignment.objects.filter(
                therapist=user, is_active=True
            ).values_list("patient_id", flat=True)
            return MedicalHistory.objects.filter(patient_id__in=assigned_patients)

        elif user.role == "ADMIN":
            # Admins can see all medical histories
            return MedicalHistory.objects.all()

        return MedicalHistory.objects.none()

    def get_serializer_class(self):
        """
        Use detailed serializer for retrieve, list for list action.
        """
        if self.action == "retrieve":
            return MedicalHistoryDetailSerializer
        return MedicalHistorySerializer

    def list(self, request, *args, **kwargs):
        """
        List medical histories based on user role.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return APIResponse.send(
            is_success=True,
            message="Medical histories retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific medical history.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        return APIResponse.send(
            is_success=True,
            message="Medical history retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        """
        Create medical history. Only patients can create their own.
        """
        if request.user.role != "PATIENT":
            return APIResponse.send(
                is_success=False,
                message="Only patients can create medical history",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ensure patient is the logged-in user
        if serializer.validated_data["patient"] != request.user:
            return APIResponse.send(
                is_success=False,
                message="You can only create medical history for yourself",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        self.perform_create(serializer)

        return APIResponse.send(
            is_success=True,
            message="Medical history created successfully",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """
        Update medical history. Only patients can update their own.
        """
        if request.user.role != "PATIENT":
            return APIResponse.send(
                is_success=False,
                message="Only patients can update medical history",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return APIResponse.send(
            is_success=True,
            message="Medical history updated successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Delete medical history. Only patients can delete their own.
        """
        if request.user.role != "PATIENT":
            return APIResponse.send(
                is_success=False,
                message="Only patients can delete medical history",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        self.perform_destroy(instance)

        return APIResponse.send(
            is_success=True,
            message="Medical history deleted successfully",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def my_medical_history(self, request):
        """
        Get current user's medical history (for patients).
        """
        if request.user.role != "PATIENT":
            return APIResponse.send(
                is_success=False,
                message="Only patients can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        try:
            medical_history = MedicalHistory.objects.get(patient=request.user)
            serializer = MedicalHistoryDetailSerializer(medical_history)

            return APIResponse.send(
                is_success=True,
                message="Your medical history retrieved successfully",
                result=serializer.data,
                status_code=status.HTTP_200_OK,
            )
        except MedicalHistory.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Medical history not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )


class TherapistPatientAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing therapist-patient assignments.
    Only admins can manage assignments.
    """

    queryset = TherapistPatientAssignment.objects.all()
    serializer_class = TherapistPatientAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter assignments based on user role:
        - Admins: All assignments
        - Therapists: Their own assignments
        - Patients: Their own assignments
        """
        user = self.request.user

        if user.role == "ADMIN":
            return TherapistPatientAssignment.objects.all()

        elif user.role == "THERAPIST":
            return TherapistPatientAssignment.objects.filter(therapist=user)

        elif user.role == "PATIENT":
            return TherapistPatientAssignment.objects.filter(patient=user)

        return TherapistPatientAssignment.objects.none()

    def list(self, request, *args, **kwargs):
        """
        List assignments.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        return APIResponse.send(
            is_success=True,
            message="Assignments retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific assignment.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        return APIResponse.send(
            is_success=True,
            message="Assignment retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        """
        Create assignment. Only admins can create.
        """
        if request.user.role != "ADMIN":
            return APIResponse.send(
                is_success=False,
                message="Only admins can create assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return APIResponse.send(
            is_success=True,
            message="Assignment created successfully",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """
        Update assignment. Only admins can update.
        """
        if request.user.role != "ADMIN":
            return APIResponse.send(
                is_success=False,
                message="Only admins can update assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return APIResponse.send(
            is_success=True,
            message="Assignment updated successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Delete assignment. Only admins can delete.
        """
        if request.user.role != "ADMIN":
            return APIResponse.send(
                is_success=False,
                message="Only admins can delete assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        self.perform_destroy(instance)

        return APIResponse.send(
            is_success=True,
            message="Assignment deleted successfully",
            status_code=status.HTTP_200_OK,
        )
