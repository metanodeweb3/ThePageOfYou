import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, getDoc, query, orderBy, limit, increment } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const DEFAULT_POPULAR_NAMES = [
  'Michael', 'Sarah', 'Elizabeth', 'Arthur', 'Alice', 'James',
  'Eleanor', 'David', 'Sophia', 'Alexander', 'Charlotte', 'John'
];

export async function fetchPopularNames(): Promise<string[]> {
  try {
    const popularRef = collection(db, 'popular_names');
    const q = query(popularRef, orderBy('searchCount', 'desc'), limit(15));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed initial popular names
      const initialList: string[] = [];
      for (const name of DEFAULT_POPULAR_NAMES) {
        const docRef = doc(db, 'popular_names', name.toLowerCase());
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

    // Fallback if snapshot returned items without names
    return names.length > 0 ? names : DEFAULT_POPULAR_NAMES;
  } catch (error) {
    console.warn('Firebase fetchPopularNames error, falling back to static list:', error);
    return DEFAULT_POPULAR_NAMES;
  }
}

export async function trackNameSearch(name: string): Promise<void> {
  if (!name || !name.trim()) return;
  const cleanName = name.trim();
  const docId = cleanName.toLowerCase();

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
