import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, getDoc, query, orderBy, limit, increment, type Firestore } from 'firebase/firestore';
import { PersonNameData } from '../types';
import { normalizeText } from '../utils/searchEngine';

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
  'Michael', 'Sarah', 'Elizabeth', 'Arthur', 'Alice', 'James',
  'Eleanor', 'David', 'Sophia', 'Alexander', 'Charlotte', 'John'
];

export async function fetchPopularNames(): Promise<string[]> {
  if (!db) {
    return DEFAULT_POPULAR_NAMES;
  }
  try {
    const popularRef = collection(db, 'popular_names');
    const q = query(popularRef, orderBy('searchCount', 'desc'), limit(15));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed initial popular names
      const initialList: string[] = [];
      for (const name of DEFAULT_POPULAR_NAMES) {
        const docRef = doc(db, 'popular_names', normalizeText(name));
        await setDoc(docRef, {
          name: name,
          searchCount: 1,
          featured: true,
          lastSearchedAt: new Date().toISOString()
        }, { merge: true });
        initialList.push(name);
      }
      return initialList;
    }

    const names: string[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.name) {
        names.push(data.name);
      }
    });

    return names.length > 0 ? names : DEFAULT_POPULAR_NAMES;
  } catch (error) {
    console.warn('Firebase fetchPopularNames error, falling back to static list:', error);
    return DEFAULT_POPULAR_NAMES;
  }
}

export async function trackNameSearch(name: string): Promise<void> {
  if (!db || !name || !name.trim()) return;
  const cleanName = name.trim();
  const docId = normalizeText(cleanName);

  try {
    const docRef = doc(db, 'popular_names', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await setDoc(docRef, {
        searchCount: increment(1),
        lastSearchedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      await setDoc(docRef, {
        name: cleanName,
        searchCount: 1,
        featured: false,
        lastSearchedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn('Firebase trackNameSearch error:', error);
  }
}

export async function getCachedNameData(name: string): Promise<PersonNameData | null> {
  if (!db || !name || !name.trim()) return null;
  const docId = normalizeText(name);
  try {
    const docRef = doc(db, 'name_cache', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const firestoreData = docSnap.data();
      if (!firestoreData) return null;
      if (firestoreData.data) {
        return firestoreData.data as PersonNameData;
      }
      if (firestoreData.nameData) {
        return firestoreData.nameData as PersonNameData;
      }
      if (firestoreData.origin || firestoreData.meaning || firestoreData.books) {
        return firestoreData as PersonNameData;
      }
    }
  } catch (error) {
    console.warn('Firebase getCachedNameData error:', error);
  }
  return null;
}

export async function cacheNameData(nameData: PersonNameData): Promise<void> {
  if (!db || !nameData || !nameData.name) return;
  const docId = normalizeText(nameData.name);
  try {
    const docRef = doc(db, 'name_cache', docId);
    await setDoc(docRef, {
      name: nameData.name,
      data: nameData,
      lastSearchedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firebase cacheNameData error:', error);
  }
}

export { app, db };


