from rest_framework import serializers

from medicals.models import TherapistPatientAssignment
from sessions.models import Session

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    therapist = serializers.PrimaryKeyRelatedField(read_only=True)
    patient = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Feedback
        fields = "__all__"


class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["patient", "session", "message"]

    def validate(self, attrs):
        request = self.context.get("request")
        therapist = getattr(request, "user", None)
        patient = attrs.get("patient")
        session = attrs.get("session")

        if not therapist or not therapist.is_authenticated:
            raise serializers.ValidationError("Authentication required.")

        if getattr(therapist, "role", None) != "THERAPIST":
            raise serializers.ValidationError("Only therapists can create feedback.")

        is_assigned = TherapistPatientAssignment.objects.filter(
            therapist=therapist,
            patient=patient,
            is_active=True,
        ).exists()

        if not is_assigned:
            raise serializers.ValidationError(
                {"patient": "You can only send feedback to your assigned patients."}
            )

        if session and session.patient_id != patient.id:
            raise serializers.ValidationError(
                {"session": "Selected session does not belong to the selected patient."}
            )

        return attrs
