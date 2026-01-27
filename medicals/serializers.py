from rest_framework import serializers
from .models import MedicalHistory, TherapistPatientAssignment
from account.serializers import UserBasicSerializer


class MedicalHistorySerializer(serializers.ModelSerializer):
    patient_details = UserBasicSerializer(source="patient", read_only=True)

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MedicalHistoryDetailSerializer(serializers.ModelSerializer):
    """
    Detailed medical history serializer with full patient information.
    Used for individual medical history retrieval.
    """

    patient_details = UserBasicSerializer(source="patient", read_only=True)

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "patient", "created_at", "updated_at"]


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
