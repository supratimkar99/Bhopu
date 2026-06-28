import { addDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from '../analytics/firebase';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in failed:', error);
    throw new Error(
      error?.message || 'Google sign-in failed. Please make sure Google sign-in is enabled in Firebase Auth.'
    );
  }
}

export async function signOutGoogle() {
  return signOut(auth);
}

export async function getExistingPrediction({ uid, email }) {
  const predictionsCollection = collection(db, 'predictions');
  const getByUid = query(predictionsCollection, where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(getByUid);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  if (email) {
    const getByEmail = query(predictionsCollection, where('email', '==', email), orderBy('createdAt', 'desc'), limit(1));
    const emailSnapshot = await getDocs(getByEmail);
    if (!emailSnapshot.empty) {
      const doc = emailSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }

  return null;
}

export async function savePrediction({ email, uid, name, predictions }) {
  try {
    const docRef = await addDoc(collection(db, 'predictions'), {
      email,
      uid,
      name,
      predictions: JSON.stringify(predictions),
      createdAt: serverTimestamp()
    });
    console.log('Prediction saved docId:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw new Error('Failed to save prediction.');
  }
}
