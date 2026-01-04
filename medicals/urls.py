from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicalHistoryViewSet, TherapistPatientAssignmentViewSet

router = DefaultRouter()
router.register(r"medical-history", MedicalHistoryViewSet, basename="medical-history")
router.register(
    r"assignments", TherapistPatientAssignmentViewSet, basename="assignment"
)

app_name = "medicals"

urlpatterns = [
    path("", include(router.urls)),
]
