from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics

from rest_framework_simplejwt.tokens import RefreshToken

from myproject.utils import APIResponse
from .models import UserProfile
from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    MeSerializer,
    UserBasicSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    RegisterSerializer,
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserUpdateSerializer,
    TherapistSummarySerializer,
    TherapistPublicDetailSerializer,
    PatientDashboardSerializer,
)
from .permissions import IsAdminRole
from account.permissions import IsPatient

from .models import User


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        result = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
        return APIResponse.send(
            is_success=True,
            message="Login successful",
            result=result,
            status_code=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    JWT logout = blacklist refresh token.
    Frontend should send refresh token.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return APIResponse.send(
            is_success=True,
            message="Logged out successfully",
            status_code=status.HTTP_200_OK,
        )


class MeView(APIView):
    """
    Get current user + profile. Ensures profile exists.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        data = {
            "user": UserBasicSerializer(request.user).data,
            "profile": UserProfileSerializer(profile).data,
        }
        return APIResponse.send(
            is_success=True,
            message="User profile retrieved",
            result=data,
            status_code=status.HTTP_200_OK,
        )

    def patch(self, request):
        """
        Update basic user info + profile info in one request.
        Supports profile_picture upload (multipart).
        """
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        user_serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        user_serializer.is_valid(raise_exception=True)
        user_serializer.save()

        profile_serializer = UserProfileSerializer(
            profile, data=request.data, partial=True
        )
        profile_serializer.is_valid(raise_exception=True)
        profile_serializer.save()

        data = {
            "user": UserBasicSerializer(request.user).data,
            "profile": UserProfileSerializer(profile).data,
        }
        return APIResponse.send(
            is_success=True,
            message="Profile updated successfully",
            result=data,
            status_code=status.HTTP_200_OK,
        )


class ProfileUpdateView(APIView):
    """
    Optional separate endpoint just for image upload.
    Use this only if you want a dedicated endpoint.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["patch"]

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Profile updated successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return APIResponse.send(
            is_success=True,
            message="Password updated successfully",
            status_code=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Registration successful. Please log in.",
            status_code=status.HTTP_201_CREATED,
        )


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = AdminUserListSerializer
    pagination_class = None


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = User.objects.all()
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer


class PendingTherapistsListView(generics.ListAPIView):
    """
    List all therapists with PENDING status.
    Admin-only.
    """

    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        return User.objects.filter(role="THERAPIST", therapist_status=User.TherapistStatusChoices.PENDING)


class ApproveTherapistView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, id):
        try:
            therapist = User.objects.get(id=id, role="THERAPIST")
        except User.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Therapist not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        therapist.therapist_status = User.TherapistStatusChoices.APPROVED
        therapist.is_therapist_approved = True
        from django.utils import timezone
        therapist.therapist_verified_at = timezone.now()
        therapist.save(update_fields=["therapist_status", "is_therapist_approved", "therapist_verified_at"]) 

        return APIResponse.send(
            is_success=True,
            message="Therapist approved",
            result=AdminUserDetailSerializer(therapist).data,
            status_code=status.HTTP_200_OK,
        )


class RejectTherapistView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, id):
        try:
            therapist = User.objects.get(id=id, role="THERAPIST")
        except User.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Therapist not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        therapist.therapist_status = User.TherapistStatusChoices.REJECTED
        therapist.is_therapist_approved = False
        therapist.save(update_fields=["therapist_status", "is_therapist_approved"]) 

        return APIResponse.send(
            is_success=True,
            message="Therapist rejected",
            result=AdminUserDetailSerializer(therapist).data,
            status_code=status.HTTP_200_OK,
        )


class ApprovedTherapistsListView(generics.ListAPIView):
    """List all approved therapists; restricted to patients"""
    permission_classes = [IsAuthenticated, IsPatient]
    serializer_class = TherapistSummarySerializer
    pagination_class = None

    def get_queryset(self):
        from .models import User
        return User.objects.filter(
            role="THERAPIST",
            therapist_status=User.TherapistStatusChoices.APPROVED,
        ).order_by("first_name", "last_name")


class ApprovedTherapistDetailView(APIView):
    """Retrieve a single approved therapist's public summary"""
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        from .models import User
        try:
            therapist = User.objects.get(id=id, role="THERAPIST")
        except User.DoesNotExist:
            return APIResponse.send(
                is_success=False,
                message="Therapist not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if therapist.therapist_status != User.TherapistStatusChoices.APPROVED:
            return APIResponse.send(
                is_success=False,
                message="Therapist is not approved",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        data = TherapistPublicDetailSerializer(therapist).data
        return APIResponse.send(
            is_success=True,
            message="Therapist details",
            result=data,
            status_code=status.HTTP_200_OK,
        )


class PatientDashboardView(APIView):
    """
    Patient-only endpoint for dashboard.
    Returns patient info, assigned therapist, today's exercises, and progress summary.
    """
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        """
        GET /dashboard/patient/
        
        Returns dashboard data for the authenticated patient.
        Includes assigned therapist (if any), today's exercises, and progress summary.
        """
        user = request.user

        # Serialize the patient data
        serializer = PatientDashboardSerializer(user)

        return APIResponse.send(
            is_success=True,
            message="Patient dashboard retrieved",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )
