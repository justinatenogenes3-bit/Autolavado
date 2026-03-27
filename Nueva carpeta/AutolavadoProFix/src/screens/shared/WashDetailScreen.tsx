import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useApp, EVIDENCE_TYPES, EVIDENCE_LABELS, FINAL_LOCATIONS, EvidenceType } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';

export default function WashDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { washes, updateWash, currentUser, users } = useApp();
  const washId = route.params?.washId;
  const wash = washes.find(w => w.id === washId);

  const [finalLocation, setFinalLocation] = useState(wash?.finalLocation || '');
  const [observations, setObservations] = useState(wash?.observations || '');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [locVerified, setLocVerified] = useState(false);
  const [finishMode, setFinishMode] = useState(false);

  if (!wash || !currentUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563EB" size="large" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </View>
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isAssigned = wash.employeeId === currentUser.id;
  const canEdit = isAdmin || (isAssigned && wash.status !== 'finished' && wash.status !== 'cancelled');
  const emp = users.find(u => u.id === wash.employeeId);
  const update = (updates: any) => updateWash(wash.id, updates);

  const verifyLocation = () => {
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setLocVerified(true); }, 1500);
  };

  const startWash = () => {
    setLoading(true);
    setTimeout(() => { update({ status: 'in_progress' }); setLoading(false); }, 500);
  };

  const finishWash = () => {
    if (!finalLocation) {
      Alert.alert('Falta información', 'Selecciona la ubicación final del vehículo.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      update({ status: 'finished', finalLocation, observations, finishedAt: new Date().toISOString() });
      setLoading(false);
      setFinishMode(false);
      if (!isAdmin) navigation.goBack();
    }, 500);
  };

  const pickEvidence = async (section: 'before' | 'after', type: EvidenceType) => {
    if (!canEdit) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        const list = section === 'before' ? [...wash.evidenceBefore] : [...wash.evidenceAfter];
        const filtered = (type !== 'danos' && type !== 'general') ? list.filter(e => e.type !== type) : list;
        filtered.push({ id: Date.now().toString(), type, uri, timestamp: new Date().toISOString() });
        update(section === 'before' ? { evidenceBefore: filtered } : { evidenceAfter: filtered });
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const EvidenceGrid = ({ section }: { section: 'before' | 'after' }) => {
    const list = section === 'before' ? wash.evidenceBefore : wash.evidenceAfter;
    return (
      <View style={styles.evidenceGrid}>
        {EVIDENCE_TYPES.map(type => {
          const has = list.some(e => e.type === type);
          return (
            <TouchableOpacity
              key={type}
              style={[styles.evItem, has ? styles.evItemDone : styles.evItemEmpty]}
              onPress={() => pickEvidence(section, type)}
              activeOpacity={canEdit ? 0.7 : 1}
            >
              <Ionicons name={has ? 'checkmark-circle' : 'camera-outline'} size={22} color={has ? '#16A34A' : '#9CA3AF'} />
              <Text style={[styles.evLabel, has && styles.evLabelDone]}>{EVIDENCE_LABELS[type]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const SectionCard = ({ icon, iconColor, title, count, children }: any) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}><Text style={styles.countText}>{count}/{EVIDENCE_TYPES.length}</Text></View>
        )}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.vehicleCard}>
          <View style={styles.vehicleTop}>
            <View style={styles.vehicleIconWrap}>
              <Ionicons name="car" size={26} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehiclePlate}>{wash.vehicle.plate}</Text>
              <Text style={styles.vehicleModel}>{wash.vehicle.model}</Text>
              <Text style={styles.vehicleColor}>{wash.vehicle.color}</Text>
            </View>
            <StatusBadge status={wash.status} />
          </View>
          <View style={styles.vehicleMeta}>
            <View style={styles.metaItem}><Ionicons name="water-outline" size={13} color="#9CA3AF" /><Text style={styles.metaText}>{wash.type}</Text></View>
            {wash.price ? <View style={styles.metaItem}><Ionicons name="cash-outline" size={13} color="#9CA3AF" /><Text style={styles.metaText}>${wash.price}</Text></View> : null}
            {emp ? <View style={styles.metaItem}><Ionicons name="person-outline" size={13} color="#9CA3AF" /><Text style={styles.metaText}>{emp.name}</Text></View> : null}
          </View>
        </View>

        {!isAdmin && wash.status === 'assigned' && !locVerified && (
          <SectionCard icon="location-outline" iconColor="#2563EB" title="Verificar Ubicación">
            <Text style={styles.sectionDesc}>Debes estar en el autolavado para iniciar el servicio.</Text>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563EB' }]} onPress={verifyLocation} disabled={verifying} activeOpacity={0.85}>
              {verifying ? <ActivityIndicator color="#fff" /> : <View style={styles.btnRow}><Ionicons name="navigate" size={17} color="#fff" /><Text style={styles.actionBtnText}> Verificar Ubicación</Text></View>}
            </TouchableOpacity>
          </SectionCard>
        )}

        {(isAdmin || wash.status !== 'pending') && (
          <SectionCard icon="camera-outline" iconColor="#F97316" title="Evidencias Antes" count={wash.evidenceBefore.length}>
            <Text style={styles.sectionDesc}>{canEdit ? 'Toca cada casilla para tomar la foto.' : 'Registro de entrada.'}</Text>
            <EvidenceGrid section="before" />
          </SectionCard>
        )}

        {canEdit && wash.status === 'assigned' && (isAdmin || locVerified) && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563EB', marginBottom: 12 }]} onPress={startWash} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.btnRow}><Ionicons name="play-circle" size={18} color="#fff" /><Text style={styles.actionBtnText}> Iniciar Lavado</Text></View>}
          </TouchableOpacity>
        )}

        {(wash.status === 'in_progress' || wash.status === 'finished') && (
          <SectionCard icon="images-outline" iconColor="#16A34A" title="Evidencias Después" count={wash.evidenceAfter.length}>
            <Text style={styles.sectionDesc}>{canEdit && wash.status === 'in_progress' ? 'Registra el vehículo limpio.' : 'Registro del estado final.'}</Text>
            <EvidenceGrid section="after" />
          </SectionCard>
        )}

        {canEdit && wash.status === 'in_progress' && !finishMode && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16A34A', marginBottom: 12 }]} onPress={() => setFinishMode(true)} activeOpacity={0.85}>
            <View style={styles.btnRow}><Ionicons name="flag" size={18} color="#fff" /><Text style={styles.actionBtnText}> Finalizar Lavado</Text></View>
          </TouchableOpacity>
        )}

        {finishMode && (
          <SectionCard icon="flag-outline" iconColor="#16A34A" title="Cierre del Servicio">
            <Text style={styles.formLabel}>Ubicación Final</Text>
            <View style={styles.chipsWrap}>
              {FINAL_LOCATIONS.map(loc => (
                <TouchableOpacity key={loc} style={[styles.locChip, finalLocation === loc && styles.locChipActive]} onPress={() => setFinalLocation(loc)}>
                  <Text style={[styles.locChipText, finalLocation === loc && styles.locChipTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.formLabel, { marginTop: 14 }]}>Observaciones (opcional)</Text>
            <TextInput style={styles.textArea} multiline numberOfLines={3} placeholder="Notas, daños observados..." placeholderTextColor="#9CA3AF" value={observations} onChangeText={setObservations} textAlignVertical="top" />
            <View style={styles.finishButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFinishMode(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#16A34A' }]} onPress={finishWash} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Confirmar Cierre</Text>}
              </TouchableOpacity>
            </View>
          </SectionCard>
        )}

        {wash.status === 'finished' && (
          <SectionCard icon="checkmark-circle" iconColor="#16A34A" title="Resumen">
            {[['Ubicación final', wash.finalLocation || '—'], ['Observaciones', wash.observations || '—'], ['Finalizado', wash.finishedAt ? new Date(wash.finishedAt).toLocaleString('es-MX') : '—']].map(([l, v]) => (
              <View key={l} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{l}</Text>
                <Text style={styles.summaryValue}>{v}</Text>
              </View>
            ))}
          </SectionCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#9CA3AF', fontSize: 15, marginTop: 10 },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vehicleIconWrap: { width: 54, height: 54, borderRadius: 15, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  vehiclePlate: { fontWeight: '900', fontSize: 22, color: '#1F2937' },
  vehicleModel: { color: '#374151', fontWeight: '600', fontSize: 14, marginTop: 2 },
  vehicleColor: { color: '#9CA3AF', fontSize: 12 },
  vehicleMeta: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 2 },
  metaText: { color: '#6B7280', fontSize: 12, marginLeft: 4 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontWeight: '700', color: '#1F2937', fontSize: 15, flex: 1, marginLeft: 8 },
  countBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  sectionDesc: { color: '#6B7280', fontSize: 13, marginBottom: 12 },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  evItem: { width: '23%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, margin: '1%' },
  evItemEmpty: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  evItemDone: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  evLabel: { color: '#9CA3AF', fontSize: 8, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  evLabelDone: { color: '#16A34A' },
  actionBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  locChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, margin: 3, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  locChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  locChipText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  locChipTextActive: { color: '#fff' },
  textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1F2937', minHeight: 80 },
  finishButtons: { flexDirection: 'row', marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  summaryLabel: { color: '#9CA3AF', fontSize: 13 },
  summaryValue: { color: '#1F2937', fontWeight: '600', fontSize: 13, flex: 1, textAlign: 'right', marginLeft: 16 },
});
