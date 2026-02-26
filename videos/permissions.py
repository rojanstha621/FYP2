from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Permission to check if user is an Admin.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsTherapistApproved(BasePermission):
    """
    Permission to check if user is an approved therapist.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "THERAPIST"
            and request.user.is_approved_therapist
        )


class IsPatientRole(BasePermission):
    """
    Permission to check if user is a Patient.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "PATIENT"
        )


class CanManageVideoAssignment(BasePermission):
    """
    Permission for therapists to manage their own video assignments.
    """
    
    def has_permission(self, request, view):
        # Must be an approved therapist
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "THERAPIST"
            and request.user.is_approved_therapist
        )
    
    def has_object_permission(self, request, view, obj):
        # Therapist can only manage their own assignments
        return obj.therapist == request.user


class IsAssignedPatient(BasePermission):
    """
    Permission for patients to view only their assigned videos.
    """
    
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "PATIENT"
        )
    
    def has_object_permission(self, request, view, obj):
        # Patient can only view videos assigned to them
        return obj.patient == request.user
