from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from myproject.utils import APIResponse
from .models import MedicalHistory, TherapistPatientAssignment
from .serializers import (
    MedicalHistorySerializer,
    MedicalHistoryDetailSerializer,
    TherapistPatientAssignmentSerializer,
    MyPatientsSerializer,
    MyTherapistsSerializer,
)
from .permissions import (
    IsPatientOrTherapistReadOnly,
    IsTherapistReadOnly,
    IsPatientOwner,
)
from account.permissions import IsTherapistApproved, IsPatient, IsAdminOrStaff


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
        Create assignment. Admins or approved therapists.
        """
        if not (
            request.user.role == "ADMIN" or getattr(request.user, "is_approved_therapist", False)
        ):
            return APIResponse.send(
                is_success=False,
                message="Only admins or approved therapists can create assignments",
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
        Update assignment. Admins or approved therapists can update their assignment.
        """
        if not (
            request.user.role == "ADMIN" or getattr(request.user, "is_approved_therapist", False)
        ):
            return APIResponse.send(
                is_success=False,
                message="Only admins or approved therapists can update assignments",
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
        Delete assignment. Admins or approved therapists.
        """
        if not (
            request.user.role == "ADMIN" or getattr(request.user, "is_approved_therapist", False)
        ):
            return APIResponse.send(
                is_success=False,
                message="Only admins or approved therapists can delete assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        self.perform_destroy(instance)

        return APIResponse.send(
            is_success=True,
            message="Assignment deleted successfully",
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="my-patients")
    def my_patients(self, request):
        """
        Get therapist's assigned patients.
        Only accessible by therapists.
        """
        if request.user.role != "THERAPIST":
            return APIResponse.send(
                is_success=False,
                message="Only therapists can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # Get active assignments for this therapist
        assignments = TherapistPatientAssignment.objects.filter(
            therapist=request.user, is_active=True
        ).select_related("patient")

        serializer = MyPatientsSerializer(assignments, many=True)

        return APIResponse.send(
            is_success=True,
            message="Your assigned patients retrieved successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="my-therapists")
    def my_therapists(self, request):
        """
        Get patient's assigned therapists.
        Only accessible by patients.
        """
        if request.user.role != "PATIENT":
            return APIResponse.send(
                is_success=False,
                message="Only patients can access this endpoint",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # Get active assignments for this patient
        assignments = TherapistPatientAssignment.objects.filter(
            patient=request.user, is_active=True
        ).select_related("therapist")

        serializer = MyTherapistsSerializer(assignments, many=True)
        # Filter out None representations (non-approved therapists)
        data = [x for x in serializer.data if x is not None]

        return APIResponse.send(
            is_success=True,
            message="Your assigned therapists retrieved successfully",
            result=data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], url_path="toggle-status")
    def toggle_status(self, request, pk=None):
        """
        Toggle assignment active/inactive status.
        Only accessible by admins.
        """
        if request.user.role != "ADMIN":
            return APIResponse.send(
                is_success=False,
                message="Only admins can toggle assignment status",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        assignment = self.get_object()
        assignment.is_active = not assignment.is_active
        assignment.save()

        serializer = self.get_serializer(assignment)
        status_text = "activated" if assignment.is_active else "deactivated"

        return APIResponse.send(
            is_success=True,
            message=f"Assignment {status_text} successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class PatientDashboardView(APIView):
    """Patient dashboard data including assigned approved therapists and all available therapists"""

    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        patient = request.user

        # Get assigned therapists
        assignments = TherapistPatientAssignment.objects.filter(
            patient=patient, is_active=True
        ).select_related("therapist")

        assigned_therapists = []
        for a in assignments:
            t = a.therapist
            if getattr(t, "is_approved_therapist", False):
                assigned_therapists.append(
                    {
                        "id": str(t.id),
                        "first_name": t.first_name,
                        "last_name": t.last_name,
                        "email": t.email,
                        "phone_number": t.phone_number,
                    }
                )

        # Get all approved therapists
        from account.models import User
        all_therapists = User.objects.filter(
            role="THERAPIST",
            therapist_status=User.TherapistStatusChoices.APPROVED,
        ).order_by("first_name", "last_name")

        available_therapists = [
            {
                "id": str(t.id),
                "first_name": t.first_name,
                "last_name": t.last_name,
                "email": t.email,
                "phone_number": t.phone_number,
            }
            for t in all_therapists
        ]

        result = {
            "patient": {
                "id": str(patient.id),
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "email": patient.email,
                "phone_number": patient.phone_number,
            },
            "assigned_therapists": assigned_therapists,
            "available_therapists": available_therapists,
        }

        return APIResponse.send(
            is_success=True,
            message="Patient dashboard data",
            result=result,
            status_code=status.HTTP_200_OK,
        )


class AssignmentRequestView(APIView):
    """Patients can request an assignment with an approved therapist"""
    permission_classes = [IsAuthenticated, IsPatient]

    def post(self, request):
        therapist_id = request.data.get("therapist_id")
        if not therapist_id:
            return APIResponse.send(
                is_success=False,
                message="therapist_id is required",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        from account.models import User
        try:
            therapist = User.objects.get(id=therapist_id, role="THERAPIST")
        except User.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Therapist not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if not getattr(therapist, "is_approved_therapist", False):
            return APIResponse.send(
                is_success=False,
                message="Therapist is not approved",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        patient = request.user

        # Check existing assignment
        existing = TherapistPatientAssignment.objects.filter(
            therapist=therapist, patient=patient
        ).first()
        if existing:
            if existing.is_active:
                return APIResponse.send(
                    is_success=False,
                    message="You are already assigned to this therapist",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return APIResponse.send(
                    is_success=False,
                    message="You have a pending request for this therapist",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        # Create as inactive (pending approval)
        assignment = TherapistPatientAssignment.objects.create(
            therapist=therapist,
            patient=patient,
            is_active=False,
        )

        serializer = TherapistPatientAssignmentSerializer(assignment)
        return APIResponse.send(
            is_success=True,
            message="Assignment request submitted",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )


class PendingAssignmentsView(generics.ListAPIView):
    """List pending assignments; admins see all, therapists see their requests"""
    permission_classes = [IsAuthenticated]
    serializer_class = TherapistPatientAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            # Admins see all pending
            return TherapistPatientAssignment.objects.filter(is_active=False)
        elif user.role == "THERAPIST":
            # Therapists see pending requests from their patients
            return TherapistPatientAssignment.objects.filter(
                therapist=user, is_active=False
            ).select_related("patient")
        return TherapistPatientAssignment.objects.none()


class ActivateAssignmentView(APIView):
    """Therapist or admin can activate a pending assignment"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        try:
            assignment = TherapistPatientAssignment.objects.get(id=id, is_active=False)
        except TherapistPatientAssignment.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Assignment not found or already active",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Only therapist of the assignment or admin can activate
        if request.user.role != "ADMIN" and request.user.id != assignment.therapist.id:
            return APIResponse.send(
                is_success=False,
                message="You do not have permission to activate this assignment",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        assignment.is_active = True
        assignment.save(update_fields=["is_active"])

        serializer = TherapistPatientAssignmentSerializer(assignment)
        return APIResponse.send(
            is_success=True,
            message="Assignment activated",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )
