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
import type { Deporte } from '@/types/torneo'
import { colors } from '@/theme/colors'

/**
 * Pantalla de creación y edición de torneo.
 * Ruta: /torneo/crear
 * Params: clubId (requerido para crear) · torneoId/nombreInicial/deporteInicial (modo edición)
 *
 * RF-02: Crear torneo con nombre, deporte y formato.
 * RF-03: Editar torneo (mismo formulario, acción diferente).
 * Formato: fijo en 'Liga'. En E3+ se podría habilitar el selector.
 */
export default function CrearTorneoScreen() {
  const params = useLocalSearchParams<{
    clubId?: string
    torneoId?: string
    nombreInicial?: string
    deporteInicial?: string
  }>()

  const modoEdicion = Boolean(params.torneoId)

  const [nombre, setNombre] = useState(params.nombreInicial ?? '')
  const [deporte, setDeporte] = useState<Deporte>(
    (params.deporteInicial as Deporte) ?? 'Fútbol 5'
  )
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    const nombreTrimado = nombre.trim()
    if (!nombreTrimado) {
      Alert.alert('Nombre requerido', 'Ingresá un nombre para el torneo.')
      return
    }

    setGuardando(true)
    try {
      if (modoEdicion && params.torneoId) {
        await torneosApi.update(params.torneoId, { nombre: nombreTrimado, deporte })
      } else {
        if (!params.clubId) {
          Alert.alert('Error', 'Falta el club para crear el torneo.')
          return
        }
        await torneosApi.create(params.clubId, nombreTrimado, deporte)
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

        {/* Campo: Formato (fijo Liga en E2) */}
        <Text style={styles.etiqueta}>Formato</Text>
        <View style={styles.campoFijo}>
          <Text style={styles.valorFijo}>Liga</Text>
          <Text style={styles.notaFijo}>Otros formatos disponibles en E3</Text>
        </View>

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
