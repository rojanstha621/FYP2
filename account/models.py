from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from account.manager import CustomUserManager

class User(AbstractUser):
    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',  # avoid clash
        blank=True,
        help_text=_('The groups this user belongs to.'),
        verbose_name=_('groups')
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_set',  # avoid clash
        blank=True,
        help_text=_('Specific permissions for this user.'),
        verbose_name=_('user permissions')
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
        return f"{self.first_name} {self.last_name}" if self.last_name else self.first_name
