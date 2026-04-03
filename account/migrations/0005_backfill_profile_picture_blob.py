from django.db import migrations


def backfill_profile_picture_blob(apps, schema_editor):
    UserProfile = apps.get_model("account", "UserProfile")

    for profile in UserProfile.objects.exclude(profile_picture="").exclude(profile_picture__isnull=True):
        if profile.profile_picture_blob:
            continue

        try:
            picture_field = profile.profile_picture
            if not picture_field:
                continue

            with picture_field.open("rb") as f:
                file_bytes = f.read()

            profile.profile_picture_blob = file_bytes
            profile.profile_picture_name = picture_field.name.rsplit("/", 1)[-1]

            # Best-effort type guess based on extension.
            lower_name = (profile.profile_picture_name or "").lower()
            if lower_name.endswith(".png"):
                profile.profile_picture_content_type = "image/png"
            elif lower_name.endswith(".jpg") or lower_name.endswith(".jpeg"):
                profile.profile_picture_content_type = "image/jpeg"
            elif lower_name.endswith(".webp"):
                profile.profile_picture_content_type = "image/webp"
            else:
                profile.profile_picture_content_type = "application/octet-stream"

            profile.save(
                update_fields=[
                    "profile_picture_blob",
                    "profile_picture_name",
                    "profile_picture_content_type",
                ]
            )
        except Exception:
            # Keep migration robust even if some files are missing on disk.
            continue


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("account", "0004_userprofile_profile_picture_blob_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_profile_picture_blob, noop_reverse),
    ]
