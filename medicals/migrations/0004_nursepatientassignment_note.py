from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("medicals", "0003_appointment_doctor_alter_appointment_status_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="nursepatientassignment",
            name="note",
            field=models.TextField(blank=True),
        ),
    ]
