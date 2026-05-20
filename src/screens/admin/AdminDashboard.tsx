import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';

export default function AdminDashboard() {
  const { washes, currentUser } = useApp();
  const navigation = useNavigation<any>();

  const [locationModal, setLocationModal] = useState(false);
  const [detectingLoc, setDetectingLoc]   = useState(false);
  const [savedLocation, setSavedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // ── Escuchar la ubicación guardada en Firestore en tiempo real ─────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'washCenter'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSavedLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    });
    return () => unsub();
  }, []);

  // ── Detectar ubicación y guardarla en Firestore ────────────────────────────
  const handleDetectLocation = async () => {
    try {
      setDetectingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la ubicación para guardar la posición del autolavado.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      // Guardar en Firestore — todos los dispositivos lo verán al instante
      await setDoc(doc(db, 'config', 'washCenter'), coords);
      setLocationModal(false);
      Alert.alert('Ubicación guardada ✓', 'Todos los empleados verificarán su presencia en un radio de 200 metros de esta ubicación.');
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación. Asegúrate de tener el GPS activado.');
    } finally {
      setDetectingLoc(false);
    }
  };

  const counts = {
    pending:     washes.filter(w => w.status === 'pending').length,
    assigned:    washes.filter(w => w.status === 'assigned').length,
    in_progress: washes.filter(w => w.status === 'in_progress').length,
    finished:    washes.filter(w => w.status === 'finished').length,
  };

  const StatCard = ({ label, count, icon, color, onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statCount}>{count}</Text>
      </View>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
    </TouchableOpacity>
  );

  const QuickLink = ({ icon, label, onPress, iconBg, iconColor }: any) => (
    <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickIcon, { backgroundColor: iconBg || '#EFF6FF' }]}>
        <Ionicons name={icon} size={22} color={iconColor || '#2563EB'} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola, {currentUser?.name.split(' ')[0]} 👋</Text>
            <Text style={styles.headerSub}>Panel de Administración</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Banner ubicación */}
        <TouchableOpacity
          style={[styles.locationBanner, savedLocation && styles.locationBannerOk]}
          onPress={() => setLocationModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={savedLocation ? 'location' : 'location-outline'}
            size={20}
            color={savedLocation ? '#16A34A' : '#F97316'}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.locationTitle, savedLocation && { color: '#16A34A' }]}>
              {savedLocation ? 'Ubicación del autolavado configurada ✓' : 'Configura la ubicación del autolavado'}
            </Text>
            <Text style={styles.locationSub}>
              {savedLocation
                ? `Lat: ${savedLocation.latitude.toFixed(5)}, Lng: ${savedLocation.longitude.toFixed(5)}`
                : 'Necesaria para que los empleados verifiquen su presencia'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Pendientes"  count={counts.pending}     icon="alert-circle-outline"     color="#F97316" onPress={() => navigation.navigate('Washes')} />
          <StatCard label="Asignados"   count={counts.assigned}    icon="person-outline"            color="#EAB308" onPress={() => navigation.navigate('Washes')} />
          <StatCard label="En Proceso"  count={counts.in_progress} icon="play-circle-outline"       color="#2563EB" onPress={() => navigation.navigate('Washes')} />
          <StatCard label="Finalizados" count={counts.finished}    icon="checkmark-circle-outline"  color="#16A34A" onPress={() => navigation.navigate('History')} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickGrid}>
          <QuickLink icon="people-outline" label="Empleados" onPress={() => navigation.navigate('Employees')} />
          <QuickLink icon="car-outline"    label="Lavados"   onPress={() => navigation.navigate('Washes')} />
          <QuickLink icon="time-outline"   label="Historial" onPress={() => navigation.navigate('History')} />
          <QuickLink
            icon="location"
            label="Ubicación"
            iconBg={savedLocation ? '#DCFCE7' : '#FFF7ED'}
            iconColor={savedLocation ? '#16A34A' : '#F97316'}
            onPress={() => setLocationModal(true)}
          />
        </View>

        {/* Recent */}
        <Text style={styles.sectionTitle}>Lavados Recientes</Text>
        <View style={styles.recentCard}>
          {washes.slice(0, 5).map((wash, i) => (
            <TouchableOpacity
              key={wash.id}
              style={[styles.recentRow, i > 0 && styles.recentBorder]}
              onPress={() => navigation.navigate('WashDetail', { washId: wash.id })}
              activeOpacity={0.7}
            >
              <View style={styles.recentLeft}>
                <View style={styles.plateIcon}>
                  <Ionicons name="car-outline" size={18} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.plate}>{wash.vehicle.plate}</Text>
                  <Text style={styles.model}>{wash.vehicle.model} · {wash.vehicle.color}</Text>
                </View>
              </View>
              <View style={styles.recentRight}>
                <StatusBadge status={wash.status} />
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
          {washes.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Sin lavados registrados</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Modal ubicación */}
      <Modal visible={locationModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setLocationModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Ubicación del Autolavado</Text>
                <Text style={styles.sheetSub}>Se guardará en la nube y todos los empleados la usarán automáticamente</Text>
              </View>
              <TouchableOpacity onPress={() => setLocationModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {savedLocation && (
              <View style={styles.coordBox}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.coordTitle}>Ubicación actual guardada en la nube</Text>
                  <Text style={styles.coordSub}>
                    Lat: {savedLocation.latitude.toFixed(6)}{'\n'}Lng: {savedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#1E40AF" />
              <Text style={styles.infoText}>
                Presiona el botón estando físicamente en tu autolavado. El GPS detectará las coordenadas y las guardará en Firebase para que todos los empleados las usen al verificar su ubicación.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.gpsBtn, detectingLoc && { backgroundColor: '#9CA3AF' }]}
              onPress={handleDetectLocation}
              disabled={detectingLoc}
              activeOpacity={0.85}
            >
              {detectingLoc ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.gpsBtnText}>Detectando ubicación...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="locate" size={20} color="#fff" />
                  <Text style={styles.gpsBtnText}>
                    {savedLocation ? 'Actualizar con mi ubicación actual' : 'Usar mi ubicación actual'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { backgroundColor: '#2563EB', borderRadius: 18, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  headerLeft: {},
  greeting: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  locationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#FED7AA' },
  locationBannerOk: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  locationTitle: { fontSize: 13, fontWeight: '700', color: '#F97316' },
  locationSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 10, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '48%', borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statCount: { color: '#1F2937', fontSize: 28, fontWeight: '800' },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickLink: { backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { color: '#374151', fontWeight: '600', fontSize: 13 },
  recentCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  recentBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plateIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  plate: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
  model: { color: '#9CA3AF', fontSize: 12, marginTop: 1 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  sheetSub: { fontSize: 12, color: '#9CA3AF', marginTop: 3, maxWidth: '85%' },
  coordBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#86EFAC' },
  coordTitle: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  coordSub: { fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 18 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 11.5, color: '#1E40AF', lineHeight: 17 },
  gpsBtn: { backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  gpsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
