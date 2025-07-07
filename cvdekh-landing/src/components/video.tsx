"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, Loader2 } from "lucide-react";

interface VideoModalProps {
  videoUrl?: string;
  thumbnailUrl?: string;
}

export default function VercelBlobVideoModal({
  videoUrl = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "",
  thumbnailUrl = process.env.NEXT_PUBLIC_DEMO_THUMBNAIL_URL || "",
}: VideoModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset video state when modal closes
  useEffect(() => {
    if (!isModalOpen && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [isModalOpen]);

  const handleLoadedData = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="font-semibold bg-neutral-900 hover:bg-neutral-900/70 text-neutral-100 py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center border-neutral-300/40 border h-16"
        >
          <div className="flex items-center">
            <span className="text-lg text-neutral-100">Watch Demo</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl w-max p-0 overflow-hidden">
        <div className="relative bg-black rounded-lg">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}

          <video
            ref={videoRef}
            className="w-min h-auto max-h-[80vh] rounded-lg"
            poster={thumbnailUrl}
            preload="metadata"
            playsInline
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Custom Controls */}
          {!isLoading && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
              {/* Progress Bar */}
              <div
                className="w-full h-2 bg-white/20 rounded-full mb-4 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-150 group-hover:bg-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20 p-2"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </Button>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Play Overlay */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlay}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-6 transition-all duration-200 hover:scale-110"
              >
                <Play size={32} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
