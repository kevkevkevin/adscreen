"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { subscribeToActiveMedia, type MediaItem } from "@/lib/firebase";
import { Maximize } from "lucide-react";

export default function ScreenView() {
  const params = useParams();
  const screenId = params.id as string;
  const [activeMedia, setActiveMedia] = useState<MediaItem | null | undefined>(undefined);

  const handleFullscreen = () => {
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  };

  useEffect(() => {
    if (!screenId) return;

    // Listen for real-time changes to the active media for THIS specific screen
    const unsubscribe = subscribeToActiveMedia(screenId, (media) => {
      setActiveMedia(media);
    });

    return () => unsubscribe();
  }, [screenId]);

  const baseContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100vh',
    margin: 0,
    padding: 0,
    backgroundColor: '#000000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    position: 'relative'
  };

  if (activeMedia === undefined) {
    // Initial loading state
    return (
      <div style={baseContainerStyle}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #e4002b',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (activeMedia === null) {
    // No active media set
    return (
      <div style={baseContainerStyle}>
        <button 
          onClick={handleFullscreen}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            padding: '16px',
            backgroundColor: '#18181b',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            zIndex: 20
          }}
          title="Fullscreen"
        >
          <Maximize size={24} />
        </button>

        <p style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '2px', margin: '0 0 16px 0' }}>ADCAST SCREEN SYSTEM</p>
        <p style={{ margin: '0 0 32px 0' }}>Awaiting media assignment from dashboard...</p>
        <p style={{ 
          fontSize: '12px', 
          padding: '4px 16px', 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          Screen ID: {screenId}
        </p>
      </div>
    );
  }

  return (
    <div style={{ ...baseContainerStyle, padding: 0 }}>
      {activeMedia.type === "image" ? (
        <img
          src={activeMedia.url}
          alt={activeMedia.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          key={activeMedia.id} // Forces re-render for animation on change
        />
      ) : (
        <video
          src={activeMedia.url}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          autoPlay
          loop
          muted
          playsInline
          key={activeMedia.id}
        />
      )}
      
      {/* Fullscreen Button */}
      <button 
        onClick={handleFullscreen}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          padding: '16px',
          backgroundColor: '#18181b',
          borderRadius: '12px',
          color: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          zIndex: 20
        }}
        title="Fullscreen"
      >
        <Maximize size={24} />
      </button>

      {/* Screen ID identifier */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        backgroundColor: '#18181b',
        padding: '6px 12px',
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: 0.5,
        pointerEvents: 'none'
      }}>
        <span style={{ color: 'white', fontSize: '12px', fontWeight: 500, letterSpacing: '2px' }}>
          {screenId.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
