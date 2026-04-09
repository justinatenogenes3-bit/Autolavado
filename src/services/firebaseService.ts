import {
  collection, doc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { User, Wash } from "../context/AppContext";

// ─── SERVIDOR LOCAL ───────────────────────────────────────────────────────────
const SERVER_IP  = "10.0.35.236";
const SERVER_URL = `http://${SERVER_IP}:3001`;

// ══════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
}

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
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

// ══════════════════════════════════════════════════════════════════════════════
// LAVADOS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchWashes(): Promise<Wash[]> {
  const snap = await getDocs(collection(db, "washes"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Wash));
}

export async function addWashDB(washData: Omit<Wash, "id" | "createdAt">): Promise<Wash> {
  const data = { ...washData, createdAt: new Date().toISOString() };
  const docRef = await addDoc(collection(db, "washes"), data);
  return { id: docRef.id, ...data };
}

export async function updateWashDB(id: string, updates: Partial<Wash>): Promise<void> {
  await updateDoc(doc(db, "washes", id), updates as any);
}

// ══════════════════════════════════════════════════════════════════════════════
// EVIDENCIAS — Servidor Express local
// ══════════════════════════════════════════════════════════════════════════════

export async function uploadEvidence(
  washId: string,
  evidenceId: string,
  localUri: string
): Promise<string> {
  const formData = new FormData();
  formData.append('photo', {
    uri:  localUri,
    name: `${evidenceId}.jpg`,
    type: 'image/jpeg',
  } as any);

  const uploadRes = await fetch(`${SERVER_URL}/upload`, {
    method:  'POST',
    body:    formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!uploadRes.ok) throw new Error(`Error del servidor: ${uploadRes.status}`);

  const data = await uploadRes.json();
  return data.url;
}