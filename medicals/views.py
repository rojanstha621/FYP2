from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from myproject.utils import APIResponse
from .models import MedicalHistory, TherapistPatientAssignment, NursePatientAssignment, Appointment, Vitals, NursingNote
from .serializers import (
    MedicalHistorySerializer,
    MedicalHistoryDetailSerializer,
    TherapistPatientAssignmentSerializer,
    MyPatientsSerializer,
    MyTherapistsSerializer,
    NursePatientAssignmentSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    VitalsSerializer,
    NursingNoteSerializer,
)
from .permissions import (
    IsPatientOrTherapistReadOnly,
    IsTherapistReadOnly,
    IsPatientOwner,
)
from account.permissions import IsPatient


class MedicalHistoryViewSet(viewsets.ModelViewSet):

    queryset = MedicalHistory.objects.all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated]

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

        elif user.role == "NURSE":
            assigned_patients = NursePatientAssignment.objects.filter(
                nurse=user, is_active=True
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
        Create medical history. Nurses and admins can create records.
        """
        if request.user.role not in ["NURSE", "ADMIN"]:
            return APIResponse.send(
                is_success=False,
                message="Only nurses or admins can create medical history",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if request.user.role == "NURSE":
            patient = serializer.validated_data["patient"]
            nurse_assignment_exists = NursePatientAssignment.objects.filter(
                nurse=request.user,
                patient=patient,
                is_active=True,
            ).exists()
            if not nurse_assignment_exists:
                return APIResponse.send(
                    is_success=False,
                    message="Nurse is not assigned to this patient",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            serializer.save(created_by_nurse=request.user, updated_by_nurse=request.user)
        else:
            serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Medical history created successfully",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        """
        Update medical history. Nurses and admins can update records.
        """
        if request.user.role not in ["NURSE", "ADMIN"]:
            return APIResponse.send(
                is_success=False,
                message="Only nurses or admins can update medical history",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if request.user.role == "NURSE":
            nurse_assignment_exists = NursePatientAssignment.objects.filter(
                nurse=request.user,
                patient=instance.patient,
                is_active=True,
            ).exists()
            if not nurse_assignment_exists:
                return APIResponse.send(
                    is_success=False,
                    message="Nurse is not assigned to this patient",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            serializer.save(updated_by_nurse=request.user)
        else:
            serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Medical history updated successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        """
        Delete medical history. Nurses and admins can delete records.
        """
        if request.user.role not in ["NURSE", "ADMIN"]:
            return APIResponse.send(
                is_success=False,
                message="Only nurses or admins can delete medical history",
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
        - Nurses: Assignments for patients under their care
        - Patients: Their own assignments
        """
        user = self.request.user

        if user.role == "ADMIN":
            return TherapistPatientAssignment.objects.all()

        elif user.role == "THERAPIST":
            return TherapistPatientAssignment.objects.filter(therapist=user)

        elif user.role == "NURSE":
            assigned_patients = NursePatientAssignment.objects.filter(
                nurse=user, is_active=True
            ).values_list("patient_id", flat=True)
            return TherapistPatientAssignment.objects.filter(
                patient_id__in=assigned_patients,
                is_active=True,
            ).select_related("therapist", "patient")

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
        Create assignment. Admins, nurses, or approved therapists.
        """
        if not (
            request.user.role in ["ADMIN", "NURSE"]
            or getattr(request.user, "is_approved_therapist", False)
        ):
            return APIResponse.send(
                is_success=False,
                message="Only admins, nurses, or approved therapists can create assignments",
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
        Update assignment. Admins, nurses, or approved therapists can update assignments.
        """
        if not (
            request.user.role in ["ADMIN", "NURSE"]
            or getattr(request.user, "is_approved_therapist", False)
        ):
            return APIResponse.send(
                is_success=False,
                message="Only admins, nurses, or approved therapists can update assignments",
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
        Delete assignment. Admins, nurses, or approved therapists.
        """
        if not (
            request.user.role in ["ADMIN", "NURSE"]
            or getattr(request.user, "is_approved_therapist", False)
        ):
            return APIResponse.send(
                is_success=False,
                message="Only admins, nurses, or approved therapists can delete assignments",
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


class RejectAssignmentView(APIView):
    """Therapist or admin can reject/delete a pending assignment request"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):
        try:
            assignment = TherapistPatientAssignment.objects.get(id=id, is_active=False)
        except TherapistPatientAssignment.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Assignment not found or already active",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        # Only therapist of the assignment or admin can reject
        if request.user.role != "ADMIN" and request.user.id != assignment.therapist.id:
            return APIResponse.send(
                is_success=False,
                message="You do not have permission to reject this assignment",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        patient_email = assignment.patient.email
        assignment.delete()

        return APIResponse.send(
            is_success=True,
            message=f"Assignment request from {patient_email} has been rejected",
            status_code=status.HTTP_200_OK,
        )


class NursePatientAssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NursePatientAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return NursePatientAssignment.objects.select_related("nurse", "patient")
        if user.role == "NURSE":
            return NursePatientAssignment.objects.select_related("nurse", "patient").filter(
                nurse=user
            )
        if user.role == "THERAPIST":
            return (
                NursePatientAssignment.objects.select_related("nurse", "patient")
                .filter(
                    patient__assigned_therapists__therapist=user,
                    patient__assigned_therapists__is_active=True,
                )
                .distinct()
            )
        if user.role == "PATIENT":
            return NursePatientAssignment.objects.select_related("nurse", "patient").filter(
                patient=user,
                is_active=True,
            )
        return NursePatientAssignment.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE", "THERAPIST"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins, nurses, or therapists can create nurse assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        if request.user.role == "NURSE":
            data["nurse"] = str(request.user.id)
        elif request.user.role == "THERAPIST":
            patient_id = data.get("patient")
            if not patient_id:
                return APIResponse.send(
                    is_success=False,
                    message="Patient is required",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

            therapist_assignment_exists = TherapistPatientAssignment.objects.filter(
                therapist=request.user,
                patient_id=patient_id,
                is_active=True,
            ).exists()
            if not therapist_assignment_exists:
                return APIResponse.send(
                    is_success=False,
                    message="You can only assign nurses to your own patients",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Nurse assignment created successfully",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can update nurse assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return APIResponse.send(
            is_success=True,
            message="Nurse assignment updated successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        # Allow admins, nurses, or therapists (for their own patients) to deactivate
        if request.user.role not in ["ADMIN", "NURSE", "THERAPIST"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins, nurses, or therapists can deactivate nurse assignments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()

        # If therapist, ensure they are assigned to the patient
        if request.user.role == "THERAPIST":
            therapist_assignment_exists = TherapistPatientAssignment.objects.filter(
                therapist=request.user,
                patient=instance.patient,
                is_active=True,
            ).exists()
            if not therapist_assignment_exists:
                return APIResponse.send(
                    is_success=False,
                    message="You can only unassign nurses from your own patients",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

        instance.is_active = False
        instance.save(update_fields=["is_active"])

        return APIResponse.send(
            is_success=True,
            message="Nurse assignment deactivated successfully",
            result=NursePatientAssignmentSerializer(instance).data,
            status_code=status.HTTP_200_OK,
        )


class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related("nurse", "patient", "therapist", "created_by")

        if user.role == "ADMIN":
            return queryset
        if user.role == "NURSE":
            return queryset.filter(nurse=user)
        if user.role == "THERAPIST":
            return queryset.filter(therapist=user)
        if user.role == "PATIENT":
            return queryset.filter(patient=user)
        return queryset.none()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can create appointments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        if request.user.role == "NURSE":
            data["nurse"] = str(request.user.id)

        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        return APIResponse.send(
            is_success=True,
            message="Appointment created successfully",
            result=AppointmentSerializer(appointment).data,
            status_code=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can update appointments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        return APIResponse.send(
            is_success=True,
            message="Appointment updated successfully",
            result=AppointmentSerializer(appointment).data,
            status_code=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can cancel appointments",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        instance = self.get_object()
        instance.status = Appointment.StatusChoices.CANCELLED
        instance.save(update_fields=["status"])

        return APIResponse.send(
            is_success=True,
            message="Appointment cancelled successfully",
            result=AppointmentSerializer(instance).data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], url_path="check-in")
    def check_in(self, request, pk=None):
        """Mark appointment as checked-in. Nurses/admins only."""
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can check in patients",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        appointment = self.get_object()
        appointment.status = Appointment.StatusChoices.CHECKED_IN
        appointment.save(update_fields=["status"]) 

        return APIResponse.send(
            is_success=True,
            message="Appointment checked-in successfully",
            result=AppointmentSerializer(appointment).data,
            status_code=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], url_path="assign-doctor")
    def assign_doctor(self, request, pk=None):
        """Assign a doctor to the appointment. Nurses/admins can assign."""
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can assign a doctor",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        doctor_id = request.data.get("doctor")
        if not doctor_id:
            return APIResponse.send(
                is_success=False,
                message="doctor is required",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        from account.models import User
        try:
            doctor = User.objects.get(id=doctor_id, role="DOCTOR")
        except User.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Doctor not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        appointment = self.get_object()
        appointment.doctor = doctor
        appointment.save(update_fields=["doctor"]) 

        return APIResponse.send(
            is_success=True,
            message="Doctor assigned successfully",
            result=AppointmentSerializer(appointment).data,
            status_code=status.HTTP_200_OK,
        )


class VitalsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = VitalsSerializer
    queryset = Vitals.objects.select_related("patient", "nurse").all()

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return Vitals.objects.select_related("patient", "nurse").all()
        if user.role == "NURSE":
            # Nurses see vitals they recorded or for their assigned patients
            assigned = NursePatientAssignment.objects.filter(nurse=user, is_active=True).values_list("patient_id", flat=True)
            return Vitals.objects.filter(patient_id__in=assigned)
        if user.role == "PATIENT":
            return Vitals.objects.filter(patient=user)
        return Vitals.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can record vitals",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        if request.user.role == "NURSE":
            data["nurse"] = str(request.user.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return APIResponse.send(
            is_success=True,
            message="Vitals recorded successfully",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )


class NursingNoteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NursingNoteSerializer
    queryset = NursingNote.objects.select_related("patient", "nurse").all()

    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN":
            return NursingNote.objects.select_related("patient", "nurse").all()
        if user.role == "NURSE":
            # Nurses see notes they wrote or for their assigned patients
            assigned = NursePatientAssignment.objects.filter(nurse=user, is_active=True).values_list("patient_id", flat=True)
            return NursingNote.objects.filter(patient_id__in=assigned)
        if user.role == "PATIENT":
            return NursingNote.objects.filter(patient=user)
        return NursingNote.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ["ADMIN", "NURSE"]:
            return APIResponse.send(
                is_success=False,
                message="Only admins or nurses can create nursing notes",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        data = request.data.copy()
        if request.user.role == "NURSE":
            data["nurse"] = str(request.user.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return APIResponse.send(
            is_success=True,
            message="Nursing note created successfully",
            result=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )
