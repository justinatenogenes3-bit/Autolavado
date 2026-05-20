import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, FlatList, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp, Wash, WASH_TYPES } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';

const FILTER_OPTIONS = [
  { key: 'all',         label: 'Todos' },
  { key: 'pending',     label: 'Pendiente' },
  { key: 'assigned',    label: 'Asignado' },
  { key: 'in_progress', label: 'En Proceso' },
  { key: 'finished',    label: 'Finalizado' },
];

const EMPTY_FORM = { plate: '', model: '', color: '', type: 'Completo', employeeId: '', price: '' };

// ── Chip fuera del componente para evitar remounts ───────────────────────────
const Chip = ({ label, active, onPress }: any) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ── WashCard fuera del componente para evitar remounts ───────────────────────
const WashCard = ({ wash, users, navigation, onAssign, onDelete }: any) => {
  const emp = users.find((u: any) => u.id === wash.employeeId);
  const canAssign = ['pending', 'assigned', 'in_progress'].includes(wash.status);
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardMain}
        onPress={() => navigation.navigate('WashDetail', { washId: wash.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.plate}>{wash.vehicle.plate}</Text>
            <Text style={styles.model}>{wash.vehicle.model} · {wash.vehicle.color}</Text>
          </View>
          <StatusBadge status={wash.status} />
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.typeTag}><Text style={styles.typeText}>{wash.type}</Text></View>
          {wash.price ? <Text style={styles.price}>${wash.price}</Text> : null}
          {emp ? (
            <View style={styles.empRow}>
              <Ionicons name="person-outline" size={12} color="#6B7280" />
              <Text style={styles.empText}>{emp.name.split(' ')[0]}</Text>
            </View>
          ) : (
            <View style={styles.empRow}>
              <Ionicons name="person-outline" size={12} color="#F97316" />
              <Text style={[styles.empText, { color: '#F97316' }]}>Sin asignar</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.cardActions}>
        {canAssign && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onAssign(wash)} activeOpacity={0.8}>
            <Ionicons name="person-add-outline" size={15} color="#2563EB" />
            <Text style={styles.actionBtnText}>
              {!wash.employeeId || wash.status === 'pending' ? 'Asignar' : 'Reasignar'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger, !canAssign && { flex: 1 }]}
          onPress={() => onDelete(wash)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={15} color="#EF4444" />
          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function AdminWashes() {
  const { washes, users, addWash, updateWash, deleteWash } = useApp();
  const navigation = useNavigation<any>();

  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState('all');
  const [modal,        setModal]        = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [assignModal,  setAssignModal]  = useState(false);
  const [selectedWash, setSelectedWash] = useState<Wash | null>(null);
  const [assignEmpId,  setAssignEmpId]  = useState('');

  const employees = users.filter(u => u.role === 'employee' && u.status === 'active');

  const filtered = washes.filter(w => {
    const matchSearch =
      w.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      w.vehicle.model.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || w.status === filter;
    return matchSearch && matchFilter;
  });

  const handleCreate = () => {
    if (!form.plate.trim() || !form.model.trim()) {
      Alert.alert('Error', 'Placa y modelo son obligatorios');
      return;
    }
    const defaultPrice = form.type === 'Completo' ? 200 : form.type === 'Express' ? 100 : 150;
    addWash({
      vehicle: { plate: form.plate.toUpperCase().trim(), model: form.model.trim(), color: form.color.trim() || 'N/A' },
      type: form.type,
      price: Number(form.price) || defaultPrice,
      status: form.employeeId ? 'assigned' : 'pending',
      employeeId: form.employeeId || null,
      evidenceBefore: [],
      evidenceAfter: [],
    });
    setModal(false);
    setForm(EMPTY_FORM);
  };

  const openAssignModal = (wash: Wash) => {
    setSelectedWash(wash);
    setAssignEmpId(wash.employeeId || '');
    setAssignModal(true);
  };

  const handleAssign = () => {
    if (!selectedWash) return;
    if (!assignEmpId) {
      Alert.alert('Selecciona un empleado', 'Debes elegir a quién asignar este lavado.');
      return;
    }
    const newStatus = selectedWash.status === 'pending' ? 'assigned' : selectedWash.status;
    updateWash(selectedWash.id, { employeeId: assignEmpId, status: newStatus });
    setAssignModal(false);
    setSelectedWash(null);
  };

  const handleDelete = (wash: Wash) => {
    Alert.alert(
      'Eliminar lavado',
      `¿Eliminar el lavado del vehículo ${wash.vehicle.plate}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteWash(wash.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Search + Add */}
      <View style={styles.topbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar placa o modelo..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTER_OPTIONS.map(f => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={w => w.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <WashCard
            wash={item}
            users={users}
            navigation={navigation}
            onAssign={openAssignModal}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyText}>Sin lavados</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* ── Modal Crear Lavado ── */}
      <Modal visible={modal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setModal(false)} />
          {/* FIX teclado: KeyboardAvoidingView dentro del modal */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Nuevo Lavado</Text>
                <TouchableOpacity onPress={() => setModal(false)}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {([
                  ['plate', 'Placa',        'ABC-123',        'characters', 'default'],
                  ['model', 'Modelo',       'Toyota Corolla', 'words',      'default'],
                  ['color', 'Color',        'Rojo',           'words',      'default'],
                  ['price', 'Precio ($)',   '200',            'none',       'numeric'],
                ] as [string, string, string, any, any][]).map(([key, label, ph, autoCapitalize, keyboardType]) => (
                  <View key={key} style={styles.formGroup}>
                    <Text style={styles.formLabel}>{label}</Text>
                    <TextInput
                      style={styles.formInput}
                      value={(form as any)[key]}
                      onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                      placeholder={ph}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize={autoCapitalize}
                      keyboardType={keyboardType}
                    />
                  </View>
                ))}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tipo de Servicio</Text>
                  <View style={styles.chipRow}>
                    {WASH_TYPES.map(t => (
                      <Chip key={t} label={t} active={form.type === t} onPress={() => setForm(f => ({ ...f, type: t }))} />
                    ))}
                  </View>
                </View>
                <View style={[styles.formGroup, { marginBottom: 0 }]}>
                  <Text style={styles.formLabel}>Asignar a Empleado (opcional)</Text>
                  <View style={styles.chipRow}>
                    <Chip label="Sin asignar" active={!form.employeeId} onPress={() => setForm(f => ({ ...f, employeeId: '' }))} />
                    {employees.map(e => (
                      <Chip key={e.id} label={e.name.split(' ')[0]} active={form.employeeId === e.id} onPress={() => setForm(f => ({ ...f, employeeId: e.id }))} />
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>Crear Lavado</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal Asignar / Reasignar ── */}
      <Modal visible={assignModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setAssignModal(false)} />
          <View style={[styles.sheet, { maxHeight: '65%' }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {!selectedWash?.employeeId || selectedWash?.status === 'pending' ? 'Asignar empleado' : 'Reasignar empleado'}
                </Text>
                <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                  {selectedWash?.vehicle.plate} · {selectedWash?.vehicle.model}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedWash?.status === 'in_progress' && (
              <View style={styles.warnBox}>
                <Ionicons name="warning-outline" size={16} color="#92400E" />
                <Text style={styles.warnText}>Este lavado está en proceso. El nuevo empleado podrá continuarlo desde donde quedó.</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {employees.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.empOption, assignEmpId === e.id && styles.empOptionActive]}
                  onPress={() => setAssignEmpId(e.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.empAvatar}>
                    <Text style={styles.empAvatarText}>{e.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.empName}>{e.name}</Text>
                    <Text style={styles.empSub}>Empleado activo</Text>
                  </View>
                  {assignEmpId === e.id && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                </TouchableOpacity>
              ))}
              {employees.length === 0 && (
                <Text style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>No hay empleados activos</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAssign} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Confirmar asignación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  topbar: { flexDirection: 'row', padding: 14, gap: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  filters: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  list: { padding: 14, paddingTop: 0, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  cardMain: { padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  plate: { fontWeight: '800', fontSize: 18, color: '#1F2937' },
  model: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  price: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  empText: { color: '#6B7280', fontSize: 12 },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  actionBtnDanger: { borderRightWidth: 0 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  formInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF9C3', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  warnText: { flex: 1, fontSize: 12, color: '#92400E', fontWeight: '500' },
  empOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB' },
  empOptionActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  empAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  empAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  empName: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
  empSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
