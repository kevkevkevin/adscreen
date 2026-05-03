"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorPlay, KeyRound, Loader2, Maximize } from "lucide-react";
import { getScreenIdByPasscode } from "@/lib/firebase";

export default function ScreenPortal() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPasscode = passcode.trim().toUpperCase();
    if (!trimmedPasscode) return;

    setIsConnecting(true);
    setError(null);

    try {
      const screenId = await getScreenIdByPasscode(trimmedPasscode);
      if (screenId) {
        // Redirect to the actual screen view
        router.push(`/screen/${screenId}`);
      } else {
        setError("Invalid Secret Key. Please check your spelling and try again.");
      }
    } catch (err: any) {
      console.error("Connection error:", err);
      setError("An error occurred while trying to connect.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      fontFamily: 'sans-serif',
      color: '#ffffff',
      overflow: 'hidden'
    }}>
      
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

      <div style={{
        backgroundColor: '#18181b',
        padding: '40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <MonitorPlay size={40} color="#e4002b" />
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Connect Display</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 32px 0', fontSize: '14px' }}>
          Enter the secret key assigned to this screen to start casting media.
        </p>

        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
              <KeyRound size={20} color="rgba(255,255,255,0.4)" />
            </div>
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConnect(e);
                }
              }}
              placeholder="ENTER SECRET KEY"
              style={{
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '16px 16px 16px 48px',
                textAlign: 'center',
                fontSize: '20px',
                letterSpacing: '4px',
                fontFamily: 'monospace',
                color: '#ffffff',
                textTransform: 'uppercase',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: '14px', margin: '0 0 24px 0' }}>{error}</p>
          )}

          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting || !passcode.trim()}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#e4002b',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '18px',
              borderRadius: '16px',
              border: 'none',
              cursor: (isConnecting || !passcode.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isConnecting || !passcode.trim()) ? 0.5 : 1,
              textAlign: 'center'
            }}
          >
            {isConnecting ? "CONNECTING..." : "CONNECT"}
          </button>
        </form>
      </div>
      
      <p style={{
        position: 'absolute',
        bottom: '32px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'monospace'
      }}>
        AdCast Digital Signage Platform
      </p>
    </div>
  );
}
