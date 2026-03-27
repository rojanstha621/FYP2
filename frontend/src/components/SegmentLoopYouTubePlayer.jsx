import { useEffect, useMemo, useRef, useState } from 'react';

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

function extractVideoId(embedUrl = '') {
  const embedMatch = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return embedMatch[1];
  }

  const watchMatch = embedUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return watchMatch[1];
  }

  return null;
}

export default function SegmentLoopYouTubePlayer({
  embedUrl,
  title,
  segmentStartSeconds,
  segmentEndSeconds,
  repeatCount,
  pauseBetweenRepeatsSeconds = 0,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const loopCheckRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const loopCompletedRef = useRef(0);
  const waitingForResumeRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);

  const videoId = useMemo(() => extractVideoId(embedUrl), [embedUrl]);
  const hasSegment = Number.isInteger(segmentStartSeconds)
    && Number.isInteger(segmentEndSeconds)
    && segmentEndSeconds > segmentStartSeconds
    && repeatCount > 0;

  const fallbackUrl = useMemo(() => {
    if (!embedUrl) {
      return '';
    }
    const separator = embedUrl.includes('?') ? '&' : '?';
    return `${embedUrl}${separator}autoplay=1`;
  }, [embedUrl]);

  useEffect(() => {
    return () => {
      if (loopCheckRef.current) {
        window.clearInterval(loopCheckRef.current);
      }
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!videoId || !hasSegment || !containerRef.current) {
      return;
    }

    let cancelled = false;

    const startPlayer = async () => {
      const YT = await loadYouTubeIframeApi();
      if (cancelled || !containerRef.current) {
        return;
      }

      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }

      loopCompletedRef.current = 0;
      waitingForResumeRef.current = false;
      setPlayerReady(false);

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          start: segmentStartSeconds,
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true);
            event.target.seekTo(segmentStartSeconds, true);
            event.target.playVideo();

            if (loopCheckRef.current) {
              window.clearInterval(loopCheckRef.current);
            }

            loopCheckRef.current = window.setInterval(() => {
              const player = playerRef.current;
              if (!player || typeof player.getCurrentTime !== 'function') {
                return;
              }

              const currentTime = player.getCurrentTime();
              const state = player.getPlayerState?.();
              const isPlaying = state === window.YT.PlayerState.PLAYING;

              if (isPlaying && currentTime >= segmentEndSeconds - 0.15 && !waitingForResumeRef.current) {
                loopCompletedRef.current += 1;

                if (loopCompletedRef.current < repeatCount) {
                  if (pauseBetweenRepeatsSeconds > 0) {
                    waitingForResumeRef.current = true;
                    player.pauseVideo();
                    resumeTimeoutRef.current = window.setTimeout(() => {
                      const resumedPlayer = playerRef.current;
                      if (!resumedPlayer) {
                        return;
                      }
                      waitingForResumeRef.current = false;
                      resumedPlayer.seekTo(segmentStartSeconds, true);
                      resumedPlayer.playVideo();
                    }, pauseBetweenRepeatsSeconds * 1000);
                  } else {
                    player.seekTo(segmentStartSeconds, true);
                    player.playVideo();
                  }
                } else {
                  player.pauseVideo();
                  window.clearInterval(loopCheckRef.current);
                  loopCheckRef.current = null;
                }
              }
            }, 200);
          },
        },
      });
    };

    startPlayer();

    return () => {
      cancelled = true;
      if (loopCheckRef.current) {
        window.clearInterval(loopCheckRef.current);
        loopCheckRef.current = null;
      }
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      waitingForResumeRef.current = false;
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [
    videoId,
    hasSegment,
    segmentStartSeconds,
    segmentEndSeconds,
    repeatCount,
    pauseBetweenRepeatsSeconds,
  ]);

  if (!embedUrl) {
    return <div className="w-full h-full bg-black" />;
  }

  if (!hasSegment || !videoId) {
    return (
      <iframe
        src={fallbackUrl}
        title={title}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    );
  }

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={containerRef} className="w-full h-full" />
      {!playerReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/50">
          Loading video player...
        </div>
      )}
    </div>
  );
}
