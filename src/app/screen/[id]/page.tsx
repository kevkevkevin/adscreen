"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { subscribeToActiveMedia, type MediaItem } from "@/lib/firebase";

export default function ScreenView() {
  const params = useParams();
  const screenId = params.id as string;
  const [activeMedia, setActiveMedia] = useState<MediaItem | null | undefined>(undefined);

  useEffect(() => {
    if (!screenId) return;

    // Listen for real-time changes to the active media for THIS specific screen
    const unsubscribe = subscribeToActiveMedia(screenId, (media) => {
      setActiveMedia(media);
    });

    return () => unsubscribe();
  }, [screenId]);

  if (activeMedia === undefined) {
    // Initial loading state
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeMedia === null) {
    // No active media set
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black space-y-4 text-white/50">
        <p className="text-2xl font-semibold tracking-wider">ADCAST SCREEN SYSTEM</p>
        <p>Awaiting media assignment from dashboard...</p>
        <p className="text-xs mt-8 px-4 py-1 rounded bg-white/5 font-mono">Screen ID: {screenId}</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center relative">
      {activeMedia.type === "image" ? (
        <img
          src={activeMedia.url}
          alt={activeMedia.name}
          className="w-full h-full object-cover animate-in fade-in duration-1000"
          key={activeMedia.id} // Forces re-render for animation on change
        />
      ) : (
        <video
          src={activeMedia.url}
          className="w-full h-full object-cover animate-in fade-in duration-1000"
          autoPlay
          loop
          muted
          playsInline
          key={activeMedia.id}
        />
      )}
      
      {/* Screen ID identifier */}
      <div className="absolute bottom-4 right-4 bg-zinc-900 px-3 py-1.5 rounded-full border border-white/10 opacity-30 pointer-events-none">
        <span className="text-white text-xs font-medium tracking-widest">{screenId.toUpperCase()}</span>
      </div>
    </div>
  );
}
