import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import {
  verifyCredentials, fetchUserByUsername,
  addUserDB, updateUserDB, deleteUserDB,
  addWashDB, updateWashDB,
} from '../services/firebaseService';

export type Role = 'admin' | 'employee';
export type WashStatus = 'pending' | 'assigned' | 'in_progress' | 'finished' | 'cancelled';
export type EvidenceType =
  | 'frontal' | 'trasera' | 'conductor' | 'copiloto'
  | 'tablero' | 'asientos_delanteros' | 'asientos_traseros'
  | 'cajuela' | 'danos' | 'general';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  phone?: string;
  status?: 'active' | 'inactive';
  isOnline?: boolean;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  uri: string;
  timestamp: string;
}

export interface Wash {
  id: string;
  vehicle: { plate: string; model: string; color: string };
  type: string;
  price?: number;
  status: WashStatus;
  employeeId?: string | null;
  evidenceBefore: Evidence[];
  evidenceAfter: Evidence[];
  finalLocation?: string;
  observations?: string;
  createdAt: string;
  finishedAt?: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  washes: Wash[];
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginByBiometric: (username: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addWash: (wash: Omit<Wash, 'id' | 'createdAt'>) => Promise<void>;
  updateWash: (id: string, updates: Partial<Wash>) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers]             = useState<User[]>([]);
  const [washes, setWashes]           = useState<Wash[]>([]);
  const [loading, setLoading]         = useState(true);

  // ── Escucha en tiempo real de usuarios ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsers(data);
    }, e => console.error('Error usuarios:', e));
    return () => unsub();
  }, []);

  // ── Escucha en tiempo real de lavados ───────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'washes'), orderBy('createdAt', 'desc')),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Wash));
        setWashes(data);
        setLoading(false);
      },
      e => {
        console.error('Error lavados:', e);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string): Promise<boolean> => {
    const user = await verifyCredentials(username, password);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  const loginByBiometric = async (username: string): Promise<boolean> => {
    const user = await fetchUserByUsername(username);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  const logout = () => setCurrentUser(null);

  // ── Usuarios ────────────────────────────────────────────────────────────────
  const addUser = async (userData: Omit<User, 'id'>) => {
    await addUserDB(userData);
    // onSnapshot actualiza automáticamente
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    await updateUserDB(id, updates);
    setCurrentUser(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  };

  const deleteUser = async (id: string) => {
    await deleteUserDB(id);
  };

  // ── Lavados ─────────────────────────────────────────────────────────────────
  const addWash = async (washData: Omit<Wash, 'id' | 'createdAt'>) => {
    await addWashDB(washData);
    // onSnapshot actualiza automáticamente en todos los dispositivos
  };

  const updateWash = async (id: string, updates: Partial<Wash>) => {
    await updateWashDB(id, updates);
    // onSnapshot actualiza automáticamente en todos los dispositivos
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, washes, loading,
      login, loginByBiometric, logout,
      addUser, updateUser, deleteUser,
      addWash, updateWash,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const STATUS_CONFIG: Record<WashStatus, { label: string; bg: string; color: string; dot: string }> = {
  pending:     { label: 'Pendiente',  bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  assigned:    { label: 'Asignado',   bg: '#FEF9C3', color: '#92400E', dot: '#EAB308' },
  in_progress: { label: 'En Proceso', bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  finished:    { label: 'Finalizado', bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
  cancelled:   { label: 'Cancelado',  bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

export const EVIDENCE_TYPES: EvidenceType[] = [
  'frontal', 'trasera', 'conductor', 'copiloto',
  'tablero', 'asientos_delanteros', 'asientos_traseros', 'cajuela',
];

export const EVIDENCE_LABELS: Record<EvidenceType, string> = {
  frontal: 'Frontal', trasera: 'Trasera', conductor: 'Conductor',
  copiloto: 'Copiloto', tablero: 'Tablero',
  asientos_delanteros: 'Asientos Del.', asientos_traseros: 'Asientos Tras.',
  cajuela: 'Cajuela', danos: 'Daños', general: 'General',
};

export const WASH_TYPES = ['Completo', 'Express', 'Interiores', 'Básico'];
export const FINAL_LOCATIONS = ['Área de Secado', 'Zona de Entrega', 'Estacionamiento A', 'Estacionamiento B'];
