from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0003_user_is_therapist_approved_user_therapist_status_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="profile_picture_blob",
            field=models.BinaryField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="profile_picture_content_type",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="profile_picture_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
