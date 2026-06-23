import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { colors } from '@/theme/colors'

type Props = {
  onPress: () => void
  /** Accesibilidad: describe la acción. Por defecto 'Crear'. */
  label?: string
}

/**
 * Floating Action Button — círculo 52×52 de color primaryDark.
 * Muestra el símbolo "+" en blanco.
 * Se posiciona en el extremo inferior derecho de la pantalla.
 * El padre debe usar `flex: 1` y `position: 'relative'` (o la raíz de la pantalla).
 */
export default function FAB({ onPress, label = 'Crear' }: Props) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.icono}>+</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  icono: {
    fontSize: 28,
    lineHeight: 30,
    color: '#FFFFFF',
    fontWeight: '300',
  },
})
