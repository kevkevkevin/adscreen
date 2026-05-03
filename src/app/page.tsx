"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Image as ImageIcon, Video, Upload, CheckCircle2, MonitorSmartphone, Loader2, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { 
  type MediaItem,
  type ScreenConfig,
  uploadMedia, 
  setActiveMedia, 
  subscribeToMediaLibrary, 
  subscribeToActiveMedia,
  subscribeToScreens,
  subscribeToStorageUsage
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export default function Dashboard() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  
  const [activeMedia, setActiveMediaState] = useState<MediaItem | null>(null);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribeLibrary = subscribeToMediaLibrary(user.uid, (media) => {
      setLibrary(media);
    });

    const unsubscribeScreens = subscribeToScreens(user.uid, (fetchedScreens) => {
      setScreens(fetchedScreens);
      if (fetchedScreens.length > 0 && !selectedScreenId) {
        setSelectedScreenId(fetchedScreens[0].id);
      }
    });

    const unsubscribeStorage = subscribeToStorageUsage(user.uid, (bytes) => {
      setUsedBytes(bytes);
    });

    return () => {
      unsubscribeLibrary();
      unsubscribeScreens();
      unsubscribeStorage();
    };
  }, [user, selectedScreenId]);

  // Listen to active media for the currently selected screen
  useEffect(() => {
    if (!selectedScreenId) {
      setActiveMediaState(null);
      return;
    }

    const unsubscribeActive = subscribeToActiveMedia(selectedScreenId, (media) => {
      setActiveMediaState(media);
    });

    return () => unsubscribeActive();
  }, [selectedScreenId]);

  const handleSetActive = async (media: MediaItem) => {
    if (!selectedScreenId) {
      alert("Please select a screen first or create one in 'My Screens'.");
      return;
    }

    try {
      await setActiveMedia(selectedScreenId, media.id);
    } catch (error) {
      console.error("Error setting active media:", error);
      alert("Failed to set active media.");
    }
  };

  const handleSetAllActive = async (media: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (screens.length === 0) {
      alert("You have no screens created.");
      return;
    }

    try {
      const promises = screens.map(screen => setActiveMedia(screen.id, media.id));
      await Promise.all(promises);
    } catch (error) {
      console.error("Error setting active media for all screens:", error);
      alert("Failed to update all screens.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Check quota
    if (usedBytes + file.size > MAX_STORAGE_BYTES) {
      alert("Storage limit exceeded! You only have 2GB of storage. Please upgrade your plan.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      await uploadMedia(user.uid, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload media. Ensure Firebase rules allow write access.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedScreen = screens.find(s => s.id === selectedScreenId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Screen Overview</h1>
          <p className="text-muted-foreground">Manage the content currently playing on your advertising screens.</p>
        </div>
        
        {/* Screen Selector */}
        {screens.length > 0 ? (
          <div className="relative">
            <select 
              value={selectedScreenId || ''} 
              onChange={(e) => setSelectedScreenId(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 text-white py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer min-w-[200px]"
            >
              {screens.map(screen => (
                <option key={screen.id} value={screen.id} className="bg-black text-white">
                  {screen.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 py-3 px-4 rounded-xl text-sm text-muted-foreground">
            No screens created yet. Go to 'My Screens'.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Currently Playing Card */}
        <div className="lg:col-span-2 glassmorphism rounded-3xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-6 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MonitorSmartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Currently Playing</h2>
                <p className="text-xs text-muted-foreground">on <strong className="text-white">{selectedScreen?.name || "Unknown Screen"}</strong></p>
              </div>
            </div>
            
            {activeMedia && (
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium flex items-center gap-2 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live
              </div>
            )}
          </div>

          <div className="relative flex-1 rounded-2xl overflow-hidden bg-black/50 border border-white/5 min-h-[300px] group flex items-center justify-center">
            {activeMedia ? (
              <>
                {activeMedia.type === 'image' ? (
                  <img src={activeMedia.url} alt={activeMedia.name} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                  <video src={activeMedia.url} className="w-full h-full object-cover absolute inset-0" autoPlay loop muted playsInline />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-2xl font-bold">{activeMedia.name}</h3>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <MonitorSmartphone className="w-12 h-12 opacity-50 mb-2" />
                <p>{screens.length === 0 ? "Create a screen to start" : "No media currently playing"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats or Actions */}
        <div className="flex flex-col gap-6">
          <div className="glassmorphism rounded-3xl p-6 flex-1 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 border border-primary/20 shadow-[0_0_20px_rgba(228,0,43,0.3)]">
              {isUploading ? (
                 <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                 <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <h3 className="text-xl font-semibold">Upload Media</h3>
            <p className="text-sm text-muted-foreground mb-4">Supported formats: JPG, PNG, MP4</p>
            
            <input 
              type="file" 
              accept="image/*,video/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={clsx(
                "w-full py-3 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(228,0,43,0.5)]",
                isUploading ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
              )}
            >
              {isUploading ? "Uploading..." : "Select Files"}
            </button>
          </div>
          
          <div className="glassmorphism rounded-3xl p-6">
             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Global Status</h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-white/80">Active Screens</span>
                 <span className="font-mono font-medium text-primary">{screens.length}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-white/80">Total Media</span>
                 <span className="font-mono font-medium">{library.length}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Media Library</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/5">All</button>
            <button className="px-4 py-2 rounded-lg hover:bg-white/5 text-muted-foreground text-sm font-medium transition-colors">Images</button>
            <button className="px-4 py-2 rounded-lg hover:bg-white/5 text-muted-foreground text-sm font-medium transition-colors">Videos</button>
          </div>
        </div>

        {library.length === 0 ? (
          <div className="text-center py-20 glassmorphism rounded-3xl">
            <p className="text-muted-foreground">Your library is empty. Upload some media to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {library.map((media) => {
              const isPlaying = activeMedia?.id === media.id;
              
              return (
                <motion.div
                  key={media.id}
                  whileHover={{ y: -5 }}
                  className={clsx(
                    "relative group rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300",
                    isPlaying ? "border-primary shadow-[0_0_15px_rgba(228,0,43,0.3)]" : "border-white/10 hover:border-white/30"
                  )}
                  onClick={() => handleSetActive(media)}
                >
                  <div className="aspect-[4/3] bg-black/40 relative">
                    {media.type === 'image' ? (
                      <img src={media.url} alt={media.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <>
                        <video src={media.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-md">
                           <Video className="w-4 h-4 text-white" />
                        </div>
                      </>
                    )}
                    
                    {isPlaying && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-white mb-2 shadow-2xl" />
                        <span className="text-white font-semibold shadow-2xl">Playing</span>
                      </div>
                    )}

                    {!isPlaying && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(media);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-medium hover:bg-primary transition-colors w-40 justify-center"
                        >
                          <Play className="w-4 h-4" /> Send to TV
                        </button>
                        <button 
                          onClick={(e) => handleSetAllActive(media, e)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-medium hover:bg-primary-dark transition-colors w-40 justify-center text-xs"
                        >
                          <MonitorSmartphone className="w-3 h-3" /> Send to All
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-[#0a0a0a]">
                    <p className="font-medium truncate text-white/90 group-hover:text-white transition-colors">{media.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Uploaded {new Date(media.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
