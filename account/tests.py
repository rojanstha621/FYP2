from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings, TestCase
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from .models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="patient@example.com",
            password="old-password123",
            first_name="Patient",
            last_name="User",
        )

    def test_password_reset_request_sends_email_for_existing_user(self):
        response = self.client.post(
            reverse("password-reset-request"),
            {"email": self.user.email},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("password reset link has been sent", response.json()["message"].lower())
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        self.assertIn("Reset your password", mail.outbox[0].subject)

    def test_password_reset_confirm_updates_password(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "uid": uid,
                "token": token,
                "new_password": "Newpassword123!",
                "confirm_new_password": "Newpassword123!",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Newpassword123!"))
        self.assertIn("password reset successful", response.json()["message"].lower())
