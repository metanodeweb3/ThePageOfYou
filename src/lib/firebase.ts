import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, getDoc, query, orderBy, limit, increment, type Firestore } from 'firebase/firestore';
import { PersonNameData } from '../types';
import { normalizeText } from '../utils/searchEngine';
import { isIndexableName, isValidNameInput, formatDisplayName } from '../utils/seo';

// Safely resolve configuration if firebase-applet-config.json exists
const configModules = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const firebaseConfig = (configModules['../../firebase-applet-config.json'] as any)?.default || null;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (firebaseConfig) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  } catch (err) {
    console.warn('Failed to initialize Firebase app or firestore:', err);
  }
}

const DEFAULT_POPULAR_NAMES = [
  'Eleanor', 'Jude', 'Sarah', 'Michael', 'Rhiannon', 'Maya',
  'Daniel', 'Alice', 'Javier', 'Salvador', 'Nacho',
];

function isClientCachedDataUsable(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!data.meaning || typeof data.meaning !== 'string') return false;
  const totalRefs =
    (Array.isArray(data.books) ? data.books.length : 0) +
    (Array.isArray(data.songs) ? data.songs.length : 0) +
    (Array.isArray(data.movies) ? data.movies.length : 0) +
    (Array.isArray(data.games) ? data.games.length : 0) +
    (Array.isArray(data.art) ? data.art.length : 0);
  const hasAcrostic = Array.isArray(data.acrostic) && data.acrostic.length > 0;
  return totalRefs >= 3 && hasAcrostic;
}

export async function fetchPopularNames(): Promise<string[]> {
  if (!db) {
    return DEFAULT_POPULAR_NAMES;
  }
  try {
    const popularRef = collection(db, 'popular_names');
    const q = query(popularRef, orderBy('searchCount', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return DEFAULT_POPULAR_NAMES;
    }

    const names: string[] = [];
    const seen = new Set<string>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.name && typeof data.name === 'string' && isIndexableName(data.name)) {
        const display = formatDisplayName(data.name);
        const norm = normalizeText(display);
        if (!seen.has(norm)) {
          seen.add(norm);
          names.push(display);
        }
      }
    });

    return names.length >= 4 ? names.slice(0, 12) : DEFAULT_POPULAR_NAMES;
  } catch (error) {
    console.warn('Firebase fetchPopularNames error, falling back to static list:', error);
    return DEFAULT_POPULAR_NAMES;
  }
}

export async function trackNameSearch(name: string): Promise<void> {
  if (!db || !name || !isIndexableName(name)) return;
  const cleanName = formatDisplayName(name);
  const docId = normalizeText(cleanName);
  if (!docId || docId.length < 2 || docId.length > 40) return;

  try {
    const docRef = doc(db, 'popular_names', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await setDoc(
        docRef,
        {
          name: docSnap.data()?.name || cleanName,
          searchCount: increment(1),
          lastSearchedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      await setDoc(docRef, {
        name: cleanName,
        searchCount: 1,
        featured: false,
        lastSearchedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('Firebase trackNameSearch error:', error);
  }
}

export async function getCachedNameData(name: string): Promise<PersonNameData | null> {
  if (!db || !name || !name.trim()) return null;
  const docId = normalizeText(name);
  if (!docId) return null;

  try {
    const docRef = doc(db, 'name_cache', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const firestoreData = docSnap.data();
      if (!firestoreData) return null;
      const schemaVersion = typeof firestoreData.schemaVersion === 'number' ? firestoreData.schemaVersion : 0;
      if (schemaVersion < 3) return null;

      if (firestoreData.data && isClientCachedDataUsable(firestoreData.data)) {
        return firestoreData.data as PersonNameData;
      }
    }
  } catch (error) {
    console.warn('Firebase getCachedNameData error:', error);
  }
  return null;
}

export async function cacheNameData(nameData: PersonNameData): Promise<void> {
  if (!db || !nameData || !nameData.name) return;
  if (!isValidNameInput(nameData.name).valid) return;
  if (!isClientCachedDataUsable(nameData)) return;

  const docId = normalizeText(nameData.name);
  if (!docId || docId.length < 2 || docId.length > 40) return;

  try {
    const docRef = doc(db, 'name_cache', docId);
    await setDoc(
      docRef,
      {
        name: formatDisplayName(nameData.name),
        data: nameData,
        schemaVersion: 3,
        lastSearchedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firebase cacheNameData error:', error);
  }
}

export { app, db };
