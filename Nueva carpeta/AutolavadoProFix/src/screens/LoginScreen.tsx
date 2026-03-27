import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = login(username.trim(), password.trim());
    setLoading(false);
    if (!ok) setError('Credenciales incorrectas');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={40} color="#60A5FA" />
            </View>
            <Text style={styles.title}>
              Autolavado <Text style={styles.titleBlue}>Pro</Text>
            </Text>
            <Text style={styles.subtitle}>Gestión de Calidad Premium</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* Username */}
            <View style={styles.field}>
              <Text style={styles.label}>USUARIO</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color="#60A5FA" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Ingresa tu usuario"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#60A5FA" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#60A5FA" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#FCA5A5" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Button */}
            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Iniciar Sesión</Text>
              }
            </TouchableOpacity>

            {/* Hints */}
            <View style={styles.hints}>
              <Text style={styles.hintTitle}>Cuentas de prueba:</Text>
              <Text style={styles.hint}>👑 Admin:    admin / 123</Text>
              <Text style={styles.hint}>👷 Empleado: juan / 123</Text>
              <Text style={styles.hint}>👷 Empleado: maria / 123</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(96,165,250,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  titleBlue: { color: '#60A5FA' },
  subtitle: { color: 'rgba(191,219,254,0.6)', fontSize: 13, marginTop: 4 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  field: { marginBottom: 18 },
  label: {
    color: '#BFDBFE', fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingRight: 4,
  },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, color: '#fff', paddingVertical: 13, fontSize: 15 },
  eyeBtn: { padding: 12 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: '#FCA5A5', fontSize: 13 },

  btn: {
    backgroundColor: '#2563EB', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  hints: { marginTop: 20, alignItems: 'center', gap: 3 },
  hintTitle: { color: 'rgba(148,163,184,0.6)', fontSize: 11, marginBottom: 4, fontWeight: '600' },
  hint: { color: 'rgba(148,163,184,0.45)', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
});
