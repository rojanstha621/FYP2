from rest_framework import serializers

from account.serializers import UserBasicSerializer
from medicals.models import TherapistPatientAssignment

from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    therapist_details = UserBasicSerializer(source="therapist", read_only=True)
    therapist = serializers.PrimaryKeyRelatedField(read_only=True)
    patient = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Feedback
        fields = "__all__"


class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["patient", "message"]

    def validate(self, attrs):
        request = self.context.get("request")
        therapist = getattr(request, "user", None)
        patient = attrs.get("patient")

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

        return attrs
