import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Jugador } from '@/types/torneo'
import { colors } from '@/theme/colors'

type Props = {
  jugador: Jugador
  numero: number
  /** Si no viene, no se muestra el botón de eliminar (rol JUGADOR). */
  onEliminar?: () => void
  /** Si viene, la fila navega al detalle del jugador (historial + estadísticas). */
  onPress?: () => void
}

/**
 * Fila de jugador dentro de la pantalla de plantel de un equipo.
 * Muestra número de dorsal (posición en lista), nombre y botón de eliminación.
 */
export default function JugadorRow({ jugador, numero, onEliminar, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.fila}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Número */}
      <View style={styles.numeroBadge}>
        <Text style={styles.numero}>{numero}</Text>
      </View>

      {/* Nombre */}
      <Text style={styles.nombre} numberOfLines={1}>{jugador.nombre}</Text>

      {/* Botón eliminar */}
      {onEliminar && (
        <TouchableOpacity
          style={styles.botonEliminar}
          onPress={onEliminar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Eliminar a ${jugador.nombre}`}
        >
          <Text style={styles.iconoEliminar}>✕</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  numeroBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  nombre: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  botonEliminar: {
    padding: 4,
  },
  iconoEliminar: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
})
