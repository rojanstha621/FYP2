from django.db import migrations


def _cleanup_sqlite(cursor):
    cursor.execute("PRAGMA table_info(feedback_feedback)")
    columns = [row[1] for row in cursor.fetchall()]

    if "session_id" in columns:
        cursor.execute("PRAGMA foreign_keys=OFF")
        cursor.execute(
            """
            CREATE TABLE feedback_feedback_new (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                is_read bool NOT NULL,
                created_at DATETIME NOT NULL,
                patient_id char(32) NOT NULL REFERENCES account_user(id) DEFERRABLE INITIALLY DEFERRED,
                therapist_id char(32) NOT NULL REFERENCES account_user(id) DEFERRABLE INITIALLY DEFERRED
            )
            """
        )
        cursor.execute(
            """
            INSERT INTO feedback_feedback_new (
                id, message, is_read, created_at, patient_id, therapist_id
            )
            SELECT
                id, message, is_read, created_at, patient_id, therapist_id
            FROM feedback_feedback
            """
        )
        cursor.execute("DROP TABLE feedback_feedback")
        cursor.execute("ALTER TABLE feedback_feedback_new RENAME TO feedback_feedback")
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS feedback_feedback_patient_id_2f89d5f0 ON feedback_feedback(patient_id)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS feedback_feedback_therapist_id_951c09f7 ON feedback_feedback(therapist_id)"
        )
        cursor.execute("PRAGMA foreign_keys=ON")

    cursor.execute("DROP TABLE IF EXISTS therapy_sessions_setlog")
    cursor.execute("DROP TABLE IF EXISTS therapy_sessions_session")
    cursor.execute(
        "DELETE FROM auth_permission WHERE content_type_id IN (SELECT id FROM django_content_type WHERE app_label = 'therapy_sessions')"
    )
    cursor.execute("DELETE FROM django_content_type WHERE app_label = 'therapy_sessions'")
    cursor.execute("DELETE FROM django_migrations WHERE app = 'therapy_sessions'")


def _cleanup_other_databases(cursor):
    cursor.execute("ALTER TABLE feedback_feedback DROP COLUMN IF EXISTS session_id CASCADE")
    cursor.execute("DROP TABLE IF EXISTS therapy_sessions_setlog CASCADE")
    cursor.execute("DROP TABLE IF EXISTS therapy_sessions_session CASCADE")
    cursor.execute(
        "DELETE FROM auth_permission WHERE content_type_id IN (SELECT id FROM django_content_type WHERE app_label = 'therapy_sessions')"
    )
    cursor.execute("DELETE FROM django_content_type WHERE app_label = 'therapy_sessions'")
    cursor.execute("DELETE FROM django_migrations WHERE app = 'therapy_sessions'")


def cleanup_therapy_sessions(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        if connection.vendor == "sqlite":
            _cleanup_sqlite(cursor)
        else:
            _cleanup_other_databases(cursor)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("feedback", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(cleanup_therapy_sessions, migrations.RunPython.noop),
    ]
