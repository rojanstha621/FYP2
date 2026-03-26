from django.urls import path

from .progress_views import (
    PatientDailyProgressView,
    PatientWeeklyProgressView,
    PatientProgressSummaryView,
    TherapistPatientsOverviewView,
)

urlpatterns = [
    path("daily/", PatientDailyProgressView.as_view(), name="progress-daily"),
    path("weekly/", PatientWeeklyProgressView.as_view(), name="progress-weekly"),
    path("summary/", PatientProgressSummaryView.as_view(), name="progress-summary"),
    path(
        "therapist-overview/",
        TherapistPatientsOverviewView.as_view(),
        name="progress-therapist-overview",
    ),
]
