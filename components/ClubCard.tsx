import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { ClubResumen } from '@/lib/api'
import { colors } from '@/theme/colors'

type Props = {
  club: ClubResumen
  onPress: () => void
}

/**
 * Tarjeta de club para la pantalla principal.
 * Un club agrupa varios torneos (expansión vertical del dominio — E3).
 */
export default function ClubCard({ club, onPress }: Props) {
  const cantTorneos = club._count.torneos

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconoContenedor}>
        <Text style={styles.emoji}>🏟️</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>{club.nombre}</Text>
        {!!club.descripcion && (
          <Text style={styles.descripcion} numberOfLines={1}>{club.descripcion}</Text>
        )}
        <Text style={styles.meta}>
          {cantTorneos} {cantTorneos === 1 ? 'torneo' : 'torneos'}
        </Text>
      </View>

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
  emoji: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  nombre: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  descripcion: { fontSize: 12, color: colors.textSecondary },
  meta: { fontSize: 13, color: colors.textSecondary },
  flecha: { fontSize: 22, color: colors.textSecondary, fontWeight: '300' },
})
