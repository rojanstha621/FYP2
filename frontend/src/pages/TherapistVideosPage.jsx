import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { videoAPI, assignmentAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { FiPlay, FiUserPlus, FiEye, FiTrash2, FiCalendar, FiClock, FiBarChart2 } from 'react-icons/fi';

const DEFAULT_SEGMENT_SLIDER_MAX_SECONDS = 1800;

let youtubeIframeApiPromise = null;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youtubeIframeApiPromise) {
    youtubeIframeApiPromise = new Promise((resolve) => {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.body.appendChild(script);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') {
          previousReady();
        }
        resolve(window.YT);
      };

      const checkInterval = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(checkInterval);
          resolve(window.YT);
        }
      }, 100);
    });
  }

  return youtubeIframeApiPromise;
}

function parseTimestampInput(value) {
  if (!value) return null;

  if (/^\d+$/.test(value.trim())) {
    return Number(value);
  }

  const parts = value.split(':').map((part) => part.trim());
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (/^\d+$/.test(minutes) && /^\d+$/.test(seconds)) {
      return Number(minutes) * 60 + Number(seconds);
    }
  }

  return NaN;
}

function formatSecondsToTimestamp(seconds) {
  if (!Number.isInteger(seconds)) {
    return '-';
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function buildSegmentPreviewUrl(embedUrl, startSeconds, endSeconds) {
  if (!embedUrl) {
    return '';
  }

  const startIsValid = Number.isInteger(startSeconds) && startSeconds >= 0;
  const endIsValid = Number.isInteger(endSeconds) && endSeconds > 0;
  const hasSegment = startIsValid && endIsValid && endSeconds > startSeconds;

  const separator = embedUrl.includes('?') ? '&' : '?';
  let url = `${embedUrl}${separator}autoplay=1&rel=0`;

  if (hasSegment) {
    url += `&start=${startSeconds}&end=${endSeconds}`;
  }

  return url;
}

function extractYouTubeVideoIdFromEmbedUrl(embedUrl = '') {
  const embedMatch = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return embedMatch[1];
  }
  return null;
}

export default function TherapistVideosPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('browse'); // browse or assignments
  const [videos, setVideos] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  
  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [segmentSliderMaxSeconds, setSegmentSliderMaxSeconds] = useState(DEFAULT_SEGMENT_SLIDER_MAX_SECONDS);
  const [isDurationLoading, setIsDurationLoading] = useState(false);
  
  // Progress panel
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Form data
  const [assignmentData, setAssignmentData] = useState({
    patient: '',
    notes: '',
    segment_start: '',
    segment_end: '',
    repeat_count: 1,
    pause_between_repeats_seconds: 0,
    // schedule
    use_schedule: false,
    schedule_start_date: '',
    schedule_duration_days: 10,
    scheduled_time: '05:00',
  });

  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      setActiveTab('assignments');
      setPatientFilter(patientId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchVideos();
    } else {
      fetchAssignments();
    }
    fetchMyPatients();
  }, [activeTab, searchTerm, patientFilter]);

  useEffect(() => {
    if (!showAssignModal || !selectedVideo?.youtube_embed_url) {
      setSegmentSliderMaxSeconds(DEFAULT_SEGMENT_SLIDER_MAX_SECONDS);
      setIsDurationLoading(false);
      return;
    }

    let cancelled = false;
    let probePlayer = null;
    let probeElement = null;

    const cleanupProbe = () => {
      if (probePlayer?.destroy) {
        probePlayer.destroy();
      }
      if (probeElement?.parentNode) {
        probeElement.parentNode.removeChild(probeElement);
      }
    };

    const probeVideoDuration = async () => {
      try {
        const videoId = extractYouTubeVideoIdFromEmbedUrl(selectedVideo.youtube_embed_url);
        if (!videoId) {
          setSegmentSliderMaxSeconds(DEFAULT_SEGMENT_SLIDER_MAX_SECONDS);
          return;
        }

        setIsDurationLoading(true);
        const YT = await loadYouTubeIframeApi();
        if (cancelled) {
          return;
        }

        probeElement = document.createElement('div');
        probeElement.style.position = 'absolute';
        probeElement.style.left = '-9999px';
        probeElement.style.width = '1px';
        probeElement.style.height = '1px';
        document.body.appendChild(probeElement);

        probePlayer = new YT.Player(probeElement, {
          videoId,
          events: {
            onReady: (event) => {
              if (cancelled) {
                cleanupProbe();
                return;
              }

              const durationSeconds = Math.floor(event.target.getDuration?.() || 0);
              const normalizedDuration = durationSeconds > 1
                ? durationSeconds
                : DEFAULT_SEGMENT_SLIDER_MAX_SECONDS;

              setSegmentSliderMaxSeconds(normalizedDuration);
              setIsDurationLoading(false);
              cleanupProbe();
            },
            onError: () => {
              if (!cancelled) {
                setSegmentSliderMaxSeconds(DEFAULT_SEGMENT_SLIDER_MAX_SECONDS);
                setIsDurationLoading(false);
              }
              cleanupProbe();
            },
          },
        });
      } catch (err) {
        if (!cancelled) {
          setSegmentSliderMaxSeconds(DEFAULT_SEGMENT_SLIDER_MAX_SECONDS);
          setIsDurationLoading(false);
        }
        cleanupProbe();
      }
    };

    probeVideoDuration();

    return () => {
      cancelled = true;
      cleanupProbe();
    };
  }, [showAssignModal, selectedVideo?.youtube_embed_url]);

  useEffect(() => {
    setAssignmentData((prev) => {
      const start = parseTimestampInput(prev.segment_start);
      const end = parseTimestampInput(prev.segment_end);
      let nextStart = start;
      let nextEnd = end;
      let changed = false;

      if (Number.isInteger(nextStart) && nextStart >= segmentSliderMaxSeconds) {
        nextStart = Math.max(segmentSliderMaxSeconds - 1, 0);
        changed = true;
      }

      if (Number.isInteger(nextEnd) && nextEnd > segmentSliderMaxSeconds) {
        nextEnd = segmentSliderMaxSeconds;
        changed = true;
      }

      if (Number.isInteger(nextStart) && Number.isInteger(nextEnd) && nextEnd <= nextStart) {
        nextEnd = Math.min(nextStart + 1, segmentSliderMaxSeconds);
        changed = true;
      }

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        segment_start: Number.isInteger(nextStart)
          ? formatSecondsToTimestamp(nextStart)
          : prev.segment_start,
        segment_end: Number.isInteger(nextEnd)
          ? formatSecondsToTimestamp(nextEnd)
          : prev.segment_end,
      };
    });
  }, [segmentSliderMaxSeconds]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      
      const response = await videoAPI.getActiveVideos(params);
      // Handle response data - it might be an array or have a data/results property
      const videoData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.data || []);
      setVideos(videoData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (patientFilter) params.patient = patientFilter;
      
      const response = await videoAPI.getAssignments(params);
      // Handle response data - it might be an array or have a data/results property
      const assignmentData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.data || []);
      setAssignments(assignmentData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPatients = async () => {
    try {
      const response = await assignmentAPI.getAssignments();
      console.log('Assignments response:', response.data);
      
      // Handle response data - it might be an array or have a data/results property
      const assignmentData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.result || response.data?.data || []);
      
      console.log('Parsed assignment data:', assignmentData);
      
      const uniquePatients = assignmentData
        .filter(assignment => {
          console.log('Assignment:', assignment, 'is_active:', assignment.is_active);
          return assignment.is_active;
        })
        .map(assignment => assignment.patient_details || assignment.patient)
        .filter(Boolean) // Remove null/undefined
        .filter((patient, index, self) => 
          patient && index === self.findIndex(p => p && p.id === patient.id)
        );
      
      console.log('Unique patients:', uniquePatients);
      setMyPatients(uniquePatients);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const handleAssignVideo = async (e) => {
    e.preventDefault();

    const startSeconds = parseTimestampInput(assignmentData.segment_start);
    const endSeconds = parseTimestampInput(assignmentData.segment_end);
    const hasSegmentInput = assignmentData.segment_start.trim() || assignmentData.segment_end.trim();

    if (hasSegmentInput) {
      if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) {
        setError('Use valid time format for segment fields (mm:ss or total seconds).');
        return;
      }

      if (startSeconds === null || endSeconds === null) {
        setError('Provide both segment start and end times.');
        return;
      }

      if (endSeconds <= startSeconds) {
        setError('Segment end time must be greater than start time.');
        return;
      }
    }

    const repeatCount = Number(assignmentData.repeat_count || 1);
    if (repeatCount < 1) {
      setError('Repeat count must be at least 1.');
      return;
    }

    if (!hasSegmentInput && repeatCount > 1) {
      setError('Repeat count greater than 1 requires segment start and end times.');
      return;
    }

    const pauseBetweenRepeatsSeconds = Number(assignmentData.pause_between_repeats_seconds || 0);
    if (pauseBetweenRepeatsSeconds < 0) {
      setError('Pause between repeats cannot be negative.');
      return;
    }

    if (pauseBetweenRepeatsSeconds > 0 && repeatCount === 1) {
      setError('Pause between repeats is only used when repeat count is greater than 1.');
      return;
    }

    // Validate schedule fields if enabled
    if (assignmentData.use_schedule) {
      if (!assignmentData.schedule_start_date) {
        setError('Please select a start date for the schedule.');
        return;
      }
      const days = Number(assignmentData.schedule_duration_days);
      if (!days || days < 1) {
        setError('Schedule duration must be at least 1 day.');
        return;
      }
      if (!assignmentData.scheduled_time) {
        setError('Please select a daily unlock time.');
        return;
      }
    }

    try {
      await videoAPI.createAssignment({
        video: selectedVideo.id,
        patient: assignmentData.patient,
        notes: assignmentData.notes,
        segment_start_seconds: hasSegmentInput ? startSeconds : null,
        segment_end_seconds: hasSegmentInput ? endSeconds : null,
        repeat_count: repeatCount,
        pause_between_repeats_seconds: pauseBetweenRepeatsSeconds,
        ...(assignmentData.use_schedule && {
          schedule_start_date: assignmentData.schedule_start_date,
          schedule_duration_days: Number(assignmentData.schedule_duration_days),
          scheduled_time: assignmentData.scheduled_time,
        }),
      });
      setSuccess('Video assigned successfully');
      setShowAssignModal(false);
      resetAssignmentForm();
      if (activeTab === 'assignments') {
        fetchAssignments();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to assign video');
    }
  };

  const handleUnassignVideo = async (assignmentId) => {
    if (!confirm('Are you sure you want to unassign this video?')) return;
    
    try {
      await videoAPI.deleteAssignment(assignmentId);
      setSuccess('Video unassigned successfully');
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign video');
    }
  };

  const handleViewDetails = (video) => {
    setSelectedVideo(video);
    setShowDetailModal(true);
  };

  const handleAssignClick = (video) => {
    setSelectedVideo(video);
    setShowAssignModal(true);
  };

  const handleViewProgress = async (assignment) => {
    setProgressData(null);
    setShowProgressPanel(true);
    setProgressLoading(true);
    try {
      const res = await videoAPI.getScheduleProgress(assignment.id);
      setProgressData(res.data);
    } catch (err) {
      setError('Failed to load schedule progress');
      setShowProgressPanel(false);
    } finally {
      setProgressLoading(false);
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentData({
      patient: '',
      notes: '',
      segment_start: '',
      segment_end: '',
      repeat_count: 1,
      pause_between_repeats_seconds: 0,
      use_schedule: false,
      schedule_start_date: '',
      schedule_duration_days: 10,
      scheduled_time: '05:00',
    });
    setSelectedVideo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSegmentSliderChange = (name, value) => {
    setAssignmentData((prev) => {
      const next = { ...prev, [name]: formatSecondsToTimestamp(value) };
      const start = parseTimestampInput(next.segment_start);
      const end = parseTimestampInput(next.segment_end);

      if (Number.isInteger(start) && Number.isInteger(end) && end <= start) {
        if (name === 'segment_start') {
          next.segment_end = formatSecondsToTimestamp(Math.min(start + 1, segmentSliderMaxSeconds));
        } else {
          next.segment_start = formatSecondsToTimestamp(Math.max(end - 1, 0));
        }
      }

      return next;
    });
  };

  const sliderStartRaw = parseTimestampInput(assignmentData.segment_start);
  const sliderEndRaw = parseTimestampInput(assignmentData.segment_end);
  const safeSliderMaxSeconds = Math.max(segmentSliderMaxSeconds, 2);
  const sliderStartValue = Number.isInteger(sliderStartRaw)
    ? Math.min(Math.max(sliderStartRaw, 0), safeSliderMaxSeconds - 1)
    : 0;
  const sliderEndValue = Number.isInteger(sliderEndRaw)
    ? Math.min(Math.max(sliderEndRaw, sliderStartValue + 1), safeSliderMaxSeconds)
    : Math.min(sliderStartValue + 15, safeSliderMaxSeconds);

  const previewEmbedUrl = useMemo(() => {
    return buildSegmentPreviewUrl(
      selectedVideo?.youtube_embed_url,
      sliderStartValue,
      sliderEndValue,
    );
  }, [selectedVideo?.youtube_embed_url, sliderStartValue, sliderEndValue]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-palette-dark">Video Library</h1>
        <p className="text-palette-dark/70 mt-2">Browse educational videos and assign them to your patients</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-palette-mauve/30">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`${
                activeTab === 'browse'
                  ? 'border-palette-mauve text-palette-mauve'
                  : 'border-transparent text-palette-dark/60 hover:text-palette-dark/80 hover:border-palette-mauve'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Browse Videos
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`${
                activeTab === 'assignments'
                  ? 'border-palette-mauve text-palette-mauve'
                  : 'border-transparent text-palette-dark/60 hover:text-palette-dark/80 hover:border-palette-mauve'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Assignments
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-palette-cream p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeTab === 'browse' ? (
            <div>
              <label className="block text-sm font-medium text-palette-dark/80 mb-2">
                Search Videos
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title..."
                className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-palette-dark/80 mb-2">
                Filter by Patient
              </label>
              <select
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
              >
                <option value="">All Patients</option>
                {myPatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : activeTab === 'browse' ? (
        // Videos Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.length === 0 ? (
            <div className="col-span-full text-center py-12 text-palette-dark/60">
              No videos available
            </div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="bg-palette-cream rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-palette-cream/60 relative group cursor-pointer" onClick={() => handleViewDetails(video)}>
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <FiPlay className="text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-palette-dark mb-2">{video.title}</h3>
                  <p className="text-sm text-palette-dark/70 line-clamp-2 mb-4">
                    {video.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-palette-dark/60">
                      {video.assignment_count || 0} assignments
                    </span>
                    <button
                      onClick={() => handleAssignClick(video)}
                      className="bg-palette-mauve text-white px-3 py-1 rounded text-sm hover:bg-palette-dark flex items-center gap-1"
                    >
                      <FiUserPlus className="text-sm" /> Assign
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Assignments Table
        <div className="bg-palette-cream rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-palette-mauve/30">
            <thead className="bg-palette-beige">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Video
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-palette-dark/60 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-palette-cream divide-y divide-palette-mauve/30">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-palette-dark/60">
                    No assignments found
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-palette-beige">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={assignment.video_details.thumbnail_url}
                          alt={assignment.video_details.title}
                          className="h-12 w-20 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-palette-dark">
                            {assignment.video_details.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-palette-dark">
                        {assignment.patient_details?.first_name} {assignment.patient_details?.last_name}
                      </div>
                      <div className="text-sm text-palette-dark/60">
                        {assignment.patient_details?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-palette-dark max-w-xs truncate">
                        {assignment.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-palette-dark/70">
                      {Number.isInteger(assignment.segment_start_seconds) && Number.isInteger(assignment.segment_end_seconds)
                        ? `${formatSecondsToTimestamp(assignment.segment_start_seconds)} - ${formatSecondsToTimestamp(assignment.segment_end_seconds)} x${assignment.repeat_count || 1}${assignment.pause_between_repeats_seconds > 0 ? ` (${assignment.pause_between_repeats_seconds}s pause)` : ''}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.is_scheduled ? (
                        <div className="space-y-1">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            <FiCalendar className="mr-1 mt-0.5" /> Scheduled
                          </span>
                          <div className="text-xs text-palette-dark/60">
                            {assignment.schedule_start_date} → {assignment.schedule_end_date}
                          </div>
                          <div className="text-xs text-palette-dark/60 flex items-center gap-1">
                            <FiClock className="inline" /> {assignment.scheduled_time}
                          </div>
                          {assignment.schedule_progress && (
                            <div className="text-xs text-palette-dark/70">
                              ✅ {assignment.schedule_progress.viewed_days} /
                              {assignment.schedule_duration_days} days done
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            assignment.viewed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {assignment.viewed ? 'Viewed' : 'Pending'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-palette-dark/60">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(assignment.video_details)}
                        className="text-palette-mauve hover:text-blue-900 mr-3"
                        title="View Video"
                      >
                        <FiEye className="inline" />
                      </button>
                      {assignment.is_scheduled && (
                        <button
                          onClick={() => handleViewProgress(assignment)}
                          className="text-green-600 hover:text-green-800 mr-3"
                          title="View Schedule Progress"
                        >
                          <FiBarChart2 className="inline" />
                        </button>
                      )}
                      <button
                        onClick={() => handleUnassignVideo(assignment.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Unassign"
                      >
                        <FiTrash2 className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedVideo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-palette-cream">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-palette-dark">Assign Video</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  resetAssignmentForm();
                }}
                className="text-palette-dark/50 hover:text-palette-dark/60"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-palette-beige rounded">
              <p className="text-sm font-medium text-palette-dark">{selectedVideo.title}</p>
            </div>

            <form onSubmit={handleAssignVideo}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                    Select Patient *
                  </label>
                  <select
                    name="patient"
                    value={assignmentData.patient}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                  >
                    <option value="">Choose a patient...</option>
                    {myPatients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={assignmentData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Add any instructions or notes for the patient..."
                    className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                  />
                </div>

                <div className="space-y-3 border border-palette-mauve/30 bg-palette-beige/60 rounded-md p-3">
                  <p className="text-sm font-medium text-palette-dark/90">Segment Picker</p>
                  <div className="aspect-video w-full rounded overflow-hidden bg-black">
                    <iframe
                      key={previewEmbedUrl}
                      src={previewEmbedUrl || selectedVideo.youtube_embed_url}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-palette-dark/70 mb-1">
                      <span>Start: {formatSecondsToTimestamp(sliderStartValue)}</span>
                      <span>End: {formatSecondsToTimestamp(sliderEndValue)}</span>
                    </div>
                    <p className="text-xs text-palette-dark/70 mb-2">
                      {isDurationLoading
                        ? 'Detecting video length...'
                        : `Video length: ${formatSecondsToTimestamp(safeSliderMaxSeconds)}`}
                    </p>
                    <label className="block text-xs text-palette-dark/80 mb-1">Start Slider</label>
                    <input
                      type="range"
                      min="0"
                      max={String(safeSliderMaxSeconds - 1)}
                      value={sliderStartValue}
                      onChange={(e) => handleSegmentSliderChange('segment_start', Number(e.target.value))}
                      className="w-full accent-palette-mauve"
                    />
                    <label className="block text-xs text-palette-dark/80 mb-1 mt-2">End Slider</label>
                    <input
                      type="range"
                      min={String(sliderStartValue + 1)}
                      max={String(safeSliderMaxSeconds)}
                      value={sliderEndValue}
                      onChange={(e) => handleSegmentSliderChange('segment_end', Number(e.target.value))}
                      className="w-full accent-palette-mauve"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      name="segment_start"
                      value={assignmentData.segment_start}
                      onChange={handleInputChange}
                      placeholder="00:50"
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      name="segment_end"
                      value={assignmentData.segment_end}
                      onChange={handleInputChange}
                      placeholder="1:90"
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Repeat Count
                      
                    </label>
                    <input
                      type="number"
                      name="repeat_count"
                      value={assignmentData.repeat_count}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Pause (sec)
                    </label>
                    <input
                      type="number"
                      name="pause_between_repeats_seconds"
                      value={assignmentData.pause_between_repeats_seconds}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                </div>

                <p className="text-xs text-palette-dark/60">
                  Moving the slider reloads preview from the selected start/end. Use mm:ss or total seconds.
                </p>

                {/* ── Daily Schedule ── */}
                <div className="border border-palette-mauve/30 bg-palette-beige/60 rounded-md p-3 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={assignmentData.use_schedule}
                      onChange={(e) =>
                        setAssignmentData((p) => ({ ...p, use_schedule: e.target.checked }))
                      }
                      className="accent-palette-mauve w-4 h-4"
                    />
                    <span className="text-sm font-medium text-palette-dark flex items-center gap-1">
                      <FiCalendar className="inline" /> Enable Daily Schedule
                    </span>
                  </label>

                  {assignmentData.use_schedule && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-palette-dark/80 mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="schedule_start_date"
                          value={assignmentData.schedule_start_date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full px-2 py-2 border border-palette-mauve rounded-md bg-palette-beige text-sm focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-palette-dark/80 mb-1">
                          Duration (days) *
                        </label>
                        <input
                          type="number"
                          name="schedule_duration_days"
                          value={assignmentData.schedule_duration_days}
                          onChange={handleInputChange}
                          min="1"
                          required
                          className="w-full px-2 py-2 border border-palette-mauve rounded-md bg-palette-beige text-sm focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-palette-dark/80 mb-1">
                          Unlock Time (daily) *
                        </label>
                        <input
                          type="time"
                          name="scheduled_time"
                          value={assignmentData.scheduled_time}
                          onChange={handleInputChange}
                          required
                          className="w-full px-2 py-2 border border-palette-mauve rounded-md bg-palette-beige text-sm focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                        />
                      </div>
                      <p className="col-span-full text-xs text-palette-dark/60">
                        The video will unlock for the patient every day at the set time.
                        Once watched that day, it disappears until the next day.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    resetAssignmentForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-palette-dark/80 bg-palette-cream border border-palette-mauve rounded-md hover:bg-palette-beige"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-palette-mauve rounded-md hover:bg-palette-dark"
                >
                  Assign Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Progress Modal */}
      {showProgressPanel && (
        <div className="fixed inset-0 bg-palette-dark/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-palette-mauve/20 w-full max-w-2xl shadow-lg rounded-md bg-palette-cream">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-palette-dark flex items-center gap-2">
                <FiBarChart2 /> Schedule Progress
              </h3>
              <button
                onClick={() => { setShowProgressPanel(false); setProgressData(null); }}
                className="text-palette-dark/50 hover:text-palette-dark text-2xl"
              >×</button>
            </div>

            {progressLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : progressData ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-palette-beige rounded-lg p-4 border border-palette-mauve/20">
                  <p className="font-semibold text-palette-dark mb-1">{progressData.video_title}</p>
                  <p className="text-sm text-palette-dark/70">Patient: {progressData.patient}</p>
                  <p className="text-sm text-palette-dark/70">
                    Schedule: {progressData.schedule_start_date} → {progressData.schedule_end_date}
                    &nbsp;·&nbsp;Unlocks at {progressData.scheduled_time} daily
                  </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total Days', value: progressData.total_days, color: 'bg-blue-100 text-blue-800' },
                    { label: 'Viewed', value: progressData.viewed_days, color: 'bg-green-100 text-green-800' },
                    { label: 'Missed', value: progressData.missed_days, color: 'bg-red-100 text-red-800' },
                    { label: 'Remaining', value: progressData.pending_days, color: 'bg-yellow-100 text-yellow-800' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs font-medium mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-palette-dark/60 mb-1">
                    <span>Completion</span>
                    <span>
                      {progressData.total_days > 0
                        ? Math.round((progressData.viewed_days / progressData.total_days) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-palette-beige rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${progressData.total_days > 0
                          ? (progressData.viewed_days / progressData.total_days) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Day-by-day log */}
                <div>
                  <p className="text-sm font-medium text-palette-dark mb-2">Day-by-Day Log</p>
                  {progressData.daily_logs.length === 0 ? (
                    <p className="text-sm text-palette-dark/60">No activity logged yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {progressData.daily_logs.map((log) => (
                        <div
                          key={log.id}
                          className={`rounded-md px-3 py-2 text-xs border ${
                            log.status === 'VIEWED'
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : log.status === 'MISSED'
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          }`}
                        >
                          <div className="font-semibold">{log.scheduled_date}</div>
                          <div className="mt-0.5 capitalize">
                            {log.status === 'VIEWED' ? '✅ Viewed' : log.status === 'MISSED' ? '❌ Missed' : '⏳ Pending'}
                          </div>
                          {log.viewed_at && (
                            <div className="text-xs opacity-70 mt-0.5">
                              {new Date(log.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setShowProgressPanel(false); setProgressData(null); }}
                className="px-6 py-2 text-sm font-medium text-palette-dark bg-palette-beige border border-palette-mauve/30 rounded-md hover:bg-palette-mauve/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedVideo && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-palette-cream">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-palette-dark">Video Preview</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-palette-dark/50 hover:text-palette-dark/60"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="aspect-video w-full">
                <iframe
                  src={selectedVideo.youtube_embed_url}
                  title={selectedVideo.title}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>

              <div>
                <h4 className="font-semibold text-palette-dark text-lg">{selectedVideo.title}</h4>
                <p className="text-sm text-palette-dark/70 mt-2">{selectedVideo.description}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-palette-mauve/30">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-palette-dark/80 bg-palette-cream border border-palette-mauve rounded-md hover:bg-palette-beige"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleAssignClick(selectedVideo);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-palette-mauve rounded-md hover:bg-palette-dark flex items-center gap-2"
                >
                  <FiUserPlus /> Assign to Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
