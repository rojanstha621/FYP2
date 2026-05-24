from rest_framework import serializers
from .models import (
    MedicalHistory,
    NursePatientAssignment,
    TherapistPatientAssignment,
    Appointment,
    Vitals,
    NursingNote,
)
from account.serializers import UserBasicSerializer


class MedicalHistorySerializer(serializers.ModelSerializer):
    patient_details = UserBasicSerializer(source="patient", read_only=True)
    created_by_nurse_details = UserBasicSerializer(source="created_by_nurse", read_only=True)
    updated_by_nurse_details = UserBasicSerializer(source="updated_by_nurse", read_only=True)

    class Meta:
        model = MedicalHistory
        fields = [
            "id",
            "patient",
            "patient_details",
            "past_injuries",
            "chronic_conditions",
            "surgeries",
            "medications",
            "allergies",
            "current_symptoms",
            "medical_report",
            "created_by_nurse",
            "created_by_nurse_details",
            "updated_by_nurse",
            "updated_by_nurse_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by_nurse",
            "updated_by_nurse",
        ]


class MedicalHistoryDetailSerializer(serializers.ModelSerializer):
    """
    Detailed medical history serializer with full patient information.
    Used for individual medical history retrieval.
    """

    patient_details = UserBasicSerializer(source="patient", read_only=True)
    created_by_nurse_details = UserBasicSerializer(source="created_by_nurse", read_only=True)
    updated_by_nurse_details = UserBasicSerializer(source="updated_by_nurse", read_only=True)

    class Meta:
        model = MedicalHistory
        fields = [
            "id",
            "patient",
            "patient_details",
            "past_injuries",
            "chronic_conditions",
            "surgeries",
            "medications",
            "allergies",
            "current_symptoms",
            "medical_report",
            "created_by_nurse",
            "created_by_nurse_details",
            "updated_by_nurse",
            "updated_by_nurse_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "patient",
            "created_at",
            "updated_at",
            "created_by_nurse",
            "updated_by_nurse",
        ]


class NursePatientAssignmentSerializer(serializers.ModelSerializer):
    nurse_details = UserBasicSerializer(source="nurse", read_only=True)
    patient_details = UserBasicSerializer(source="patient", read_only=True)

    class Meta:
        model = NursePatientAssignment
        fields = [
            "id",
            "nurse",
            "nurse_details",
            "patient",
            "patient_details",
            "note",
            "assigned_at",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_at"]

    def validate(self, attrs):
        nurse = attrs.get("nurse")
        patient = attrs.get("patient")

        if not nurse or getattr(nurse, "role", None) != "NURSE":
            raise serializers.ValidationError({"nurse": "Assigned user must be a nurse."})

        if not patient or getattr(patient, "role", None) != "PATIENT":
            raise serializers.ValidationError({"patient": "Assigned user must be a patient."})

        if nurse.id == patient.id:
            raise serializers.ValidationError("Nurse and patient cannot be the same user.")

        existing = NursePatientAssignment.objects.filter(
            nurse=nurse,
            patient=patient,
        )
        if self.instance:
            existing = existing.exclude(id=self.instance.id)

        if existing.exists():
            raise serializers.ValidationError("This nurse is already assigned to this patient.")

        active_for_patient = NursePatientAssignment.objects.filter(
            patient=patient,
            is_active=True,
        )
        if self.instance:
            active_for_patient = active_for_patient.exclude(id=self.instance.id)

        if active_for_patient.exists():
            raise serializers.ValidationError(
                "This patient already has an active nurse assignment."
            )

        return attrs


class TherapistPatientAssignmentSerializer(serializers.ModelSerializer):
    therapist_details = UserBasicSerializer(source="therapist", read_only=True)
    patient_details = UserBasicSerializer(source="patient", read_only=True)

    class Meta:
        model = TherapistPatientAssignment
        fields = [
            "id",
            "therapist",
            "therapist_details",
            "patient",
            "patient_details",
            "assigned_at",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_at"]

    def validate(self, attrs):
        therapist = attrs.get("therapist")
        patient = attrs.get("patient")

        # Basic role checks
        if not therapist or getattr(therapist, "role", None) != "THERAPIST":
            raise serializers.ValidationError({
                "therapist": "Assigned user must be a therapist",
            })
        if not patient or getattr(patient, "role", None) != "PATIENT":
            raise serializers.ValidationError({
                "patient": "Assigned user must be a patient",
            })

        # Therapist must be approved
        if not getattr(therapist, "is_approved_therapist", False):
            raise serializers.ValidationError({
                "therapist": "Therapist is not approved",
            })

        # Prevent self-assignment (paranoia check)
        if therapist.id == patient.id:
            raise serializers.ValidationError("Therapist and patient cannot be the same user")

        return attrs


class MyPatientsSerializer(serializers.ModelSerializer):
    """Serializer for therapists to view their assigned patients"""

    patient_details = UserBasicSerializer(source="patient", read_only=True)

    class Meta:
        model = TherapistPatientAssignment
        fields = [
            "id",
            "patient",
            "patient_details",
            "assigned_at",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_at"]


class MyTherapistsSerializer(serializers.ModelSerializer):
    """Serializer for patients to view their assigned therapists"""

    therapist_details = UserBasicSerializer(source="therapist", read_only=True)

    class Meta:
        model = TherapistPatientAssignment
        fields = [
            "id",
            "therapist",
            "therapist_details",
            "assigned_at",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_at"]

    def to_representation(self, instance):
        # Only show approved therapists to patients
        therapist = getattr(instance, "therapist", None)
        if not therapist or not getattr(therapist, "is_approved_therapist", False):
            return None
        return super().to_representation(instance)


class AppointmentSerializer(serializers.ModelSerializer):
    nurse_details = UserBasicSerializer(source="nurse", read_only=True)
    patient_details = UserBasicSerializer(source="patient", read_only=True)
    therapist_details = UserBasicSerializer(source="therapist", read_only=True)
    doctor_details = UserBasicSerializer(source="doctor", read_only=True)
    created_by_details = UserBasicSerializer(source="created_by", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "nurse",
            "nurse_details",
            "patient",
            "patient_details",
            "therapist",
            "therapist_details",
            "doctor",
            "doctor_details",
            "title",
            "appointment_type",
            "scheduled_for",
            "duration_minutes",
            "status",
            "location",
            "is_virtual",
            "notes",
            "created_by",
            "created_by_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "id",
            "nurse",
            "patient",
            "therapist",
            "doctor",
            "title",
            "appointment_type",
            "scheduled_for",
            "duration_minutes",
            "status",
            "location",
            "is_virtual",
            "notes",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        nurse = user if getattr(user, "role", None) == "NURSE" else attrs.get("nurse")
        patient = attrs.get("patient")
        therapist = attrs.get("therapist")

        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        if getattr(user, "role", None) not in {"NURSE", "ADMIN"}:
            raise serializers.ValidationError("Only nurses or admins can create appointments.")

        if not nurse or getattr(nurse, "role", None) != "NURSE":
            raise serializers.ValidationError({"nurse": "Assigned user must be a nurse."})

        if not patient or getattr(patient, "role", None) != "PATIENT":
            raise serializers.ValidationError({"patient": "Assigned user must be a patient."})

        if nurse.id == patient.id:
            raise serializers.ValidationError("Nurse and patient cannot be the same user.")

        if therapist and getattr(therapist, "role", None) != "THERAPIST":
            raise serializers.ValidationError({"therapist": "Assigned user must be a therapist."})

        nurse_assignment_exists = NursePatientAssignment.objects.filter(
            nurse=nurse,
            patient=patient,
            is_active=True,
        ).exists()
        if not nurse_assignment_exists:
            raise serializers.ValidationError({"patient": "Nurse is not assigned to this patient."})

        if therapist:
            therapist_assignment_exists = TherapistPatientAssignment.objects.filter(
                therapist=therapist,
                patient=patient,
                is_active=True,
            ).exists()
            if not therapist_assignment_exists:
                raise serializers.ValidationError({"therapist": "Therapist is not assigned to this patient."})

        if attrs.get("duration_minutes", 30) < 1:
            raise serializers.ValidationError({"duration_minutes": "Duration must be at least 1 minute."})

        # Doctor role check (optional)
        doctor = attrs.get("doctor")
        if doctor and getattr(doctor, "role", None) != "DOCTOR":
            raise serializers.ValidationError({"doctor": "Assigned user must be a doctor."})

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and getattr(user, "role", None) == "NURSE":
            validated_data["nurse"] = user
        validated_data["created_by"] = user
        return super().create(validated_data)


class VitalsSerializer(serializers.ModelSerializer):
    nurse_details = UserBasicSerializer(source="nurse", read_only=True)
    patient_details = UserBasicSerializer(source="patient", read_only=True)

    class Meta:
        model = Vitals
        fields = [
            "id",
            "patient",
            "patient_details",
            "nurse",
            "nurse_details",
            "systolic",
            "diastolic",
            "temperature_c",
            "pulse",
            "respiration_rate",
            "weight_kg",
            "recorded_at",
        ]
        read_only_fields = ["id", "recorded_at"]


class NursingNoteSerializer(serializers.ModelSerializer):
    nurse_details = UserBasicSerializer(source="nurse", read_only=True)
    patient_details = UserBasicSerializer(source="patient", read_only=True)

    class Meta:
        model = NursingNote
        fields = [
            "id",
            "patient",
            "patient_details",
            "nurse",
            "nurse_details",
            "appointment",
            "note_type",
            "text",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        nurse = attrs.get("nurse")
        patient = attrs.get("patient")
        if nurse and getattr(nurse, "role", None) != "NURSE":
            raise serializers.ValidationError({"nurse": "Assigned user must be a nurse."})
        if patient and getattr(patient, "role", None) != "PATIENT":
            raise serializers.ValidationError({"patient": "Assigned user must be a patient."})
        return attrs
