from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExerciseViewSet, ExercisePlanViewSet

router = DefaultRouter()
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(r"exercise-plans", ExercisePlanViewSet, basename="exercise-plan")

app_name = "exercises"

urlpatterns = [
    path("", include(router.urls)),
]
