"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Video, Upload, Loader2, Trash2, Search } from "lucide-react";
import clsx from "clsx";
import { 
  type MediaItem, 
  uploadMedia, 
  subscribeToMediaLibrary,
  subscribeToStorageUsage
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export default function LibraryPage() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribeLibrary = subscribeToMediaLibrary(user.uid, (media) => {
      setLibrary(media);
    });

    const unsubscribeStorage = subscribeToStorageUsage(user.uid, (bytes) => {
      setUsedBytes(bytes);
    });

    return () => {
      unsubscribeLibrary();
      unsubscribeStorage();
    };
  }, [user]);

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

  const filteredLibrary = library
    .filter(media => filter === 'all' || media.type === filter)
    .filter(media => media.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Media Library</h1>
          <p className="text-muted-foreground">Manage and upload your images and videos.</p>
        </div>
        
        <div className="flex items-center gap-4">
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
              "flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(228,0,43,0.3)]",
              isUploading ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
            )}
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isUploading ? "Uploading..." : "Upload New Media"}
          </button>
        </div>
      </div>

      <div className="glassmorphism p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setFilter('all')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-colors border", filter === 'all' ? "bg-white/10 border-white/20 text-white" : "border-transparent hover:bg-white/5 text-muted-foreground")}
          >
            All Media
          </button>
          <button 
            onClick={() => setFilter('image')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-colors border", filter === 'image' ? "bg-white/10 border-white/20 text-white" : "border-transparent hover:bg-white/5 text-muted-foreground")}
          >
            Images
          </button>
          <button 
            onClick={() => setFilter('video')}
            className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-colors border", filter === 'video' ? "bg-white/10 border-white/20 text-white" : "border-transparent hover:bg-white/5 text-muted-foreground")}
          >
            Videos
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all text-white"
          />
        </div>
      </div>

      {library.length === 0 ? (
        <div className="text-center py-32 glassmorphism rounded-3xl border-dashed border-2 border-white/10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No media uploaded yet</h3>
          <p className="text-muted-foreground mb-6">Upload your first image or video to get started.</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
          >
            Select Files
          </button>
        </div>
      ) : filteredLibrary.length === 0 ? (
        <div className="text-center py-20 glassmorphism rounded-3xl">
          <p className="text-muted-foreground">No media found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredLibrary.map((media) => (
            <motion.div
              key={media.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 hover:border-white/30 transition-all duration-300"
            >
              <div className="aspect-square bg-black/40 relative flex items-center justify-center overflow-hidden">
                {media.type === 'image' ? (
                  <img src={media.url} alt={media.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <>
                    <video src={media.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-md">
                       <Video className="w-4 h-4 text-white" />
                    </div>
                  </>
                )}
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <a href={media.url} target="_blank" rel="noreferrer" className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors" title="View Media">
                    <Search className="w-5 h-5" />
                  </a>
                  <button className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 backdrop-blur-md rounded-lg transition-colors" title="Delete (coming soon)">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <p className="font-medium truncate text-white/90 text-sm" title={media.name}>{media.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(media.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
