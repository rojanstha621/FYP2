# views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer

# ----------------------
# Register
# ----------------------  
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"message": "User registered successfully", "user": serializer.data}, status=status.HTTP_201_CREATED)


# ----------------------
# Login
# ----------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # 🔴 FIX HERE: use username=email
        user = authenticate(request, username=email, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })

        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
# ----------------------
# CRUD for Users (Superadmin only)
# ----------------------
class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]  # Only superadmin

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]  # Only superadmin
