from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Video, VideoAssignment
from .serializers import (
    VideoSerializer,
    VideoListSerializer,
    VideoAssignmentSerializer,
    VideoAssignmentCreateSerializer,
    PatientVideoSerializer,
)
from account.permissions import IsAdminRole, IsTherapistApproved, IsPatient
from .permissions import CanManageVideoAssignment, IsAssignedPatient


class VideoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Video Management (Admin only).
    
    Admin can:
    - Create videos
    - List all videos
    - Update videos
    - Delete videos
    - Toggle active status
    """
    
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]
    
    def perform_create(self, serializer):
        """Set created_by to current admin user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """Toggle video active status"""
        video = self.get_object()
        video.is_active = not video.is_active
        video.save()
        
        serializer = self.get_serializer(video)
        return Response(
            {
                "message": f"Video {'activated' if video.is_active else 'deactivated'} successfully.",
                "video": serializer.data,
            }
        )


class ActiveVideoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing active videos (Therapist only).
    
    Therapists can:
    - List all active videos
    - View individual video details
    - Search and filter videos
    """
    
    queryset = Video.objects.filter(is_active=True)
    serializer_class = VideoListSerializer
    permission_classes = [IsAuthenticated, IsTherapistApproved]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "title"]
    ordering = ["-created_at"]


class VideoAssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Video Assignments (Therapist).
    
    Therapists can:
    - Assign videos to their patients
    - View their assignments
    - Unassign (deactivate) videos
    - Update assignment notes
    """
    
    serializer_class = VideoAssignmentSerializer
    permission_classes = [IsAuthenticated, IsTherapistApproved]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["patient", "video", "is_active"]
    search_fields = ["video__title", "patient__email", "patient__first_name"]
    ordering_fields = ["assigned_at"]
    ordering = ["-assigned_at"]
    
    def get_queryset(self):
        """Return only assignments created by the current therapist"""
        return VideoAssignment.objects.filter(
            therapist=self.request.user,
            is_active=True
        ).select_related("video", "patient", "therapist")
    
    def get_serializer_class(self):
        """Use simplified serializer for create action"""
        if self.action == "create":
            return VideoAssignmentCreateSerializer
        return VideoAssignmentSerializer
    
    def perform_create(self, serializer):
        """Therapist is set automatically from request.user in serializer"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of deleting"""
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=["get"])
    def my_assignments(self, request):
        """Get all assignments made by the current therapist"""
        assignments = self.get_queryset()
        
        # Apply filters
        patient_id = request.query_params.get("patient", None)
        if patient_id:
            assignments = assignments.filter(patient_id=patient_id)
        
        page = self.paginate_queryset(assignments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"])
    def by_patient(self, request):
        """Get assignments grouped by patient"""
        from django.db.models import Count
        from account.serializers import UserBasicSerializer
        
        # Get unique patients with assignment counts
        patients_data = []
        patient_ids = self.get_queryset().values_list("patient", flat=True).distinct()
        
        for patient_id in patient_ids:
            from account.models import User
            patient = User.objects.get(id=patient_id)
            assignment_count = self.get_queryset().filter(patient=patient).count()
            
            patients_data.append({
                "patient": UserBasicSerializer(patient).data,
                "assignment_count": assignment_count,
                "assignments": VideoAssignmentSerializer(
                    self.get_queryset().filter(patient=patient),
                    many=True
                ).data
            })
        
        return Response(patients_data)


class PatientVideoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Patient's assigned videos.
    
    Patients can:
    - View only videos assigned to them
    - Mark videos as viewed
    """
    
    serializer_class = PatientVideoSerializer
    permission_classes = [IsAuthenticated, IsPatient]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["video__title", "therapist__first_name"]
    ordering_fields = ["assigned_at", "viewed"]
    ordering = ["-assigned_at"]
    
    def get_queryset(self):
        """Return only videos assigned to the current patient"""
        return VideoAssignment.objects.filter(
            patient=self.request.user,
            is_active=True
        ).select_related("video", "therapist")
    
    @action(detail=True, methods=["post"])
    def mark_viewed(self, request, pk=None):
        """Mark a video as viewed by the patient"""
        assignment = self.get_object()
        
        if not assignment.viewed:
            assignment.viewed = True
            assignment.viewed_at = timezone.now()
            assignment.save()
        
        serializer = self.get_serializer(assignment)
        return Response(
            {
                "message": "Video marked as viewed.",
                "assignment": serializer.data,
            }
        )
    
    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get viewing statistics for the patient"""
        assignments = self.get_queryset()
        
        total_assigned = assignments.count()
        total_viewed = assignments.filter(viewed=True).count()
        total_unviewed = total_assigned - total_viewed
        
        return Response({
            "total_assigned": total_assigned,
            "total_viewed": total_viewed,
            "total_unviewed": total_unviewed,
            "completion_rate": round((total_viewed / total_assigned * 100) if total_assigned > 0 else 0, 2),
        })

