from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import UserManager
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils.translation import gettext_lazy as _

from typing import Any, Optional


def validate_email_address(email: str) -> None:
    try:
        validate_email(email)
    except ValidationError:
        raise ValidationError(_("Enter a valid email address."))


class CustomUserManager(UserManager):
    def _create_user(self, email: str, password: str, **extra_fields: Any):
        if not email:
            raise ValueError(_("An email address must be provided."))

        if not password:
            raise ValueError(_("A password must be provided."))

        email = self.normalize_email(email)
        validate_email_address(email)

        user = self.model(
            email=email,
            **extra_fields,
        )
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(
        self, email: str, password: Optional[str] = None, **extra_fields: Any
    ):
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_staff", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(
        self, email: str, password: Optional[str] = None, **extra_fields: Any
    ):
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_staff", True)
        # extra_fields.setdefault("role", "superadmin")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True"))

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True"))

        return self._create_user(email, password, **extra_fields)
