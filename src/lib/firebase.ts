import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
export const firebaseConfig={apiKey:"AIzaSyDJgCpZplSVCy1Vkjitd2VznDYZS9j42Qc",authDomain:"global-2a5f8.firebaseapp.com",projectId:"global-2a5f8",storageBucket:"global-2a5f8.firebasestorage.app",messagingSenderId:"531618530817",appId:"1:531618530817:web:cb67e1407510505e9fa200",measurementId:"G-B4EF8L602T"};
export const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);export const auth=getAuth(app);export const db=getFirestore(app);analyticsIsSupported().then(s=>{if(s)getAnalytics(app)}).catch(()=>{});
