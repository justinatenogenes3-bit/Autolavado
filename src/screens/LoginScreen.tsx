import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';

const SAVED_USER_KEY = 'ap_saved_username';

export default function LoginScreen() {
  const { login, loginByBiometric } = useApp();

  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [savedUser, setSavedUser]       = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [stored, hasHW, enrolled] = await Promise.all([
          AsyncStorage.getItem(SAVED_USER_KEY),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        const bioOk = hasHW && enrolled;
        setBioAvailable(bioOk);
        if (stored && bioOk) setSavedUser(stored);
      } catch {}
      finally { setInitializing(false); }
    })();
  }, []);

  const handleBiometricLogin = async () => {
    if (!savedUser) return;
    setError('');
    setBioLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Bienvenido, ${savedUser}`,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña del dispositivo',
        disableDeviceFallback: false,
      });
      if (result.success) {
        const ok = await loginByBiometric(savedUser);
        if (!ok) setError('Usuario no encontrado. Inicia sesión manualmente.');
      } else {
        if (result.error !== 'user_cancel') setError('No se pudo verificar tu identidad.');
      }
    } catch { setError('Error al acceder a la biometría.'); }
    finally { setBioLoading(false); }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { setError('Ingresa usuario y contraseña'); return; }
    setError('');
    setLoading(true);
    const ok = await login(username.trim(), password.trim());
    setLoading(false);
    if (!ok) { setError('Credenciales incorrectas'); return; }
    await AsyncStorage.setItem(SAVED_USER_KEY, username.trim());
  };

  const handleChangeUser = async () => {
    await AsyncStorage.removeItem(SAVED_USER_KEY);
    setSavedUser(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.initWrap}><ActivityIndicator size="large" color="#60A5FA" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="water" size={40} color="#60A5FA" />
            </View>
            <Text style={styles.title}>Autolavado <Text style={styles.titleBlue}>Pro</Text></Text>
            <Text style={styles.subtitle}>Gestión de Calidad Premium</Text>
          </View>

          {savedUser ? (
            <View style={styles.card}>
              <View style={styles.userChip}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{savedUser.slice(0,2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chipName}>{savedUser}</Text>
                  <Text style={styles.chipSub}>Toca para entrar con biometría</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#34D399" />
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#FCA5A5" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.bioBtn} onPress={handleBiometricLogin} disabled={bioLoading} activeOpacity={0.85}>
                {bioLoading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="finger-print" size={22} color="#fff" />
                    <Text style={styles.bioBtnText}>Entrar con Huella / Face ID</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.changeUserBtn} onPress={handleChangeUser}>
                <Ionicons name="swap-horizontal-outline" size={16} color="#93C5FD" />
                <Text style={styles.changeUserText}>No soy yo · Cambiar usuario</Text>
              </TouchableOpacity>
            </View>

          ) : (
            <View style={styles.card}>
              <View style={styles.field}>
                <Text style={styles.label}>USUARIO</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color="#60A5FA" style={styles.inputIcon} />
                  <TextInput style={styles.input} value={username} onChangeText={setUsername}
                    placeholder="Ingresa tu usuario" placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#60A5FA" style={styles.inputIcon} />
                  <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword}
                    placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPass} autoCapitalize="none" />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#60A5FA" />
                  </TouchableOpacity>
                </View>
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#FCA5A5" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Iniciar Sesión</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#0F172A' },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: 24 },
  initWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(96,165,250,0.35)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
  },
  title:     { fontSize: 30, fontWeight: '800', color: '#fff' },
  titleBlue: { color: '#60A5FA' },
  subtitle:  { color: 'rgba(191,219,254,0.6)', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  userChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(96,165,250,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(96,165,250,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { color: '#93C5FD', fontWeight: '700', fontSize: 14 },
  chipName:    { color: '#fff', fontWeight: '600', fontSize: 15 },
  chipSub:     { color: 'rgba(191,219,254,0.5)', fontSize: 12, marginTop: 2 },
  bioBtn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  bioBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  changeUserBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  changeUserText: { color: '#93C5FD', fontSize: 13 },
  field:     { marginBottom: 18 },
  label:     { color: '#BFDBFE', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  inputRow:  {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingRight: 4,
  },
  inputIcon: { paddingHorizontal: 14 },
  input:     { flex: 1, color: '#fff', paddingVertical: 13, fontSize: 15 },
  eyeBtn:    { padding: 12 },
  errorBox:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: '#FCA5A5', fontSize: 13 },
  btn: {
    backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
