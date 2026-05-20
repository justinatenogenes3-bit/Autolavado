import {
  collection, doc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { User, Wash } from "../context/AppContext";

// ══ USUARIOS ══════════════════════════════════════════════════════════════════
export async function fetchUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const q = query(
    collection(db, "users"),
    where("username", "==", username),
    where("password", "==", password)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as User;
}

export async function fetchUserByUsername(username: string): Promise<User | null> {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as User;
}

export async function addUserDB(userData: Omit<User, "id">): Promise<User> {
  const docRef = await addDoc(collection(db, "users"), userData);
  return { id: docRef.id, ...userData };
}

export async function updateUserDB(id: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, "users", id), updates as any);
}

export async function deleteUserDB(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", id));
}

// ══ LAVADOS ═══════════════════════════════════════════════════════════════════
export async function addWashDB(washData: Omit<Wash, "id" | "createdAt">): Promise<Wash> {
  const data = { ...washData, createdAt: new Date().toISOString() };
  const docRef = await addDoc(collection(db, "washes"), data);
  return { id: docRef.id, ...data };
}

export async function updateWashDB(id: string, updates: Partial<Wash>): Promise<void> {
  await updateDoc(doc(db, "washes", id), updates as any);
}

export async function deleteWashDB(id: string): Promise<void> {
  await deleteDoc(doc(db, "washes", id));
}

// ══ TIEMPO REAL — ya está en AppContext con onSnapshot, no se necesita aquí ══

// ══ EVIDENCIAS — Cloudinary (gratis, sin tarjeta, cualquier red) ══════════════
export async function uploadEvidence(
  washId: string,
  evidenceId: string,
  localUri: string
): Promise<string> {
  const CLOUD_NAME    = "dgpzoblez";
  const UPLOAD_PRESET = "Evidencias";

  // React Native no soporta fetch()->blob() con URIs locales
  // Se manda directamente como objeto { uri, type, name }
  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    type: "image/jpeg",
    name: `${washId}_${evidenceId}.jpg`,
  } as any);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "evidencias");

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Cloudinary error: ${err.error?.message || uploadRes.status}`);
  }

  const data = await uploadRes.json();
  return data.secure_url; // URL pública HTTPS, visible desde cualquier teléfono y red
}