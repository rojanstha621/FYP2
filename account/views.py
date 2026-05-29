from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics
from django.http import HttpResponse

from rest_framework_simplejwt.tokens import RefreshToken

from myproject.utils import APIResponse
from .models import UserProfile
from medicals.models import TherapistPatientAssignment
from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    MeSerializer,
    UserBasicSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    RegisterSerializer,
    VerifyEmailSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserUpdateSerializer,
    TherapistSummarySerializer,
    TherapistPublicDetailSerializer,
    PatientDashboardSerializer,
)
from .permissions import IsAdminRole
from account.permissions import IsPatient, IsNurseOrAdmin

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
            "profile": UserProfileSerializer(profile, context={"request": request}).data,
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
            profile, data=request.data, partial=True, context={"request": request}
        )
        profile_serializer.is_valid(raise_exception=True)
        profile_serializer.save()

        data = {
            "user": UserBasicSerializer(request.user).data,
            "profile": UserProfileSerializer(profile, context={"request": request}).data,
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

        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Profile updated successfully",
            result=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class ProfilePictureDBView(APIView):
    """Serve profile picture from DB blob storage with media-file fallback."""

    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        profile = UserProfile.objects.filter(user_id=id).first()
        if not profile:
            return APIResponse.send(
                is_success=False,
                message="Profile not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if profile.profile_picture_blob:
            content_type = profile.profile_picture_content_type or "application/octet-stream"
            response = HttpResponse(profile.profile_picture_blob, content_type=content_type)
            if profile.profile_picture_name:
                response["Content-Disposition"] = (
                    f'inline; filename="{profile.profile_picture_name}"'
                )
            return response

        if profile.profile_picture:
            try:
                with profile.profile_picture.open("rb") as f:
                    data = f.read()
                response = HttpResponse(data, content_type="application/octet-stream")
                response["Content-Disposition"] = (
                    f'inline; filename="{profile.profile_picture.name.rsplit("/", 1)[-1]}"'
                )
                return response
            except Exception:
                pass

        return APIResponse.send(
            is_success=False,
            message="Profile picture not found",
            status_code=status.HTTP_404_NOT_FOUND,
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
        serializer = RegisterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Registration successful. Please check your email to verify your account.",
            status_code=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Email verified successfully. You can now log in.",
            status_code=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="If an account with that email exists, a password reset link has been sent.",
            status_code=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return APIResponse.send(
            is_success=True,
            message="Password reset successful. You can now log in.",
            status_code=status.HTTP_200_OK,
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
    """List all approved therapists; accessible to patients, nurses, and admins"""
    permission_classes = [IsAuthenticated]
    serializer_class = TherapistSummarySerializer
    pagination_class = None

    def get_queryset(self):
        from .models import User
        return User.objects.filter(
            role="THERAPIST",
            therapist_status=User.TherapistStatusChoices.APPROVED,
        ).order_by("first_name", "last_name")

    def get(self, request, *args, **kwargs):
        if request.user.role not in {"PATIENT", "NURSE", "ADMIN"}:
            return APIResponse.send(
                is_success=False,
                message="You do not have permission to view therapists",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        return super().get(request, *args, **kwargs)


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
    Returns patient info and assigned therapist.
    """
    permission_classes = [IsAuthenticated, IsPatient]

    def get(self, request):
        """
        GET /dashboard/patient/
        
        Returns dashboard data for the authenticated patient.
        Includes assigned therapist (if any).
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


class CareTeamDirectoryView(APIView):
    """Nurses and admins can fetch patients and approved therapists from one endpoint."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import User

        nurses = User.objects.filter(role="NURSE").order_by("first_name", "last_name")

        if request.user.role == "THERAPIST":
            patient_ids = TherapistPatientAssignment.objects.filter(
                therapist=request.user,
                is_active=True,
            ).values_list("patient_id", flat=True)
            patients = User.objects.filter(id__in=patient_ids).order_by("first_name", "last_name")

            payload = {
                "nurses": UserBasicSerializer(nurses, many=True).data,
                "patients": UserBasicSerializer(patients, many=True).data,
                "therapists": [],
            }
        else:
            patients = User.objects.filter(role="PATIENT").order_by("first_name", "last_name")
            therapists = User.objects.filter(
                role="THERAPIST",
                therapist_status=User.TherapistStatusChoices.APPROVED,
            ).order_by("first_name", "last_name")

            payload = {
                "nurses": UserBasicSerializer(nurses, many=True).data,
                "patients": UserBasicSerializer(patients, many=True).data,
                "therapists": AdminUserListSerializer(therapists, many=True).data,
            }

        return APIResponse.send(
            is_success=True,
            message="Care team directory retrieved",
            result=payload,
            status_code=status.HTTP_200_OK,
        )
