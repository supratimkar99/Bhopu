import {
  doc,
  runTransaction,
  serverTimestamp,
  increment
} from "firebase/firestore";

import { db } from "./firebase";
import { getVisitorId } from "./visitor";

export async function trackVisit() {
  try {
    const visitorId = getVisitorId();
    const ref = doc(db, "visitors", visitorId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);

      if (!snap.exists()) {
        tx.set(ref, {
          firstVisit: serverTimestamp(),
          lastVisit: serverTimestamp(),
          totalVisits: 1
        });
      } else {
        tx.set(
          ref,
          {
            lastVisit: serverTimestamp(),
            totalVisits: increment(1)
          },
          { merge: true }
        );
      }
    });
  } catch (error) {
    if (error.message.includes("crypto.randomUUID is not a function")) {
      return;
    }
    console.error("Error tracking visit:", error);
  }
}
