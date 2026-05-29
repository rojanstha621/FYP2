from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from medicals.models import Appointment, NursePatientAssignment, TherapistPatientAssignment


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

	def test_nurse_created_appointment_shows_for_patient_and_therapist(self):
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
				"title": "Follow-up visit",
				"appointment_type": "FOLLOW_UP",
				"scheduled_for": scheduled_for.isoformat(),
				"duration_minutes": 30,
				"location": "Room 2",
				"is_virtual": False,
				"notes": "Bring updated reports",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(str(response.data["data"]["therapist"]), str(self.therapist.id))

		appointment_id = response.data["data"]["id"]

		self.client.force_authenticate(user=self.patient)
		patient_response = self.client.get("/api/medicals/appointments/")
		self.assertEqual(patient_response.status_code, status.HTTP_200_OK)
		patient_items = patient_response.data.get("results") or patient_response.data.get("data") or patient_response.data.get("result") or patient_response.data
		self.assertTrue(any(item["id"] == appointment_id for item in patient_items))

		self.client.force_authenticate(user=self.therapist)
		therapist_response = self.client.get("/api/medicals/appointments/")
		self.assertEqual(therapist_response.status_code, status.HTTP_200_OK)
		therapist_items = therapist_response.data.get("results") or therapist_response.data.get("data") or therapist_response.data.get("result") or therapist_response.data
		self.assertTrue(any(item["id"] == appointment_id for item in therapist_items))

	def test_therapist_sees_patient_appointments_without_direct_therapist_link(self):
		NursePatientAssignment.objects.create(nurse=self.nurse, patient=self.patient, is_active=True)
		TherapistPatientAssignment.objects.create(
			therapist=self.therapist,
			patient=self.patient,
			is_active=True,
		)
		appointment = Appointment.objects.create(
			nurse=self.nurse,
			patient=self.patient,
			title="Shared follow-up",
			appointment_type="FOLLOW_UP",
			scheduled_for=timezone.now() + timedelta(days=1),
			duration_minutes=30,
			location="Room 6",
			is_virtual=False,
			notes="Therapist should see this via assignment",
		)

		self.client.force_authenticate(user=self.therapist)
		response = self.client.get("/api/medicals/appointments/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		items = response.data.get("results") or response.data.get("data") or response.data.get("result") or response.data
		self.assertTrue(any(item["id"] == appointment.id for item in items))

	def test_patient_can_create_own_medical_history(self):
		self.client.force_authenticate(user=self.patient)

		response = self.client.post(
			"/api/medicals/medical-history/",
			{
				"past_injuries": "Knee strain",
				"chronic_conditions": "None",
				"surgeries": "None",
				"medications": "None",
				"allergies": "Dust",
				"current_symptoms": "Occasional pain",
			},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(str(response.data["data"]["patient"]), str(self.patient.id))

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
