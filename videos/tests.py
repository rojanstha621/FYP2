from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from account.models import User
from medicals.models import TherapistPatientAssignment
from .models import Video, VideoAssignment


class VideoModelTest(TestCase):
    """Test Video model"""
    
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            role="ADMIN",
            is_staff=True
        )
    
    def test_video_creation(self):
        """Test creating a video"""
        video = Video.objects.create(
            title="Test Video",
            description="Test Description",
            youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            created_by=self.admin
        )
        
        self.assertEqual(video.title, "Test Video")
        self.assertIn("embed", video.youtube_embed_url)
        self.assertIn("dQw4w9WgXcQ", video.youtube_embed_url)
        self.assertIn("dQw4w9WgXcQ", video.thumbnail_url)
    
    def test_youtube_url_extraction(self):
        """Test YouTube URL extraction for different formats"""
        from .models import extract_youtube_video_id
        
        # Standard watch URL
        video_id = extract_youtube_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        self.assertEqual(video_id, "dQw4w9WgXcQ")
        
        # Short URL
        video_id = extract_youtube_video_id("https://youtu.be/dQw4w9WgXcQ")
        self.assertEqual(video_id, "dQw4w9WgXcQ")
        
        # Embed URL
        video_id = extract_youtube_video_id("https://www.youtube.com/embed/dQw4w9WgXcQ")
        self.assertEqual(video_id, "dQw4w9WgXcQ")


class VideoAPITest(APITestCase):
    """Test Video API endpoints"""
    
    def setUp(self):
        # Create users
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            role="ADMIN",
            is_staff=True
        )
        
        self.therapist = User.objects.create_user(
            email="therapist@test.com",
            password="testpass123",
            first_name="Therapist",
            role="THERAPIST",
            therapist_status="APPROVED",
            is_therapist_approved=True
        )
        
        self.patient = User.objects.create_user(
            email="patient@test.com",
            password="testpass123",
            first_name="Patient",
            role="PATIENT"
        )
        
        self.client = APIClient()
    
    def test_admin_can_create_video(self):
        """Test that admin can create videos"""
        self.client.force_authenticate(user=self.admin)
        
        url = reverse("video-list")
        data = {
            "title": "Exercise Tutorial",
            "description": "Learn proper form",
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "is_active": True
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().created_by, self.admin)
    
    def test_therapist_cannot_create_video(self):
        """Test that therapist cannot create videos"""
        self.client.force_authenticate(user=self.therapist)
        
        url = reverse("video-list")
        data = {
            "title": "Exercise Tutorial",
            "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_therapist_can_view_active_videos(self):
        """Test that therapist can view active videos"""
        # Create videos
        Video.objects.create(
            title="Active Video",
            youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            is_active=True,
            created_by=self.admin
        )
        Video.objects.create(
            title="Inactive Video",
            youtube_url="https://www.youtube.com/watch?v=abc123def45",
            is_active=False,
            created_by=self.admin
        )
        
        self.client.force_authenticate(user=self.therapist)
        
        url = reverse("active-video-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Active Video")


class VideoAssignmentTest(APITestCase):
    """Test Video Assignment functionality"""
    
    def setUp(self):
        # Create users
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            role="ADMIN",
            is_staff=True
        )
        
        self.therapist = User.objects.create_user(
            email="therapist@test.com",
            password="testpass123",
            first_name="Therapist",
            role="THERAPIST",
            therapist_status="APPROVED",
            is_therapist_approved=True
        )
        
        self.patient = User.objects.create_user(
            email="patient@test.com",
            password="testpass123",
            first_name="Patient",
            role="PATIENT"
        )
        
        # Create therapist-patient assignment
        self.assignment = TherapistPatientAssignment.objects.create(
            therapist=self.therapist,
            patient=self.patient,
            is_active=True
        )
        
        # Create a video
        self.video = Video.objects.create(
            title="Test Video",
            youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            is_active=True,
            created_by=self.admin
        )
        
        self.client = APIClient()
    
    def test_therapist_can_assign_video(self):
        """Test that therapist can assign video to their patient"""
        self.client.force_authenticate(user=self.therapist)
        
        url = reverse("video-assignment-list")
        data = {
            "video": self.video.id,
            "patient": self.patient.id,
            "notes": "Please watch this video"
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(VideoAssignment.objects.count(), 1)
    
    def test_duplicate_assignment_prevented(self):
        """Test that duplicate assignments are prevented"""
        # Create first assignment
        VideoAssignment.objects.create(
            video=self.video,
            therapist=self.therapist,
            patient=self.patient,
            is_active=True
        )
        
        self.client.force_authenticate(user=self.therapist)
        
        url = reverse("video-assignment-list")
        data = {
            "video": self.video.id,
            "patient": self.patient.id,
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_therapist_cannot_assign_to_unassigned_patient(self):
        """Test that therapist cannot assign video to patient they're not assigned to"""
        other_patient = User.objects.create_user(
            email="other@test.com",
            password="testpass123",
            first_name="Other",
            role="PATIENT"
        )
        
        self.client.force_authenticate(user=self.therapist)
        
        url = reverse("video-assignment-list")
        data = {
            "video": self.video.id,
            "patient": other_patient.id,
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_inactive_video_cannot_be_assigned(self):
        """Test that inactive videos cannot be assigned"""
        self.video.is_active = False
        self.video.save()
        
        self.client.force_authenticate(user=self.therapist)
        
        url = reverse("video-assignment-list")
        data = {
            "video": self.video.id,
            "patient": self.patient.id,
        }
        
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_patient_can_view_assigned_videos(self):
        """Test that patient can only see their assigned videos"""
        # Create assignment
        VideoAssignment.objects.create(
            video=self.video,
            therapist=self.therapist,
            patient=self.patient,
            is_active=True
        )
        
        self.client.force_authenticate(user=self.patient)
        
        url = reverse("patient-video-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_patient_can_mark_video_viewed(self):
        """Test that patient can mark video as viewed"""
        assignment = VideoAssignment.objects.create(
            video=self.video,
            therapist=self.therapist,
            patient=self.patient,
            is_active=True
        )
        
        self.client.force_authenticate(user=self.patient)
        
        url = reverse("patient-video-mark-viewed", kwargs={"pk": assignment.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        assignment.refresh_from_db()
        self.assertTrue(assignment.viewed)
        self.assertIsNotNone(assignment.viewed_at)

