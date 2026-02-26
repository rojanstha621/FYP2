from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VideoViewSet,
    ActiveVideoViewSet,
    VideoAssignmentViewSet,
    PatientVideoViewSet,
)

router = DefaultRouter()

# Admin endpoints - full CRUD on videos
router.register(r"videos", VideoViewSet, basename="video")

# Therapist endpoints - browse active videos
router.register(r"active-videos", ActiveVideoViewSet, basename="active-video")

# Therapist endpoints - manage video assignments
router.register(r"assignments", VideoAssignmentViewSet, basename="video-assignment")

# Patient endpoints - view assigned videos
router.register(r"my-videos", PatientVideoViewSet, basename="patient-video")

urlpatterns = [
    path("", include(router.urls)),
]
