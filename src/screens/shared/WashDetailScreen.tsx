import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useApp, EVIDENCE_TYPES, EVIDENCE_LABELS, FINAL_LOCATIONS, EvidenceType } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';
import { uploadEvidence } from '../../services/firebaseService';

const WASH_CENTER = { latitude: 19.3435, longitude: -99.7406 };
const MAX_DISTANCE_METERS = 200;

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function WashDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { washes, updateWash, currentUser, users } = useApp();
  const washId = route.params?.washId;
  const wash = washes.find(w => w.id === washId);

  const [finalLocation, setFinalLocation] = useState(wash?.finalLocation || '');
  const [observations, setObservations]   = useState(wash?.observations || '');
  const [loading, setLoading]             = useState(false);
  const [verifying, setVerifying]         = useState(false);
  const [locVerified, setLocVerified]     = useState(false);
  const [finishMode, setFinishMode]       = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto]   = useState<{ uri: string; section: 'before' | 'after'; type: EvidenceType } | null>(null);

  if (!wash || !currentUser) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563EB" size="large" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </View>
    );
  }

  const isAdmin    = currentUser.role === 'admin';
  const isAssigned = wash.employeeId === currentUser.id;
  const canEdit    = isAdmin || (isAssigned && wash.status !== 'finished' && wash.status !== 'cancelled');
  const emp        = users.find(u => u.id === wash.employeeId);
  const update     = (updates: any) => updateWash(wash.id, updates);

  const verifyLocation = async () => {
    try {
      setVerifying(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceder a tu ubicación.'); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const distance = getDistanceMeters(location.coords.latitude, location.coords.longitude, WASH_CENTER.latitude, WASH_CENTER.longitude);
      if (distance <= MAX_DISTANCE_METERS) {
        setLocVerified(true);
        Alert.alert('Ubicación verificada ✓', 'Estás dentro del autolavado.');
      } else {
        const distStr = distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
        Alert.alert('Ubicación incorrecta', `Estás a ${distStr} del autolavado. Debes estar a menos de ${MAX_DISTANCE_METERS} m.`);
      }
    } catch { Alert.alert('Error', 'No se pudo verificar la ubicación. Activa el GPS.'); }
    finally { setVerifying(false); }
  };

  const startWash = () => {
    setLoading(true);
    setTimeout(() => { update({ status: 'in_progress' }); setLoading(false); }, 500);
  };

  const finishWash = () => {
    if (!finalLocation) { Alert.alert('Falta información', 'Selecciona la ubicación final del vehículo.'); return; }
    setLoading(true);
    setTimeout(() => {
      update({ status: 'finished', finalLocation, observations, finishedAt: new Date().toISOString() });
      setLoading(false);
      setFinishMode(false);
      if (!isAdmin) navigation.goBack();
    }, 500);
  };

  // ── Tomar foto y subir a Firebase Storage ───────────────────────────────────
  const pickEvidence = async (section: 'before' | 'after', type: EvidenceType) => {
    if (!canEdit) return;

    if (!isAdmin && section === 'before' && wash.status === 'in_progress') {
      Alert.alert('Lavado iniciado', 'Ya no puedes modificar las fotos de antes del lavado.');
      return;
    }

    if (!isAdmin && !locVerified) {
      Alert.alert('Ubicación no verificada', 'Debes verificar tu ubicación antes de tomar evidencias.');
      return;
    }

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara.'); return; }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        const localUri = result.assets[0].uri;
        const evidenceId = Date.now().toString();

        // ✅ Subir foto a Firebase Storage para que el admin pueda verla
        setUploadingPhoto(true);
        let finalUri = localUri;
        try {
          finalUri = await uploadEvidence(wash.id, evidenceId, localUri);
        } catch (e) {
          console.error('Error subiendo foto:', e);
          // Si falla la subida, usar URI local como fallback
          finalUri = localUri;
        } finally {
          setUploadingPhoto(false);
        }

        const list = section === 'before' ? [...wash.evidenceBefore] : [...wash.evidenceAfter];
        const filtered = (type !== 'danos' && type !== 'general') ? list.filter(e => e.type !== type) : list;
        filtered.push({ id: evidenceId, type, uri: finalUri, timestamp: new Date().toISOString() });
        update(section === 'before' ? { evidenceBefore: filtered } : { evidenceAfter: filtered });

        // Mostrar previsualización con la URL de Storage
        setPreviewPhoto({ uri: finalUri, section, type });
      }
    } catch { Alert.alert('Error', 'No se pudo abrir la cámara.'); }
  };

  const retakePhoto = async () => {
    if (!previewPhoto) return;
    setPreviewPhoto(null);
    await pickEvidence(previewPhoto.section, previewPhoto.type);
  };

  const EvidenceGrid = ({ section }: { section: 'before' | 'after' }) => {
    const list = section === 'before' ? wash.evidenceBefore : wash.evidenceAfter;
    const isSectionLocked = !isAdmin && section === 'before' && wash.status === 'in_progress';

    return (
      <View style={styles.evidenceGrid}>
        {EVIDENCE_TYPES.map(type => {
          const evidence = list.find(e => e.type === type);
          const has = !!evidence;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.evItem,
                has ? styles.evItemDone : styles.evItemEmpty,
                isSectionLocked && styles.evItemLocked,
              ]}
              onPress={() => {
                if (has && evidence) {
                  setPreviewPhoto({ uri: evidence.uri, section, type });
                } else {
                  pickEvidence(section, type);
                }
              }}
              activeOpacity={canEdit ? 0.7 : 1}
            >
              {has && evidence ? (
                <Image
                  source={{ uri: evidence.uri }}
                  style={styles.evThumb}
                  onError={() => {}}
                />
              ) : (
                <Ionicons
                  name={isSectionLocked ? 'lock-closed-outline' : 'camera-outline'}
                  size={22}
                  color={isSectionLocked ? '#D1D5DB' : '#9CA3AF'}
                />
              )}
              <Text style={[styles.evLabel, has && styles.evLabelDone, isSectionLocked && styles.evLabelLocked]}>
                {EVIDENCE_LABELS[type]}
              </Text>
              {has && !isSectionLocked && (
                <View style={styles.evDoneCheck}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                </View>
              )}
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

      {/* ✅ Overlay mientras sube la foto */}
      {uploadingPhoto && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadBox}>
            <ActivityIndicator color="#2563EB" size="large" />
            <Text style={styles.uploadText}>Subiendo foto…</Text>
          </View>
        </View>
      )}

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
            <Text style={styles.sectionDesc}>Debes estar en el autolavado (radio {MAX_DISTANCE_METERS} m) para iniciar.</Text>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: verifying ? '#93C5FD' : '#2563EB' }]} onPress={verifyLocation} disabled={verifying} activeOpacity={0.85}>
              {verifying
                ? <View style={styles.btnRow}><ActivityIndicator color="#fff" size="small" /><Text style={[styles.actionBtnText, { marginLeft: 8 }]}>Obteniendo GPS…</Text></View>
                : <View style={styles.btnRow}><Ionicons name="navigate" size={17} color="#fff" /><Text style={styles.actionBtnText}> Verificar Ubicación</Text></View>
              }
            </TouchableOpacity>
          </SectionCard>
        )}

        {!isAdmin && locVerified && wash.status === 'assigned' && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            <Text style={styles.successText}>Ubicación verificada correctamente ✓</Text>
          </View>
        )}

        {(isAdmin || wash.status !== 'pending') && (
          <SectionCard icon="camera-outline" iconColor="#F97316" title="Evidencias Antes" count={wash.evidenceBefore.length}>
            {!isAdmin && wash.status === 'in_progress' ? (
              <View style={styles.lockedBanner}>
                <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                <Text style={styles.lockedBannerText}>Fotos bloqueadas — lavado ya iniciado</Text>
              </View>
            ) : (
              <Text style={styles.sectionDesc}>
                {canEdit ? 'Toca para tomar la foto. Toca la foto para verla o retomar.' : 'Registro de entrada.'}
              </Text>
            )}
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
            <Text style={styles.sectionDesc}>
              {canEdit && wash.status === 'in_progress' ? 'Toca para tomar la foto del vehículo limpio.' : 'Registro del estado final.'}
            </Text>
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

      {/* Modal previsualización */}
      <Modal visible={!!previewPhoto} transparent animationType="fade" onRequestClose={() => setPreviewPhoto(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {previewPhoto ? EVIDENCE_LABELS[previewPhoto.type] : ''} — {previewPhoto?.section === 'before' ? 'Antes' : 'Después'}
              </Text>
              <TouchableOpacity onPress={() => setPreviewPhoto(null)}>
                <Ionicons name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {previewPhoto && (
              <Image source={{ uri: previewPhoto.uri }} style={styles.modalImage} resizeMode="contain" />
            )}
            <View style={styles.modalActions}>
              {canEdit && !(previewPhoto?.section === 'before' && wash.status === 'in_progress' && !isAdmin) && (
                <TouchableOpacity style={styles.retakeBtn} onPress={retakePhoto}>
                  <Ionicons name="camera" size={18} color="#2563EB" />
                  <Text style={styles.retakeBtnText}>Retomar foto</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setPreviewPhoto(null)}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#9CA3AF', fontSize: 15, marginTop: 10 },

  uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, alignItems: 'center', justifyContent: 'center' },
  uploadBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 12 },
  uploadText: { color: '#1F2937', fontWeight: '600', fontSize: 15 },

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
  evItem: { width: '23%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, margin: '1%', overflow: 'hidden', position: 'relative' },
  evItemEmpty: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  evItemDone: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  evItemLocked: { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6', opacity: 0.6 },
  evThumb: { width: '100%', height: '100%', borderRadius: 10 },
  evLabel: { color: '#9CA3AF', fontSize: 8, fontWeight: '600', textAlign: 'center', marginTop: 3, position: 'absolute', bottom: 3 },
  evLabelDone: { color: '#16A34A' },
  evLabelLocked: { color: '#D1D5DB' },
  evDoneCheck: { position: 'absolute', top: 3, right: 3 },

  lockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  lockedBannerText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },

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

  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#86EFAC' },
  successText: { color: '#16A34A', fontWeight: '600', fontSize: 13, marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: '85%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontWeight: '700', fontSize: 15, color: '#1F2937', flex: 1 },
  modalImage: { width: '100%', height: 340, backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', padding: 16, gap: 10 },
  retakeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 12, paddingVertical: 12 },
  retakeBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },
  closeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 12 },
  closeBtnText: { color: '#6B7280', fontWeight: '700', fontSize: 15 },
});
