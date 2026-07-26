import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth, ApiError } from '@/context/AuthContext'
import { colors } from '@/theme/colors'

/**
 * Pantalla de login.
 * Ruta: /login
 * RF-09 (E3): autenticación con roles organizador/jugador.
 */
export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresá email y contraseña.')
      return
    }
    setCargando(true)
    try {
      await login(email.trim(), password)
      router.replace('/')
    } catch (e) {
      Alert.alert('No se pudo iniciar sesión', e instanceof ApiError ? e.message : 'Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>TorneoApp</Text>
        <Text style={styles.subtitulo}>Iniciá sesión para gestionar tus torneos</Text>

        <Text style={styles.etiqueta}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />

        <Text style={styles.etiqueta}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={entrar}
        />

        <Pressable style={[styles.boton, cargando && { opacity: 0.6 }]} onPress={entrar} disabled={cargando}>
          {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botonTexto}>Ingresar</Text>}
        </Pressable>

        <Pressable style={styles.linkContenedor} onPress={() => router.push('/register')}>
          <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 6 },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  botonTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  linkContenedor: { marginTop: 18, alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
})
