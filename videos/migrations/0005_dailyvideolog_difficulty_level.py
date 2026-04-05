from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("videos", "0004_videoassignment_schedule_duration_days_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="dailyvideolog",
            name="difficulty_level",
            field=models.CharField(
                blank=True,
                choices=[("EASY", "Easy"), ("MEDIUM", "Medium"), ("DIFFICULT", "Difficult"), ("HARD", "Hard")],
                help_text="Patient-reported difficulty level for this day",
                max_length=10,
                null=True,
            ),
        ),
    ]
