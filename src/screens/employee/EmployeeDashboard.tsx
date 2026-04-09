import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/UI';

type TabKey = 'active' | 'completed' | 'cancelled';

export default function EmployeeDashboard() {
  const { currentUser, washes, updateUser } = useApp();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<TabKey>('active');

  if (!currentUser) return null;

  const mine = washes.filter(w => w.employeeId === currentUser.id);
  const active    = mine.filter(w => w.status === 'assigned' || w.status === 'in_progress');
  const completed = mine.filter(w => w.status === 'finished');
  const cancelled = mine.filter(w => w.status === 'cancelled');
  const displayed = tab === 'active' ? active : tab === 'completed' ? completed : cancelled;

  const today = new Date();
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay()); weekStart.setHours(0, 0, 0, 0);
  const earningsToday = completed.filter(w => w.finishedAt && new Date(w.finishedAt).toDateString() === today.toDateString()).reduce((s, w) => s + (w.price || 0), 0);
  const earningsWeek  = completed.filter(w => w.finishedAt && new Date(w.finishedAt) >= weekStart).reduce((s, w) => s + (w.price || 0), 0);

  const TABS = [
    { key: 'active' as TabKey,    label: 'Activos',     count: active.length },
    { key: 'completed' as TabKey, label: 'Completados', count: completed.length },
    { key: 'cancelled' as TabKey, label: 'Cancelados',  count: cancelled.length },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={displayed}
        keyExtractor={w => w.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.greeting}>Hola, {currentUser.name.split(' ')[0]} 👋</Text>
                  <Text style={styles.heroSub}>¡Buen día de trabajo!</Text>
                </View>
                <View style={styles.heroRight}>
                  <TouchableOpacity
                    onPress={() => updateUser(currentUser.id, { isOnline: !currentUser.isOnline })}
                    style={[styles.statusBtn, { backgroundColor: currentUser.isOnline ? '#4ADE80' : '#9CA3AF' }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="power" size={12} color={currentUser.isOnline ? '#14532D' : '#374151'} />
                    <Text style={[styles.statusBtnText, { color: currentUser.isOnline ? '#14532D' : '#374151' }]}>
                      {currentUser.isOnline ? 'ACTIVO' : 'INACTIVO'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person" size={18} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                {[
                  { icon: 'cash-outline', label: 'Hoy',    value: `$${earningsToday}`, color: '#4ADE80' },
                  { icon: 'calendar-outline', label: 'Semana', value: `$${earningsWeek}`,  color: '#60A5FA' },
                  { icon: 'checkmark-done-outline', label: 'Total',  value: completed.length, color: '#C084FC' },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <View style={styles.statDivider} />}
                    <View style={styles.statItem}>
                      <Ionicons name={s.icon as any} size={16} color={s.color} style={{ marginBottom: 3 }} />
                      <Text style={styles.statLabel}>{s.label}</Text>
                      <Text style={styles.statValue}>{s.value}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrap}>
              <View style={styles.tabs}>
                {TABS.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                    onPress={() => setTab(t.key)}
                  >
                    <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                      {t.label}
                    </Text>
                    {t.count > 0 && (
                      <View style={[styles.tabBadge, { backgroundColor: tab === t.key ? '#2563EB' : '#E5E7EB' }]}>
                        <Text style={[styles.tabBadgeText, { color: tab === t.key ? '#fff' : '#6B7280' }]}>{t.count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: 10 }}>🚗</Text>
            <Text style={styles.emptyText}>Sin lavados en esta sección</Text>
          </View>
        }
        renderItem={({ item: wash }) => (
          <TouchableOpacity
            style={styles.washCard}
            onPress={() => navigation.navigate('WashDetail', { washId: wash.id })}
            activeOpacity={0.8}
          >
            {wash.status === 'in_progress' && <View style={styles.progressStripe} />}
            <View style={styles.washTop}>
              <View>
                <Text style={styles.washPlate}>{wash.vehicle.plate}</Text>
                <Text style={styles.washModel}>{wash.vehicle.model} · {wash.vehicle.color}</Text>
              </View>
              <StatusBadge status={wash.status} />
            </View>
            <View style={styles.washMeta}>
              <View style={styles.typeTag}><Text style={styles.typeText}>{wash.type}</Text></View>
              {wash.price ? <Text style={styles.price}>${wash.price}</Text> : null}
              <Ionicons name="time-outline" size={13} color="#9CA3AF" />
              <Text style={styles.timeText}>
                {new Date(wash.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Ionicons name="chevron-forward" size={15} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: { paddingBottom: 32 },

  hero: {
    backgroundColor: '#2563EB', padding: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    marginBottom: 16,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },
  heroRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  statusBtnText: { fontSize: 10, fontWeight: '800' },
  profileBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 2 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.18)' },

  tabsWrap: { paddingHorizontal: 16, marginBottom: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 3 },
  tabBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  tabText: { color: '#9CA3AF', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#2563EB' },
  tabBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },

  washCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, padding: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  progressStripe: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
    backgroundColor: '#3B82F6',
  },
  washTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  washPlate: { fontWeight: '800', fontSize: 20, color: '#1F2937' },
  washModel: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  washMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  typeTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  price: { color: '#16A34A', fontWeight: '700' },
  timeText: { color: '#9CA3AF', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
});
