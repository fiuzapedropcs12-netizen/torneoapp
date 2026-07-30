import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useEstadisticasPartido } from '@/hooks/useTorneoApi'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { JugadorApi } from '@/lib/api'

type FilaEditable = { goles: string; asistencias: string; atajadas: string }

/**
 * Carga de estadísticas individuales (goles, asistencias, atajadas) de ambos
 * planteles para un partido ya jugado. Solo accesible a ORGANIZADOR (el botón
 * que navega acá no se muestra para JUGADOR).
 * Ruta: /partido/[partidoId]/estadisticas?localId=&visitanteId=
 */
export default function EstadisticasPartidoScreen() {
  const { partidoId, localId, visitanteId } = useLocalSearchParams<{
    partidoId: string
    localId: string
    visitanteId: string
  }>()
  const { local, visitante, estadisticas, cargando, error, guardando, guardar } =
    useEstadisticasPartido(partidoId!, localId!, visitanteId!)

  const [filas, setFilas] = useState<Record<string, FilaEditable>>({})

  useEffect(() => {
    if (!local || !visitante) return
    const inicial: Record<string, FilaEditable> = {}
    for (const j of [...local.jugadores, ...visitante.jugadores]) {
      const existente = estadisticas.find((e) => e.jugadorId === j.id)
      inicial[j.id] = {
        goles: String(existente?.goles ?? 0),
        asistencias: String(existente?.asistencias ?? 0),
        atajadas: String(existente?.atajadas ?? 0),
      }
    }
    setFilas(inicial)
  }, [local, visitante, estadisticas])

  if (cargando && !local) return <LoadingScreen type="fixture" />
  if (error && !local) return <ErrorScreen message={error} />
  if (!local || !visitante) return null

  function actualizarCampo(jugadorId: string, campo: keyof FilaEditable, valor: string) {
    const limpio = valor.replace(/[^0-9]/g, '')
    setFilas((prev) => ({ ...prev, [jugadorId]: { ...prev[jugadorId], [campo]: limpio } }))
  }

  async function onGuardar() {
    const payload = Object.entries(filas).map(([jugadorId, f]) => ({
      jugadorId,
      goles: Number(f.goles) || 0,
      asistencias: Number(f.asistencias) || 0,
      atajadas: Number(f.atajadas) || 0,
    }))
    await guardar(payload)
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <EquipoSeccion nombre={local.nombre} jugadores={local.jugadores} filas={filas} onCambiar={actualizarCampo} />
        <EquipoSeccion nombre={visitante.nombre} jugadores={visitante.jugadores} filas={filas} onCambiar={actualizarCampo} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.botonCancelar}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={guardando}
        >
          <Text style={styles.botonCancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
          onPress={onGuardar}
          activeOpacity={0.7}
          disabled={guardando}
        >
          <Text style={styles.botonGuardarText}>{guardando ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function EquipoSeccion({
  nombre,
  jugadores,
  filas,
  onCambiar,
}: {
  nombre: string
  jugadores: JugadorApi[]
  filas: Record<string, FilaEditable>
  onCambiar: (jugadorId: string, campo: keyof FilaEditable, valor: string) => void
}) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{nombre}</Text>

      <View style={styles.columnasHeader}>
        <Text style={[styles.columnaLabel, styles.nombreCol]} />
        <Text style={styles.columnaLabel}>Goles</Text>
        <Text style={styles.columnaLabel}>Asist.</Text>
        <Text style={styles.columnaLabel}>Atajadas</Text>
      </View>

      {jugadores.map((j) => {
        const fila = filas[j.id] ?? { goles: '0', asistencias: '0', atajadas: '0' }
        return (
          <View key={j.id} style={styles.fila}>
            <Text style={[styles.nombreJugador, styles.nombreCol]} numberOfLines={1}>{j.nombre}</Text>
            <TextInput
              style={styles.input}
              value={fila.goles}
              onChangeText={(v) => onCambiar(j.id, 'goles', v)}
              keyboardType="number-pad"
              maxLength={3}
            />
            <TextInput
              style={styles.input}
              value={fila.asistencias}
              onChangeText={(v) => onCambiar(j.id, 'asistencias', v)}
              keyboardType="number-pad"
              maxLength={3}
            />
            <TextInput
              style={styles.input}
              value={fila.atajadas}
              onChangeText={(v) => onCambiar(j.id, 'atajadas', v)}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  seccion: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  columnasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  columnaLabel: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  nombreCol: {
    flex: 2,
    textAlign: 'left',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  nombreJugador: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.pendingBg,
  },
  botonCancelarText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  botonGuardar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonGuardarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
