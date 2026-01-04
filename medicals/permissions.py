from rest_framework.permissions import BasePermission


class IsPatientOrTherapistReadOnly(BasePermission):
    """
    - Patients can only view their own medical history.
    - Therapists can view medical history of assigned patients (read-only).
    - Therapists cannot modify medical history.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Patient can only access their own medical history
        if user.role == "PATIENT":
            return obj.patient == user

        # Therapist can view assigned patient's medical history (read-only)
        if user.role == "THERAPIST":
            # Check if therapist has active assignment with patient
            from .models import TherapistPatientAssignment

            has_assignment = TherapistPatientAssignment.objects.filter(
                therapist=user, patient=obj.patient, is_active=True
            ).exists()

            return has_assignment


class IsTherapistReadOnly(BasePermission):
    """
    Ensures that therapists have read-only access.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            if request.user.role == "THERAPIST":
                return request.method in ["GET", "HEAD", "OPTIONS"]
            return True
        return False


class IsPatientOwner(BasePermission):
    """
    Allow patients to update only their own medical history.
    """

    def has_object_permission(self, request, view, obj):
        return obj.patient == request.user
