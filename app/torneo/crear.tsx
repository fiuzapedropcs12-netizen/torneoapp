import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { torneosApi, ApiError } from '@/lib/api'
import { DEPORTES } from '@/constants/deportes'
import { RONDAS_ELIMINATORIA } from '@/constants/formatos'
import type { Deporte, Formato, RondaEliminatoria } from '@/types/torneo'
import { colors } from '@/theme/colors'

/**
 * Pantalla de creación y edición de torneo.
 * Ruta: /torneo/crear
 * Params: torneoId/nombreInicial/deporteInicial (modo edición)
 *
 * RF-02: Crear torneo con nombre, deporte y formato.
 * RF-03: Editar torneo (mismo formulario, acción diferente).
 * El formato (y la instancia inicial en eliminatoria) solo se eligen al crear:
 * no se pueden cambiar después.
 */
export default function CrearTorneoScreen() {
  const params = useLocalSearchParams<{
    torneoId?: string
    nombreInicial?: string
    deporteInicial?: string
    formatoInicial?: string
  }>()

  const modoEdicion = Boolean(params.torneoId)
  const formatoInicial: Formato = params.formatoInicial === 'Eliminatoria' ? 'Eliminatoria' : 'Liga'

  const [nombre, setNombre] = useState(params.nombreInicial ?? '')
  const [deporte, setDeporte] = useState<Deporte>(
    (params.deporteInicial as Deporte) ?? 'Fútbol 5'
  )
  const [formato, setFormato] = useState<Formato>(formatoInicial)
  const [rondaInicial, setRondaInicial] = useState<RondaEliminatoria | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    const nombreTrimado = nombre.trim()
    if (!nombreTrimado) {
      Alert.alert('Nombre requerido', 'Ingresá un nombre para el torneo.')
      return
    }
    if (!modoEdicion && formato === 'Eliminatoria' && !rondaInicial) {
      Alert.alert('Instancia requerida', 'Elegí desde qué instancia arranca el torneo.')
      return
    }

    setGuardando(true)
    try {
      if (modoEdicion && params.torneoId) {
        await torneosApi.update(params.torneoId, { nombre: nombreTrimado, deporte })
      } else {
        await torneosApi.create(
          nombreTrimado,
          deporte,
          formato === 'Eliminatoria' ? 'eliminatoria' : 'liga',
          formato === 'Eliminatoria' ? (rondaInicial as RondaEliminatoria) : undefined
        )
      }
      router.back()
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'No se pudo guardar el torneo')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >

        {/* Campo: Nombre */}
        <Text style={styles.etiqueta}>Nombre del torneo</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Liga de Verano 2026"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          maxLength={60}
          returnKeyType="done"
        />

        {/* Campo: Formato */}
        <Text style={styles.etiqueta}>Formato</Text>
        {modoEdicion ? (
          <View style={styles.campoFijo}>
            <Text style={styles.valorFijo}>{formatoInicial}</Text>
            <Text style={styles.notaFijo}>No se puede cambiar</Text>
          </View>
        ) : (
          <View style={styles.chips}>
            {(['Liga', 'Eliminatoria'] as Formato[]).map((f) => {
              const seleccionado = f === formato
              return (
                <Pressable
                  key={f}
                  style={[styles.chip, seleccionado && styles.chipActivo]}
                  onPress={() => setFormato(f)}
                  android_ripple={{ color: colors.primaryLight }}
                >
                  <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>{f}</Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {/* Campo: Instancia inicial — solo para Eliminatoria, solo al crear */}
        {!modoEdicion && formato === 'Eliminatoria' && (
          <>
            <Text style={styles.etiqueta}>¿Desde qué instancia arranca?</Text>
            <View style={styles.chips}>
              {RONDAS_ELIMINATORIA.map((r) => {
                const seleccionado = r.id === rondaInicial
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.chip, seleccionado && styles.chipActivo]}
                    onPress={() => setRondaInicial(r.id)}
                    android_ripple={{ color: colors.primaryLight }}
                  >
                    <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>
                      {r.label} ({r.equipos} equipos)
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </>
        )}

        {/* Campo: Deporte — selector de chips */}
        <Text style={styles.etiqueta}>Deporte</Text>
        <View style={styles.chips}>
          {DEPORTES.map((d) => {
            const seleccionado = d === deporte
            return (
              <Pressable
                key={d}
                style={[styles.chip, seleccionado && styles.chipActivo]}
                onPress={() => setDeporte(d)}
                android_ripple={{ color: colors.primaryLight }}
              >
                <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>
                  {d}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Botón guardar */}
        <Pressable
          style={[styles.botonGuardar, guardando && { opacity: 0.6 }]}
          onPress={guardar}
          disabled={guardando}
          android_ripple={{ color: '#1B3A6B' }}
        >
          <Text style={styles.botonGuardarTexto}>
            {guardando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Crear torneo'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  contenido: {
    padding: 20,
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
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
  // Formato fijo
  campoFijo: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valorFijo: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  notaFijo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Chips de deporte
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipTexto: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextoActivo: {
    color: colors.primary,
    fontWeight: '700',
  },
  // Botón guardar
  botonGuardar: {
    marginTop: 32,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonGuardarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
})
