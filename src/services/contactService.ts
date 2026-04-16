import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface ContactPayload {
  name: string;
  email: string;
  projectType: string;
  message: string;
}

export async function submitContactForm(payload: ContactPayload) {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }

  // Basic validation
  if (!payload.name || !payload.email || !payload.message) {
    throw new Error('Name, email and message are required');
  }

  const contactRef = collection(db, 'contacts');
  const docRef = await addDoc(contactRef, {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
