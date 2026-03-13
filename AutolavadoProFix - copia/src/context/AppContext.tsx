import React, { createContext, useContext, useState, ReactNode } from 'react';

// ─── TYPES ───────────────────────────────────────────────────────────────────
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
  login: (username: string, password: string) => boolean;
  logout: () => void;
  checkCredentials: (username: string, password: string) => User | null; // ← NUEVO
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addWash: (wash: Omit<Wash, 'id' | 'createdAt'>) => void;
  updateWash: (id: string, updates: Partial<Wash>) => void;
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin User',  username: 'admin', password: '123', role: 'admin',    phone: '555-0001', status: 'active',   isOnline: true  },
  { id: '2', name: 'Juan Pérez',  username: 'juan',  password: '123', role: 'employee', phone: '555-0002', status: 'active',   isOnline: true  },
  { id: '3', name: 'Maria Lopez', username: 'maria', password: '123', role: 'employee', phone: '555-0003', status: 'inactive', isOnline: false },
];

const now = new Date();
const yesterday = new Date(now.getTime() - 86400000);

const INITIAL_WASHES: Wash[] = [
  {
    id: 'w1',
    vehicle: { plate: 'ABC-123', model: 'Toyota Corolla', color: 'Rojo' },
    type: 'Completo', price: 200,
    status: 'finished', employeeId: '2',
    evidenceBefore: [], evidenceAfter: [],
    finalLocation: 'Zona de Entrega', observations: 'Sin novedades',
    createdAt: yesterday.toISOString(),
    finishedAt: new Date(yesterday.getTime() + 5400000).toISOString(),
  },
  {
    id: 'w2',
    vehicle: { plate: 'XYZ-987', model: 'Honda Civic', color: 'Negro' },
    type: 'Express', price: 100,
    status: 'in_progress', employeeId: '2',
    evidenceBefore: [
      { id: 'e1', type: 'frontal', uri: '', timestamp: now.toISOString() },
      { id: 'e2', type: 'trasera', uri: '', timestamp: now.toISOString() },
    ],
    evidenceAfter: [],
    createdAt: now.toISOString(),
  },
  {
    id: 'w3',
    vehicle: { plate: 'LMN-456', model: 'Mazda 3', color: 'Blanco' },
    type: 'Interiores', price: 150,
    status: 'assigned', employeeId: '2',
    evidenceBefore: [], evidenceAfter: [],
    createdAt: now.toISOString(),
  },
  {
    id: 'w4',
    vehicle: { plate: 'DEF-321', model: 'VW Jetta', color: 'Azul' },
    type: 'Completo', price: 200,
    status: 'pending', employeeId: null,
    evidenceBefore: [], evidenceAfter: [],
    createdAt: now.toISOString(),
  },
  {
    id: 'w5',
    vehicle: { plate: 'GHI-654', model: 'Nissan Sentra', color: 'Gris' },
    type: 'Express', price: 100,
    status: 'finished', employeeId: '3',
    evidenceBefore: [], evidenceAfter: [],
    finalLocation: 'Estacionamiento A',
    createdAt: yesterday.toISOString(),
    finishedAt: new Date(yesterday.getTime() + 3600000).toISOString(),
  },
];

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [washes, setWashes] = useState<Wash[]>(INITIAL_WASHES);

  // Verifica credenciales y hace login
  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };

  // Solo verifica credenciales SIN hacer login (para el flujo de admin + Face ID)
  const checkCredentials = (username: string, password: string): User | null => {
    return users.find(u => u.username === username && u.password === password) ?? null;
  };

  const logout = () => setCurrentUser(null);

  const addUser = (userData: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...userData, id: Date.now().toString() }]);
  };
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    setCurrentUser(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  };
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const addWash = (washData: Omit<Wash, 'id' | 'createdAt'>) => {
    setWashes(prev => [{
      ...washData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };
  const updateWash = (id: string, updates: Partial<Wash>) => {
    setWashes(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, washes,
      login, logout, checkCredentials,
      addUser, updateUser, deleteUser, addWash, updateWash,
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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
