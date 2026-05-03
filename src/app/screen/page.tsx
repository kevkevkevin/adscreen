"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonitorPlay, KeyRound, Loader2 } from "lucide-react";
import { getScreenIdByPasscode } from "@/lib/firebase";
import clsx from "clsx";

export default function ScreenPortal() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glassmorphism p-10 rounded-3xl w-full max-w-md relative z-10 text-center border border-white/10 shadow-2xl">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(228,0,43,0.3)]">
          <MonitorPlay className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Connect Display</h1>
        <p className="text-muted-foreground mb-8">
          Enter the secret key assigned to this screen to start casting media.
        </p>

        <form onSubmit={handleConnect} className="space-y-6">
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="ENTER SECRET KEY"
              className={clsx(
                "w-full bg-black/50 border rounded-2xl py-4 pl-12 pr-4 text-center text-xl tracking-[0.2em] font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase",
                error ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10"
              )}
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isConnecting || !passcode.trim()}
            className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(228,0,43,0.4)] flex items-center justify-center"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </button>
        </form>
      </div>
      
      <p className="absolute bottom-8 text-xs text-white/30 font-mono">
        AdCast Digital Signage Platform
      </p>
    </div>
  );
}
