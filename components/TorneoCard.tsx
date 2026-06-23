import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Torneo } from '@/types/torneo'
import { colors } from '@/theme/colors'

type Props = {
  torneo: Torneo
  onPress: () => void
}

const EMOJI_DEPORTE: Record<string, string> = {
  'Fútbol 5': '⚽',
  'Fútbol 9': '⚽',
  Pádel: '🎾',
  Básquet: '🏀',
  Otro: '🏅',
}

/**
 * Tarjeta de torneo para la pantalla principal (lista de torneos).
 * Muestra nombre, deporte, cantidad de equipos y estado del fixture.
 */
export default function TorneoCard({ torneo, onPress }: Props) {
  const emoji = EMOJI_DEPORTE[torneo.deporte] ?? '🏅'
  const cantEquipos = torneo.equipos.length
  const fixtureGenerado = torneo.partidos.length > 0
  const partidosJugados = torneo.partidos.filter((p) => p.estado === 'jugado').length

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Icono de deporte */}
      <View style={styles.iconoContenedor}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Info central */}
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>{torneo.nombre}</Text>
        <Text style={styles.meta}>
          {torneo.deporte} · {cantEquipos} {cantEquipos === 1 ? 'equipo' : 'equipos'}
        </Text>
        {fixtureGenerado && (
          <Text style={styles.progreso}>
            {partidosJugados} / {torneo.partidos.length} partidos jugados
          </Text>
        )}
      </View>

      {/* Flecha */}
      <Text style={styles.flecha}>›</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconoContenedor: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progreso: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  flecha: {
    fontSize: 22,
    color: colors.textSecondary,
    fontWeight: '300',
  },
})
