import admin from "firebase-admin";
import serviceAccount from "./ticketing-pro-firebase.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "ticketing-pro-a5a97.appspot.com",
});

export const bucket = admin.storage().bucket();