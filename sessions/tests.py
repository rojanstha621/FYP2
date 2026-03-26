from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from account.models import User
from exercises.models import Exercise, ExercisePlan
from medicals.models import TherapistPatientAssignment
from sessions.models import Session, SetLog


class SessionsAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.patient = User.objects.create_user(
            email="patient@test.com",
            password="testpass123",
            first_name="Pat",
            last_name="Ient",
            role="PATIENT",
        )
        self.therapist = User.objects.create_user(
            email="therapist@test.com",
            password="testpass123",
            first_name="Thera",
            last_name="Pist",
            role="THERAPIST",
            therapist_status="APPROVED",
            is_therapist_approved=True,
        )
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Ad",
            last_name="Min",
            role="ADMIN",
            is_staff=True,
        )

        self.exercise = Exercise.objects.create(
            name="Knee Flexion",
            description="Simple knee movement",
            target_area="Knee",
            difficulty="EASY",
            youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            created_by=self.therapist,
            is_active=True,
        )

        self.plan = ExercisePlan.objects.create(
            patient=self.patient,
            therapist=self.therapist,
            exercise=self.exercise,
            exercise_duration=60,
            rest_duration=20,
            sets=3,
            scheduled_date="2026-03-26",
            is_active=True,
        )

        TherapistPatientAssignment.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            is_active=True,
        )

    def _auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    def test_patient_can_create_session(self):
        self._auth(self.patient)

        response = self.client.post(
            "/api/sessions/sessions/",
            {
                "exercise_plan": self.plan.id,
                "notes": "Starting now",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Session.objects.count(), 1)
        session = Session.objects.first()
        self.assertEqual(session.patient, self.patient)
        self.assertEqual(session.status, "in_progress")

    def test_patient_can_complete_session(self):
        session = Session.objects.create(
            patient=self.patient,
            exercise_plan=self.plan,
            status="in_progress",
        )
        self._auth(self.patient)

        response = self.client.post(
            f"/api/sessions/sessions/{session.id}/complete/",
            {"notes": "Completed all sets"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "completed")
        self.assertIsNotNone(session.end_time)
        self.assertEqual(session.notes, "Completed all sets")

    def test_patient_can_skip_session(self):
        session = Session.objects.create(
            patient=self.patient,
            exercise_plan=self.plan,
            status="in_progress",
        )
        self._auth(self.patient)

        response = self.client.post(
            f"/api/sessions/sessions/{session.id}/skip/",
            {"notes": "Not feeling well"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "skipped")
        self.assertIsNotNone(session.end_time)
        self.assertEqual(session.notes, "Not feeling well")

    def test_patient_can_log_a_set(self):
        session = Session.objects.create(
            patient=self.patient,
            exercise_plan=self.plan,
            status="in_progress",
        )
        self._auth(self.patient)

        response = self.client.post(
            f"/api/sessions/sessions/{session.id}/setlogs/",
            {
                "set_number": 1,
                "reps_completed": 12,
                "duration_seconds": 45,
                "completed": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SetLog.objects.count(), 1)
        self.assertEqual(SetLog.objects.first().session, session)

    def test_therapist_cannot_create_session(self):
        self._auth(self.therapist)

        response = self.client.post(
            "/api/sessions/sessions/",
            {
                "exercise_plan": self.plan.id,
                "notes": "Should fail",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
