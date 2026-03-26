from rest_framework import serializers


class DailyProgressSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    skipped_sessions = serializers.IntegerField()
    missed_sessions = serializers.IntegerField()
    completion_percentage = serializers.FloatField()
    total_duration_seconds = serializers.IntegerField()


class WeeklyProgressSerializer(serializers.Serializer):
    week_start = serializers.DateField()
    week_end = serializers.DateField()
    total_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    completion_percentage = serializers.FloatField()
    total_exercise_time_seconds = serializers.IntegerField()


class PatientProgressSummarySerializer(serializers.Serializer):
    patient_id = serializers.UUIDField()
    patient_name = serializers.CharField()
    total_sessions_all_time = serializers.IntegerField()
    completed_all_time = serializers.IntegerField()
    current_streak = serializers.IntegerField()
    last_session_date = serializers.DateField(allow_null=True)
