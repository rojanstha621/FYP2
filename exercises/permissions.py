from rest_framework.permissions import BasePermission


class IsTherapistOrAdmin(BasePermission):
    """
    Only therapists and admins can create, update, or delete exercises.
    All authenticated users can view exercises.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Read permissions for all authenticated users
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Write permissions only for therapists and admins
        return request.user.role in ["THERAPIST", "ADMIN"]

    def has_object_permission(self, request, view, obj):
        # Read permissions for all authenticated users
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Write permissions only for therapists and admins
        return request.user.role in ["THERAPIST", "ADMIN"]
