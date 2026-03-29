import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { type ShoppingListItem } from '../api';

const COLLECTION_NAME = 'shoppingLists';

export const saveUserList = async (uid: string, items: ShoppingListItem[]) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, { items, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error saving user list to Firestore:", error);
  }
};

export const fetchUserList = async (uid: string): Promise<ShoppingListItem[]> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().items as ShoppingListItem[]) || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user list from Firestore:", error);
    return [];
  }
};

export const subscribeToList = (uid: string, callback: (items: ShoppingListItem[]) => void) => {
  const docRef = doc(db, COLLECTION_NAME, uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback((docSnap.data().items as ShoppingListItem[]) || []);
    } else {
      callback([]);
    }
  });
};
