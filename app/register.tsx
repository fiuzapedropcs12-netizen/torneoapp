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
import type { Rol } from '@/lib/api'
import { colors } from '@/theme/colors'

/**
 * Pantalla de registro.
 * Ruta: /register
 * RF-09 (E3): elección de rol — organizador (gestiona torneos) o jugador (solo lectura).
 */
export default function RegisterScreen() {
  const { registrar } = useAuth()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('ORGANIZADOR')
  const [cargando, setCargando] = useState(false)

  async function crearCuenta() {
    if (!nombre.trim() || !email.trim() || password.length < 6) {
      Alert.alert('Revisá los datos', 'Nombre, email y una contraseña de al menos 6 caracteres.')
      return
    }
    setCargando(true)
    try {
      await registrar(email.trim(), password, nombre.trim(), rol)
      router.replace('/')
    } catch (e) {
      Alert.alert('No se pudo crear la cuenta', e instanceof ApiError ? e.message : 'Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Crear cuenta</Text>

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="next"
        />

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
          placeholder="Al menos 6 caracteres"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          returnKeyType="done"
        />

        <Text style={styles.etiqueta}>Rol</Text>
        <View style={styles.chips}>
          {(['ORGANIZADOR', 'JUGADOR'] as Rol[]).map((r) => {
            const seleccionado = r === rol
            return (
              <Pressable
                key={r}
                style={[styles.chip, seleccionado && styles.chipActivo]}
                onPress={() => setRol(r)}
              >
                <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>
                  {r === 'ORGANIZADOR' ? 'Organizador' : 'Jugador'}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Text style={styles.nota}>
          El organizador crea y gestiona torneos. El jugador solo puede consultar.
        </Text>

        <Pressable style={[styles.boton, cargando && { opacity: 0.6 }]} onPress={crearCuenta} disabled={cargando}>
          {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botonTexto}>Crear cuenta</Text>}
        </Pressable>

        <Pressable style={styles.linkContenedor} onPress={() => router.back()}>
          <Text style={styles.link}>Ya tengo cuenta, iniciar sesión</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 6 },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
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
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  chipTextoActivo: { color: '#FFFFFF' },
  nota: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
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
