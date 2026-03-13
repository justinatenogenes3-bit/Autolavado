import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { STATUS_CONFIG, WashStatus } from '../context/AppContext';

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: WashStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── PRIMARY BUTTON ───────────────────────────────────────────────────────────
interface BtnProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  color?: string;
  icon?: string;
  disabled?: boolean;
  style?: object;
}
export const PrimaryButton = ({ onPress, label, loading, color = '#2563EB', disabled, style }: BtnProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.82}
    style={[styles.primaryBtn, { backgroundColor: color, opacity: (disabled || loading) ? 0.7 : 1 }, style]}
  >
    {loading
      ? <ActivityIndicator color="#fff" />
      : <Text style={styles.primaryBtnText}>{label}</Text>
    }
  </TouchableOpacity>
);

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
export const SectionCard = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[styles.sectionCard, style]}>{children}</View>
);

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ message }: { message: string }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🚗</Text>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },

  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 15, textAlign: 'center' },
});
