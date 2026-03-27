from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("videos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="videoassignment",
            name="repeat_count",
            field=models.PositiveSmallIntegerField(
                default=1,
                help_text="How many times the selected segment should repeat",
            ),
        ),
        migrations.AddField(
            model_name="videoassignment",
            name="segment_end_seconds",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Optional segment end time in seconds",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="videoassignment",
            name="segment_start_seconds",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Optional segment start time in seconds",
                null=True,
            ),
        ),
    ]
