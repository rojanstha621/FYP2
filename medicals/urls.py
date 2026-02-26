from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MedicalHistoryViewSet,
    TherapistPatientAssignmentViewSet,
    PatientDashboardView,
    AssignmentRequestView,
    PendingAssignmentsView,
    ActivateAssignmentView,
    RejectAssignmentView,
)

router = DefaultRouter()
router.register(r"medical-history", MedicalHistoryViewSet, basename="medical-history")
router.register(
    r"assignments", TherapistPatientAssignmentViewSet, basename="assignment"
)

app_name = "medicals"

urlpatterns = [
    path("dashboard/patient/", PatientDashboardView.as_view(), name="patient-dashboard"),
    path("assignments/request/", AssignmentRequestView.as_view(), name="assignment-request"),
    path("assignments/pending/", PendingAssignmentsView.as_view(), name="pending-assignments"),
    path("assignments/<int:id>/activate/", ActivateAssignmentView.as_view(), name="activate-assignment"),
    path("assignments/<int:id>/reject/", RejectAssignmentView.as_view(), name="reject-assignment"),
    path("", include(router.urls)),
]
