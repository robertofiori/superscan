import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { type ShoppingListItem } from '../api';

const COLLECTION_NAME = 'shoppingLists';

export interface SavedList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  updatedAt: string;
}

/**
 * Removes undefined fields from an object to prevent Firestore errors.
 */
function sanitizeData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, value) => (value === undefined ? null : value)));
}

export const saveUserList = async (uid: string, items: ShoppingListItem[]) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const sanitizedItems = items.map(item => sanitizeData(item));
    await setDoc(docRef, { active: sanitizedItems, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Error saving user active list to Firestore:", error);
  }
};

export const fetchUserList = async (uid: string): Promise<ShoppingListItem[]> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().active as ShoppingListItem[]) || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user list from Firestore:", error);
    return [];
  }
};

export const saveNamedList = async (uid: string, name: string, items: ShoppingListItem[]) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    const currentSaved = docSnap.exists() ? (docSnap.data().saved as SavedList[]) || [] : [];
    
    if (currentSaved.length >= 3) {
      throw new Error("Límite de 3 listas guardadas alcanzado.");
    }

    const sanitizedItems = items.map(item => sanitizeData(item));
    const newList: SavedList = {
      id: crypto.randomUUID(),
      name,
      items: sanitizedItems,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, { saved: [...currentSaved, newList] }, { merge: true });
    return newList;
  } catch (error) {
    console.error("Error naming list:", error);
    throw error;
  }
};

export const deleteNamedList = async (uid: string, listId: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const currentSaved = (docSnap.data().saved as SavedList[]) || [];
    const filtered = currentSaved.filter(l => l.id !== listId);
    
    await updateDoc(docRef, { saved: filtered });
  } catch (error) {
    console.error("Error deleting list:", error);
  }
};

export const renameNamedList = async (uid: string, listId: string, newName: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;

    const currentSaved = (docSnap.data().saved as SavedList[]) || [];
    const updated = currentSaved.map(l => l.id === listId ? { ...l, name: newName, updatedAt: new Date().toISOString() } : l);
    
    await updateDoc(docRef, { saved: updated });
  } catch (error) {
    console.error("Error renaming list:", error);
  }
};

export const fetchSavedLists = async (uid: string): Promise<SavedList[]> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().saved as SavedList[]) || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching saved lists:", error);
    return [];
  }
};

export const subscribeToList = (uid: string, callback: (items: ShoppingListItem[], saved: SavedList[]) => void) => {
  const docRef = doc(db, COLLECTION_NAME, uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.active || [], data.saved || []);
    } else {
      callback([], []);
    }
  });
};
