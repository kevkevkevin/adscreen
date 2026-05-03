"use client";

import { useState, useEffect } from "react";
import { Plus, MonitorPlay, Copy, Check, Tv, KeyRound } from "lucide-react";
import { subscribeToScreens, createScreen, type ScreenConfig, subscribeToMediaLibrary, MediaItem } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

const generatePasscode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function ScreensPage() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newScreenName, setNewScreenName] = useState("");
  const [newScreenPasscode, setNewScreenPasscode] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setNewScreenPasscode(generatePasscode());
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribeScreens = subscribeToScreens(user.uid, setScreens);
    const unsubscribeMedia = subscribeToMediaLibrary(user.uid, setMediaLibrary);
    return () => {
      unsubscribeScreens();
      unsubscribeMedia();
    };
  }, [user]);

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newScreenName.trim() || !newScreenPasscode.trim()) return;
    
    setIsCreating(true);
    try {
      await createScreen(user.uid, newScreenName.trim(), newScreenPasscode.trim().toUpperCase());
      setNewScreenName("");
      setNewScreenPasscode(generatePasscode());
    } catch (error: any) {
      console.error("Failed to create screen", error);
      alert(error.message || "Failed to create screen.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = (screenId: string) => {
    const url = `${window.location.origin}/screen/${screenId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(screenId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMediaName = (mediaId: string | null) => {
    if (!mediaId) return "Nothing Playing";
    const media = mediaLibrary.find(m => m.id === mediaId);
    return media ? media.name : "Unknown Media";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Screens</h1>
          <p className="text-muted-foreground">Manage your physical displays and their unique URLs.</p>
        </div>
      </div>

      {/* Create Screen Form */}
      <div className="glassmorphism p-6 rounded-3xl flex flex-col md:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <form onSubmit={handleCreateScreen} className="flex-1 flex flex-col md:flex-row gap-4 w-full">
          <input
            type="text"
            value={newScreenName}
            onChange={(e) => setNewScreenName(e.target.value)}
            placeholder="Screen Name (e.g. Front Window)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            required
          />
          <div className="relative md:w-48">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={newScreenPasscode}
              onChange={(e) => setNewScreenPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isCreating}
            className="px-6 py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-[0_0_15px_rgba(228,0,43,0.3)] shrink-0"
          >
            {isCreating ? "Creating..." : "Add Screen"}
          </button>
        </form>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {screens.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Tv className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No screens found. Create your first screen above!</p>
          </div>
        ) : (
          screens.map((screen) => (
            <div key={screen.id} className="glassmorphism rounded-3xl p-6 flex flex-col relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-colors"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <MonitorPlay className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{screen.name}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {/* Passcode Display */}
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary uppercase tracking-wider mb-1 font-semibold">Secret Key</p>
                    <p className="font-mono text-xl tracking-widest text-white">{screen.passcode || 'N/A'}</p>
                  </div>
                  <KeyRound className="w-6 h-6 text-primary/50" />
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Currently Playing</p>
                  <p className="font-medium flex items-center gap-2">
                    {screen.activeMediaId ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/20"></span>
                    )}
                    {getMediaName(screen.activeMediaId)}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground mb-1">Direct URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-black/50 rounded-lg text-xs font-mono text-white/70 truncate border border-white/5">
                    {typeof window !== 'undefined' ? `${window.location.host}/screen/${screen.id}` : `/screen/${screen.id}`}
                  </code>
                  <button 
                    onClick={() => handleCopyUrl(screen.id)}
                    className="p-2 bg-white/5 hover:bg-primary/20 rounded-lg transition-colors border border-white/5 group-hover:border-primary/30"
                    title="Copy URL"
                  >
                    {copiedId === screen.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/70 group-hover:text-primary transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
