import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
export const firebaseConfig={apiKey:"AIzaSyDyk2jDbgajwK0p-dzMZdOmaE9a2Bqhtfw",authDomain:"family-chores-app-ac61d.firebaseapp.com",projectId:"family-chores-app-ac61d",storageBucket:"family-chores-app-ac61d.firebasestorage.app",messagingSenderId:"314298253654",appId:"1:314298253654:web:8cf99633017ee94d54d6f7",measurementId:"G-VV4PWYXVNZ"};
export const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);export const auth=getAuth(app);export const db=getFirestore(app);analyticsIsSupported().then(s=>{if(s)getAnalytics(app)}).catch(()=>{});
