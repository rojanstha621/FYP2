from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from account.manager import CustomUserManager
from django.conf import settings


class User(AbstractUser):

    class RoleChoices(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        PARENT = "PATIENT", _("Patient")
        BABYSITTER = "THERAPIST", _("Therapist")

    class TherapistStatusChoices(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        APPROVED = "APPROVED", _("Approved")
        REJECTED = "REJECTED", _("Rejected")

    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        help_text=_("Designates the role of the user in the system."),
    )

    # Therapist approval workflow
    therapist_status = models.CharField(
        max_length=20,
        choices=TherapistStatusChoices.choices,
        blank=True,
        null=True,
        help_text=_("Approval status for therapist accounts"),
    )
    is_therapist_approved = models.BooleanField(
        default=False,
        help_text=_("Convenience flag indicating therapist is approved"),
    )
    therapist_verified_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text=_("Timestamp when therapist was approved by admin"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

    objects = CustomUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def get_full_name(self):
        return (
            f"{self.first_name} {self.last_name}" if self.last_name else self.first_name
        )

    @property
    def is_approved_therapist(self):
        return (
            self.role == "THERAPIST"
            and (self.therapist_status == self.TherapistStatusChoices.APPROVED)
        )


class UserProfile(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    # Basic profile fields
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)

    bio = models.TextField(blank=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile: {self.user.email}"
