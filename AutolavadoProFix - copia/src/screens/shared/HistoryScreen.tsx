import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';

export default function HistoryScreen() {
  const { washes, users, currentUser } = useApp();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const relevant = currentUser?.role === 'admin'
    ? washes
    : washes.filter(w => w.employeeId === currentUser?.id);

  const finished = relevant.filter(w => w.status === 'finished');

  const filtered = finished.filter(w =>
    w.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
    w.vehicle.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por placa o modelo..."
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
      </View>

      {/* Counter */}
      <View style={styles.counter}>
        <Ionicons name="checkmark-circle" size={15} color="#16A34A" />
        <Text style={styles.counterText}>{finished.length} servicios completados</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={w => w.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 44, marginBottom: 10 }}>📋</Text>
            <Text style={styles.emptyTitle}>Sin historial</Text>
            <Text style={styles.emptyText}>Los lavados finalizados aparecen aquí</Text>
          </View>
        }
        renderItem={({ item: wash }) => {
          const emp = users.find(u => u.id === wash.employeeId);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('WashDetail', { washId: wash.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name="car" size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.plate}>{wash.vehicle.plate}</Text>
                  <Text style={styles.model}>{wash.vehicle.model} · {wash.vehicle.color}</Text>
                  {emp && (
                    <View style={styles.empRow}>
                      <Ionicons name="person-outline" size={11} color="#9CA3AF" />
                      <Text style={styles.empText}>{emp.name}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{wash.type}</Text>
                </View>
                {wash.price ? <Text style={styles.price}>${wash.price}</Text> : null}
                <Text style={styles.date}>
                  {wash.finishedAt
                    ? new Date(wash.finishedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                    : '—'}
                </Text>
                <Ionicons name="chevron-forward" size={15} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F6' },
  searchWrap: { padding: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  counter: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingBottom: 10,
  },
  counterText: { color: '#6B7280', fontSize: 13 },
  list: { padding: 14, paddingTop: 0, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  plate: { fontWeight: '700', fontSize: 15, color: '#1F2937' },
  model: { color: '#6B7280', fontSize: 12, marginTop: 1 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  empText: { color: '#9CA3AF', fontSize: 11 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  typeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  price: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  date: { color: '#9CA3AF', fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { color: '#374151', fontWeight: '700', fontSize: 18, marginTop: 8, marginBottom: 6 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
});
