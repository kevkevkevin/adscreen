import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, query, orderBy, getDoc, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export type MediaItem = {
  id: string;
  userId: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  sizeBytes: number;
  uploadedAt: number;
};

export type ScreenConfig = {
  id: string;
  userId: string;
  name: string;
  passcode?: string;
  activeMediaId: string | null;
  createdAt: number;
};

// Upload media to Storage and save metadata to Firestore
export const uploadMedia = async (userId: string, file: File): Promise<MediaItem> => {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}_${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  
  const storageRef = ref(storage, `media/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  const type = file.type.startsWith('video/') ? 'video' : 'image';
  const sizeBytes = file.size;
  
  const mediaCollection = collection(db, 'media');
  const docRef = await addDoc(mediaCollection, {
    userId,
    name: file.name,
    url,
    type,
    sizeBytes,
    uploadedAt: timestamp,
  });

  return {
    id: docRef.id,
    userId,
    name: file.name,
    url,
    type,
    sizeBytes,
    uploadedAt: timestamp
  };
};

// Subscribe to media library changes for a specific user
export const subscribeToMediaLibrary = (userId: string, callback: (media: MediaItem[]) => void) => {
  const q = query(
    collection(db, 'media'), 
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const mediaList: MediaItem[] = [];
    snapshot.forEach((doc) => {
      mediaList.push({ id: doc.id, ...doc.data() } as MediaItem);
    });
    callback(mediaList);
  });
};

// Subscribe to total storage used by a user (in bytes)
export const subscribeToStorageUsage = (userId: string, callback: (usedBytes: number) => void) => {
  const q = query(collection(db, 'media'), where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    let total = 0;
    snapshot.forEach((doc) => {
      total += (doc.data().sizeBytes || 0);
    });
    callback(total);
  });
};

// --- MULTI-SCREEN FUNCTIONS ---

// Create a new screen for a user with a unique passcode
export const createScreen = async (userId: string, name: string, passcode: string) => {
  const screensCollection = collection(db, 'screens');
  
  // Check if passcode is already taken
  const q = query(screensCollection, where('passcode', '==', passcode));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    throw new Error('Passcode is already in use by another screen.');
  }

  await addDoc(screensCollection, {
    userId,
    name,
    passcode,
    activeMediaId: null,
    createdAt: Date.now()
  });
};

// Get screen ID by passcode
export const getScreenIdByPasscode = async (passcode: string): Promise<string | null> => {
  const q = query(collection(db, 'screens'), where('passcode', '==', passcode));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  return querySnapshot.docs[0].id;
};

// Subscribe to all screens for a specific user
export const subscribeToScreens = (userId: string, callback: (screens: ScreenConfig[]) => void) => {
  const q = query(
    collection(db, 'screens'), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const screenList: ScreenConfig[] = [];
    snapshot.forEach((doc) => {
      screenList.push({ id: doc.id, ...doc.data() } as ScreenConfig);
    });
    callback(screenList);
  });
};

// Set the currently active media on a SPECIFIC screen
export const setActiveMedia = async (screenId: string, mediaId: string) => {
  const screenDoc = doc(db, 'screens', screenId);
  await setDoc(screenDoc, { activeMediaId: mediaId }, { merge: true });
};

// Subscribe to the active media for a SPECIFIC screen view (used by the TV itself, doesn't need userId)
export const subscribeToActiveMedia = (screenId: string, callback: (media: MediaItem | null) => void) => {
  const screenDoc = doc(db, 'screens', screenId);
  
  return onSnapshot(screenDoc, async (snapshot) => {
    if (snapshot.exists()) {
      const { activeMediaId } = snapshot.data();
      if (activeMediaId) {
        // Fetch the actual media item details
        const mediaDoc = await getDoc(doc(db, 'media', activeMediaId));
        if (mediaDoc.exists()) {
          callback({ id: mediaDoc.id, ...mediaDoc.data() } as MediaItem);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
