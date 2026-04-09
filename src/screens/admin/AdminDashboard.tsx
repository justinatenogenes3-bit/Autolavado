import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp, STATUS_CONFIG } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';

export default function AdminDashboard() {
  const { washes, currentUser } = useApp();
  const navigation = useNavigation<any>();

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

  const QuickLink = ({ icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={22} color="#2563EB" />
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

        {/* Stats */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Pendientes"  count={counts.pending}     icon="alert-circle-outline" color="#F97316" onPress={() => navigation.navigate('Washes')} />
          <StatCard label="Asignados"   count={counts.assigned}    icon="person-outline"       color="#EAB308" onPress={() => navigation.navigate('Washes')} />
          <StatCard label="En Proceso"  count={counts.in_progress} icon="play-circle-outline"  color="#2563EB" onPress={() => navigation.navigate('Washes')} />
          <StatCard label="Finalizados" count={counts.finished}    icon="checkmark-circle-outline" color="#16A34A" onPress={() => navigation.navigate('History')} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickGrid}>
          <QuickLink icon="people-outline"   label="Empleados"  onPress={() => navigation.navigate('Employees')} />
          <QuickLink icon="car-outline"      label="Lavados"    onPress={() => navigation.navigate('Washes')} />
          <QuickLink icon="camera-outline"   label="Evidencias" onPress={() => navigation.navigate('Washes')} />
          <QuickLink icon="time-outline"     label="Historial"  onPress={() => navigation.navigate('History')} />
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
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  header: {
    backgroundColor: '#2563EB', borderRadius: 18, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  headerLeft: {},
  greeting: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#1F2937',
    marginBottom: 10, marginTop: 4,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '48%', borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  statCount: { color: '#1F2937', fontSize: 28, fontWeight: '800' },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickLink: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', width: '48%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  quickLabel: { color: '#374151', fontWeight: '600', fontSize: 13 },

  recentCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  recentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
  },
  recentBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plateIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  plate: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
  model: { color: '#9CA3AF', fontSize: 12, marginTop: 1 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
