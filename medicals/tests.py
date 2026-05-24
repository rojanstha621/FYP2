from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from medicals.models import NursePatientAssignment, TherapistPatientAssignment


User = get_user_model()


class NurseWorkflowTests(APITestCase):
	def setUp(self):
		self.nurse = User.objects.create_user(
			email="nurse@example.com",
			password="password123",
			first_name="Nora",
			last_name="Nurse",
			role="NURSE",
		)
		self.patient = User.objects.create_user(
			email="patient@example.com",
			password="password123",
			first_name="Pat",
			last_name="Patient",
			role="PATIENT",
		)
		self.therapist = User.objects.create_user(
			email="therapist@example.com",
			password="password123",
			first_name="Theo",
			last_name="Therapist",
			role="THERAPIST",
		)
		self.therapist.therapist_status = User.TherapistStatusChoices.APPROVED
		self.therapist.is_therapist_approved = True
		self.therapist.save(update_fields=["therapist_status", "is_therapist_approved"])

	def test_nurse_can_assign_patient_and_view_directory(self):
		self.client.force_authenticate(user=self.nurse)

		response = self.client.post(
			"/api/medicals/nurse-assignments/",
			{"patient": str(self.patient.id)},
			format="json",
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(response.data["success"])
		self.assertEqual(str(response.data["data"]["patient"]), str(self.patient.id))

		directory = self.client.get("/api/account/care-team/")
		self.assertEqual(directory.status_code, status.HTTP_200_OK)
		self.assertTrue(
			any(item["id"] == str(self.nurse.id) for item in directory.data["data"]["nurses"])
		)
		self.assertTrue(
			any(item["id"] == str(self.patient.id) for item in directory.data["data"]["patients"])
		)
		self.assertTrue(
			any(item["id"] == str(self.therapist.id) for item in directory.data["data"]["therapists"])
		)

	def test_therapist_can_assign_nurse_to_their_patient(self):
		TherapistPatientAssignment.objects.create(
			therapist=self.therapist,
			patient=self.patient,
			is_active=True,
		)
		self.client.force_authenticate(user=self.therapist)

		response = self.client.post(
			"/api/medicals/nurse-assignments/",
			{
				"nurse": str(self.nurse.id),
				"patient": str(self.patient.id),
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(response.data["success"])
		self.assertEqual(str(response.data["data"]["nurse"]), str(self.nurse.id))
		self.assertEqual(str(response.data["data"]["patient"]), str(self.patient.id))

	def test_nurse_can_create_medical_history_for_assigned_patient(self):
		NursePatientAssignment.objects.create(nurse=self.nurse, patient=self.patient, is_active=True)
		self.client.force_authenticate(user=self.nurse)

		response = self.client.post(
			"/api/medicals/medical-history/",
			{
				"patient": str(self.patient.id),
				"past_injuries": "Sprained ankle",
				"chronic_conditions": "None",
				"surgeries": "Appendectomy",
				"medications": "Ibuprofen",
				"allergies": "Penicillin",
				"current_symptoms": "Mild pain",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(str(response.data["data"]["patient"]), str(self.patient.id))
		self.assertEqual(str(response.data["data"]["created_by_nurse"]), str(self.nurse.id))

	def test_nurse_can_create_appointment_for_assigned_patient(self):
		NursePatientAssignment.objects.create(nurse=self.nurse, patient=self.patient, is_active=True)
		TherapistPatientAssignment.objects.create(
			therapist=self.therapist,
			patient=self.patient,
			is_active=True,
		)
		self.client.force_authenticate(user=self.nurse)

		scheduled_for = timezone.now() + timedelta(days=1)
		response = self.client.post(
			"/api/medicals/appointments/",
			{
				"patient": str(self.patient.id),
				"therapist": str(self.therapist.id),
				"title": "Initial check-in",
				"appointment_type": "NURSE_CHECKIN",
				"scheduled_for": scheduled_for.isoformat(),
				"duration_minutes": 45,
				"location": "Room 4",
				"is_virtual": False,
				"notes": "Bring recent reports",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(str(response.data["data"]["nurse"]), str(self.nurse.id))
		self.assertEqual(str(response.data["data"]["patient"]), str(self.patient.id))
		self.assertEqual(str(response.data["data"]["therapist"]), str(self.therapist.id))
