from rest_framework import serializers

from .models import Session, SetLog


class SetLogSerializer(serializers.ModelSerializer):
    session = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = SetLog
        fields = "__all__"


class SessionSerializer(serializers.ModelSerializer):
    set_logs = SetLogSerializer(many=True, read_only=True)
    patient = serializers.PrimaryKeyRelatedField(read_only=True)
    total_sets_completed = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = "__all__"

    def get_total_sets_completed(self, obj):
        return obj.set_logs.filter(completed=True).count()


class SessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["exercise_plan", "notes"]
