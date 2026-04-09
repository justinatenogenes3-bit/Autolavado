import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';

export default function ProfileScreen() {
  const { currentUser, logout, washes } = useApp();
  const navigation = useNavigation<any>();

  if (!currentUser) return null;

  const mine = washes.filter(w => w.employeeId === currentUser.id && w.status === 'finished');
  const totalEarnings = mine.reduce((s, w) => s + (w.price || 0), 0);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const InfoRow = ({ icon, label, value, color = '#2563EB' }: any) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={42} color="#2563EB" />
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
          <View style={[styles.roleBadge, { backgroundColor: currentUser.role === 'admin' ? 'rgba(219,234,254,0.9)' : 'rgba(220,252,231,0.9)' }]}>
            <Ionicons
              name={currentUser.role === 'admin' ? 'shield-checkmark-outline' : 'construct-outline'}
              size={13}
              color={currentUser.role === 'admin' ? '#1E40AF' : '#166534'}
            />
            <Text style={[styles.roleText, { color: currentUser.role === 'admin' ? '#1E40AF' : '#166534' }]}>
              {currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}
            </Text>
          </View>
        </View>

        {/* Stats (employees only) */}
        {currentUser.role === 'employee' && (
          <View style={styles.statsCard}>
            {[
              ['Trabajos', mine.length],
              ['Generado', `$${totalEarnings}`],
              ['En proceso', washes.filter(w => w.employeeId === currentUser.id && w.status === 'in_progress').length],
            ].map(([label, value], i) => (
              <React.Fragment key={label as string}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Información de Cuenta</Text>
          <InfoRow
            icon="shield-checkmark-outline"
            label="Rol"
            value={currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}
          />
          <InfoRow
            icon="call-outline"
            label="Teléfono"
            value={currentUser.phone || 'No registrado'}
            color="#16A34A"
          />
          <InfoRow
            icon="ellipse"
            label="Estado de Cuenta"
            value={currentUser.status === 'active' ? 'Activo' : 'Inactivo'}
            color={currentUser.status === 'active' ? '#16A34A' : '#DC2626'}
          />
          {currentUser.role === 'employee' && (
            <InfoRow
              icon="wifi-outline"
              label="Disponibilidad"
              value={currentUser.isOnline ? 'Disponible' : 'No disponible'}
              color={currentUser.isOnline ? '#16A34A' : '#9CA3AF'}
            />
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { paddingBottom: 32 },

  hero: {
    backgroundColor: '#2563EB', alignItems: 'center',
    paddingTop: 32, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  avatarCircle: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  username: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: '700' },

  statsCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 18, padding: 20,
    flexDirection: 'row', justifyContent: 'space-around',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  statLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  divider: { width: 1, backgroundColor: '#E5E7EB', height: 36, alignSelf: 'center' },

  infoCard: {
    backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 18, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontWeight: '700', color: '#1F2937', fontSize: 15, marginBottom: 14 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  infoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginBottom: 1 },
  infoValue: { color: '#1F2937', fontSize: 14, fontWeight: '600' },

  logoutBtn: {
    marginHorizontal: 16, padding: 15, borderRadius: 16,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
});
