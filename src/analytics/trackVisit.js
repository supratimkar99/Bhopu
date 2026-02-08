import {
  doc,
  setDoc,
  serverTimestamp,
  increment
} from "firebase/firestore";

import { db } from "./firebase";
import { getVisitorId } from "./visitor";

export async function trackVisit() {
  const visitorId = getVisitorId();
  const ref = doc(db, "visitors", visitorId);

  await setDoc(
    ref,
    {
      totalVisits: increment(1),
      lastVisit: serverTimestamp(),
      firstVisit: serverTimestamp()
    },
    { merge: true }
  );
}
