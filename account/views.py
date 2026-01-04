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
)
from .permissions import IsAdminRole

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


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    queryset = User.objects.all()
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer
