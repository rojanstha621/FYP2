import { useEffect, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { getFeedback, getUnreadCount, markRead } from '../../api/feedbackApi';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      const [feedbackData, unread] = await Promise.all([
        getFeedback(),
        getUnreadCount(),
      ]);
      setFeedback(feedbackData.items || []);
      setUnreadCount(unread);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleOpenFeedback = async (item) => {
    if (item.is_read) return;
    try {
      await markRead(item.id);
      await loadFeedback();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark feedback as read');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-palette-dark">Feedback</h1>
        <span className="rounded-full bg-palette-mauve px-3 py-1 text-sm font-semibold text-white">
          Unread: {unreadCount}
        </span>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      {feedback.length === 0 ? (
        <div className="rounded-lg bg-palette-cream p-8 text-center text-palette-dark/70">
          No feedback received yet.
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => handleOpenFeedback(item)}
              className={`w-full rounded-lg bg-palette-cream p-4 text-left shadow-sm transition hover:shadow ${
                item.is_read ? 'border-l-4 border-transparent' : 'border-l-4 border-palette-mauve'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-palette-dark">
                  Therapist #{item.therapist}
                </p>
                <p className="text-xs text-palette-dark/60">
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </p>
              </div>
              <p className="text-sm text-palette-dark/80">{item.message}</p>
              {!item.is_read && <p className="mt-2 text-xs font-medium text-palette-mauve">Click to mark as read</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
