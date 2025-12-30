from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    RegisterView,
    ProfileUpdateView,
    AdminUserListView,
    AdminUserDetailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Optional:
    path(
        "me/profile-update/",
        ProfileUpdateView.as_view(),
        name="profile-update",
    ),
    # admin url
    path("users/", AdminUserListView.as_view(), name="admin-users-list"),
    path("users/<uuid:id>/", AdminUserDetailView.as_view(), name="admin-users-detail"),
]
