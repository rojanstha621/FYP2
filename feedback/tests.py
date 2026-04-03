from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from account.models import User
from medicals.models import TherapistPatientAssignment

from .models import Feedback


class FeedbackAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.therapist = User.objects.create_user(
            email="therapist@test.com",
            password="testpass123",
            first_name="Thera",
            last_name="Pist",
            role="THERAPIST",
            therapist_status="APPROVED",
            is_therapist_approved=True,
        )

        self.patient = User.objects.create_user(
            email="patient@test.com",
            password="testpass123",
            first_name="Pat",
            last_name="Ient",
            role="PATIENT",
        )

        self.other_patient = User.objects.create_user(
            email="other@test.com",
            password="testpass123",
            first_name="Other",
            last_name="Patient",
            role="PATIENT",
        )

        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Ad",
            last_name="Min",
            role="ADMIN",
            is_staff=True,
        )

        TherapistPatientAssignment.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            is_active=True,
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    def test_therapist_can_create_feedback_for_assigned_patient(self):
        self._auth(self.therapist)

        response = self.client.post(
            "/api/feedback/feedback/",
            {
                "patient": str(self.patient.id),
                "message": "Great effort today.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feedback.objects.count(), 1)
        feedback = Feedback.objects.first()
        self.assertEqual(feedback.therapist, self.therapist)
        self.assertEqual(feedback.patient, self.patient)

    def test_patient_can_view_their_feedback(self):
        Feedback.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            message="Keep your posture steady.",
        )

        self._auth(self.patient)
        response = self.client.get("/api/feedback/feedback/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)

    def test_patient_can_mark_feedback_as_read(self):
        feedback = Feedback.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            message="Good progress.",
            is_read=False,
        )

        self._auth(self.patient)
        response = self.client.post(f"/api/feedback/feedback/{feedback.id}/mark_read/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        feedback.refresh_from_db()
        self.assertTrue(feedback.is_read)

    def test_patient_can_get_unread_count(self):
        Feedback.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            message="Msg 1",
            is_read=False,
        )
        Feedback.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            message="Msg 2",
            is_read=False,
        )

        self._auth(self.patient)
        response = self.client.get("/api/feedback/feedback/unread_count/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["unread_count"], 2)

    def test_therapist_cannot_create_feedback_for_unassigned_patient(self):
        self._auth(self.therapist)

        response = self.client.post(
            "/api/feedback/feedback/",
            {
                "patient": str(self.other_patient.id),
                "message": "Should fail",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Feedback.objects.count(), 0)
