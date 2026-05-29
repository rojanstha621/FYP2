from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    RegisterView,
    VerifyEmailView,
    ProfileUpdateView,
    AdminUserListView,
    AdminUserDetailView,
    PendingTherapistsListView,
    ApproveTherapistView,
    RejectTherapistView,
    ApprovedTherapistsListView,
    ApprovedTherapistDetailView,
    PatientDashboardView,
    ProfilePictureDBView,
    CareTeamDirectoryView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path(
        "users/<uuid:id>/profile-picture/",
        ProfilePictureDBView.as_view(),
        name="profile-picture-db",
    ),
    # Optional:
    path(
        "me/profile-update/",
        ProfileUpdateView.as_view(),
        name="profile-update",
    ),
    # admin url
    path("users/", AdminUserListView.as_view(), name="admin-users-list"),
    path("users/<uuid:id>/", AdminUserDetailView.as_view(), name="admin-users-detail"),
    # Therapist management - specific paths BEFORE parameterized paths
    path("therapists/pending/", PendingTherapistsListView.as_view(), name="therapists-pending"),
    path("therapists/approved/", ApprovedTherapistsListView.as_view(), name="therapists-approved"),
    path("therapists/<uuid:id>/approve/", ApproveTherapistView.as_view(), name="therapists-approve"),
    path("therapists/<uuid:id>/reject/", RejectTherapistView.as_view(), name="therapists-reject"),
    path("therapists/<uuid:id>/", ApprovedTherapistDetailView.as_view(), name="therapist-detail"),
    path("care-team/", CareTeamDirectoryView.as_view(), name="care-team-directory"),
    # Patient dashboard
    path("dashboard/patient/", PatientDashboardView.as_view(), name="patient-dashboard"),
]
