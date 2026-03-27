from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("videos", "0002_videoassignment_segment_loop_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="videoassignment",
            name="pause_between_repeats_seconds",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="Pause duration in seconds between segment repeats",
            ),
        ),
    ]
