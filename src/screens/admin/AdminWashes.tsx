import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Alert, FlatList, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp, Wash, WASH_TYPES, STATUS_CONFIG } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'assigned', label: 'Asignado' },
  { key: 'in_progress', label: 'En Proceso' },
  { key: 'finished', label: 'Finalizado' },
];

const EMPTY_FORM = { plate: '', model: '', color: '', type: 'Completo', employeeId: '', price: '' };

export default function AdminWashes() {
  const { washes, users, addWash } = useApp();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const Chip = ({ label, active, onPress }: any) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const WashCard = ({ wash }: { wash: Wash }) => {
    const emp = users.find(u => u.id === wash.employeeId);
    return (
      <TouchableOpacity
        style={styles.card}
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
          ) : null}
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
        </View>
      </TouchableOpacity>
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTER_OPTIONS.map(f => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={w => w.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <WashCard wash={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyText}>Sin lavados</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Modal */}
      <Modal visible={modal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nuevo Lavado</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {([ ['plate', 'Placa', 'ABC-123'],
                  ['model', 'Modelo', 'Toyota Corolla'],
                  ['color', 'Color', 'Rojo'],
                  ['price', 'Precio ($)', '200'],
              ] as [string, string, string][]).map(([key, label, ph]) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={(form as any)[key]}
                    onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                    placeholder={ph}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize={key === 'plate' ? 'characters' : 'words'}
                    keyboardType={key === 'price' ? 'numeric' : 'default'}
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
  filters: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  list: { padding: 14, paddingTop: 0, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  plate: { fontWeight: '800', fontSize: 18, color: '#1F2937' },
  model: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  price: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  empText: { color: '#6B7280', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },

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
  saveBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
