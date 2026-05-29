from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.timezone import localdate

from videos.models import VideoAssignment, DailyVideoLog


class Command(BaseCommand):
    help = "Send daily unlock emails for scheduled video assignments"

    def handle(self, *args, **options):
        now = timezone.localtime(timezone.now())
        today = localdate()
        sent_count = 0
        skipped_count = 0

        scheduled_assignments = (
            VideoAssignment.objects.filter(
                is_active=True,
                schedule_start_date__isnull=False,
                schedule_duration_days__isnull=False,
                scheduled_time__isnull=False,
            )
            .select_related("patient", "video", "therapist")
            .prefetch_related("daily_logs")
        )

        for assignment in scheduled_assignments:
            end_date = assignment.get_schedule_end_date()
            if end_date is None:
                skipped_count += 1
                continue

            if today < assignment.schedule_start_date or today > end_date:
                skipped_count += 1
                continue

            if now.time() < assignment.scheduled_time:
                skipped_count += 1
                continue

            log, _ = DailyVideoLog.objects.get_or_create(
                assignment=assignment,
                scheduled_date=today,
                defaults={
                    "status": DailyVideoLog.DayStatus.PENDING,
                    "viewed": False,
                },
            )

            if log.unlock_email_sent_at is not None:
                skipped_count += 1
                continue

            if log.viewed or log.status == DailyVideoLog.DayStatus.VIEWED:
                skipped_count += 1
                continue

            patient_name = (assignment.patient.first_name or assignment.patient.email).strip()
            patient_name = patient_name or assignment.patient.email
            video_title = assignment.video.title
            patient_videos_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/") + "/patient/videos"
            unlock_time = assignment.scheduled_time.strftime("%H:%M")
            subject = f"Your daily video is unlocked: {video_title}"
            message = (
                f"Hi {patient_name},\n\n"
                f"Your video '{video_title}' is now unlocked for today.\n"
                f"It becomes available every day at {unlock_time} and disappears after you watch it for that day.\n\n"
                f"Open your videos here:\n{patient_videos_url}\n\n"
                "If you have already watched today's session, no further action is needed."
            )

            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[assignment.patient.email],
                fail_silently=False,
            )

            with transaction.atomic():
                DailyVideoLog.objects.filter(pk=log.pk, unlock_email_sent_at__isnull=True).update(
                    unlock_email_sent_at=now
                )

            sent_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Sent {sent_count} unlock email(s); skipped {skipped_count} assignment(s)."
            )
        )
