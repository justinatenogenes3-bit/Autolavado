import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, User } from '../../context/AppContext';

const EMPTY = { name: '', username: '', password: '123', phone: '', role: 'employee' as 'admin' | 'employee', status: 'active' as 'active' | 'inactive' };

export default function AdminEmployees() {
  const { users, addUser, updateUser, deleteUser } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, username: u.username, password: u.password || '', phone: u.phone || '', role: u.role, status: u.status || 'active' });
    setModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.username.trim()) {
      Alert.alert('Error', 'Nombre y usuario son obligatorios');
      return;
    }
    if (editing) {
      updateUser(editing.id, form);
    } else {
      addUser({ ...form, isOnline: false });
    }
    setModal(false);
  };

  const handleDelete = (u: User) => {
    Alert.alert('Eliminar empleado', `¿Seguro que deseas eliminar a ${u.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteUser(u.id) },
    ]);
  };

  const Chip = ({ label, active, onPress }: any) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const UserCard = ({ user }: { user: User }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: user.role === 'admin' ? '#EFF6FF' : '#F0FDF4' }]}>
          <Ionicons
            name={user.role === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
            size={22}
            color={user.role === 'admin' ? '#2563EB' : '#16A34A'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            <View style={[styles.statusDot, { backgroundColor: user.status === 'active' ? '#22C55E' : '#EF4444' }]} />
          </View>
          <Text style={styles.username}>@{user.username}</Text>
          {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? '#DBEAFE' : '#DCFCE7' }]}>
          <Text style={[styles.roleText, { color: user.role === 'admin' ? '#1D4ED8' : '#166534' }]}>
            {user.role === 'admin' ? 'Admin' : 'Empleado'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(user)}>
            <Ionicons name="create-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(user)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar empleado..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <UserCard user={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>Sin resultados</Text>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={modal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editing ? 'Editar Empleado' : 'Nuevo Empleado'}</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {([ ['name', 'Nombre Completo', 'Juan Pérez', false],
                  ['username', 'Usuario', 'juan', false],
                  ['password', 'Contraseña', '••••••', true],
                  ['phone', 'Teléfono (opcional)', '555-0000', false],
              ] as [string, string, string, boolean][]).map(([key, label, ph, secure]) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={(form as any)[key]}
                    onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                    placeholder={ph}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={secure}
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rol</Text>
                <View style={styles.chipRow}>
                  <Chip label="Empleado" active={form.role === 'employee'} onPress={() => setForm(f => ({ ...f, role: 'employee' }))} />
                  <Chip label="Administrador" active={form.role === 'admin'} onPress={() => setForm(f => ({ ...f, role: 'admin' }))} />
                </View>
              </View>

              <View style={[styles.formGroup, { marginBottom: 0 }]}>
                <Text style={styles.formLabel}>Estado</Text>
                <View style={styles.chipRow}>
                  <Chip label="Activo" active={form.status === 'active'} onPress={() => setForm(f => ({ ...f, status: 'active' }))} />
                  <Chip label="Inactivo" active={form.status === 'inactive'} onPress={() => setForm(f => ({ ...f, status: 'inactive' }))} />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  topbar: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'center' },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  addBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  list: { padding: 14, paddingTop: 0, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  username: { color: '#6B7280', fontSize: 12, marginTop: 1 },
  phone: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  editBtn: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 6 },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 6 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '88%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  formInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1F2937',
  },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
