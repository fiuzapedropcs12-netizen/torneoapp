import React, { useLayoutEffect } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useJugador } from '@/hooks/useTorneoApi'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import EmptyState from '@/components/EmptyState'
import { colors } from '@/theme/colors'
import type { PartidoHistorialApi } from '@/lib/api'

/**
 * Detalle de un jugador: totales individuales (RF-11) e historial de partidos
 * con sus estadísticas en cada uno (RF-10 "por jugador"). Pantalla de solo
 * lectura para ambos roles.
 * Ruta: /jugador/[jugadorId]
 */
export default function JugadorDetalleScreen() {
  const { jugadorId } = useLocalSearchParams<{ jugadorId: string }>()
  const { jugador, partidos, totales, cargando, error } = useJugador(jugadorId!)
  const navigation = useNavigation()

  useLayoutEffect(() => {
    if (!jugador) return
    navigation.setOptions({ title: jugador.nombre })
  }, [jugador, navigation])

  if (cargando && !jugador) return <LoadingScreen type="fixture" />
  if (error && !jugador) return <ErrorScreen message={error} />

  if (!jugador) {
    router.back()
    return null
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.nombre}>{jugador.nombre}</Text>
        <Text style={styles.equipo}>
          {jugador.equipoNombre} · {jugador.torneoNombre}
        </Text>
      </View>

      {totales && (
        <View style={styles.totalesCard}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValor}>{totales.goles}</Text>
            <Text style={styles.totalLabel}>Goles</Text>
          </View>
          <View style={styles.totalDivisor} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValor}>{totales.asistencias}</Text>
            <Text style={styles.totalLabel}>Asistencias</Text>
          </View>
          <View style={styles.totalDivisor} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValor}>{totales.atajadas}</Text>
            <Text style={styles.totalLabel}>Atajadas</Text>
          </View>
          <View style={styles.totalDivisor} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValor}>{totales.partidosJugados}</Text>
            <Text style={styles.totalLabel}>Partidos</Text>
          </View>
        </View>
      )}

      <Text style={styles.seccionTitulo}>Historial</Text>

      {partidos.length === 0 ? (
        <EmptyState variante="fixture" />
      ) : (
        <FlatList<PartidoHistorialApi>
          data={partidos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => <PartidoHistorialApiRow partido={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

function PartidoHistorialApiRow({ partido }: { partido: PartidoHistorialApi }) {
  const jugado = partido.estado === 'jugado'

  return (
    <View style={styles.partidoCard}>
      <View style={styles.partidoRow}>
        <Text style={styles.partidoEquipo} numberOfLines={1}>{partido.local.nombre}</Text>
        <Text style={styles.partidoResultado}>
          {jugado ? `${partido.golesLocal} — ${partido.golesVisitante}` : 'VS'}
        </Text>
        <Text style={[styles.partidoEquipo, styles.textRight]} numberOfLines={1}>{partido.visitante.nombre}</Text>
      </View>

      {jugado && partido.estadisticas && (
        <Text style={styles.partidoStats}>
          {partido.estadisticas.goles} goles · {partido.estadisticas.asistencias} asist. · {partido.estadisticas.atajadas} atajadas
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  equipo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalesCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  totalValor: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  totalDivisor: {
    width: 1,
    backgroundColor: colors.border,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  partidoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  partidoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partidoEquipo: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textRight: {
    textAlign: 'right',
  },
  partidoResultado: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 8,
  },
  partidoStats: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
