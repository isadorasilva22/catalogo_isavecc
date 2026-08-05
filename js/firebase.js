import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-storage.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyAceWz2cFygJCMWtq64NfAyir4WzTplFQM",

    authDomain: "inventarioisavecc.firebaseapp.com",

    projectId: "inventarioisavecc",

    storageBucket: "inventarioisavecc.firebasestorage.app",

    messagingSenderId: "236832458553",

    appId: "1:236832458553:web:c49608e349bc3a32d3cae8"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const storage = getStorage(app);

export const auth = getAuth(app);