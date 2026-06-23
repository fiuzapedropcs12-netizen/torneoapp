import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '@/theme/colors'

export type TabInterno = 'tabla' | 'fixture' | 'equipos'

const TABS: { id: TabInterno; label: string }[] = [
  { id: 'tabla',   label: 'Tabla' },
  { id: 'fixture', label: 'Fixture' },
  { id: 'equipos', label: 'Equipos' },
]

type Props = {
  activa: TabInterno
  onChange: (tab: TabInterno) => void
}

/**
 * Selector de pestañas interno para la pantalla de detalle de torneo.
 * Reemplaza la navegación de fondo nativa (expo-router Tabs) con un switcher
 * liviano que no produce rutas separadas.
 */
export default function TabsInternos({ activa, onChange }: Props) {
  return (
    <View style={styles.contenedor}>
      {TABS.map((tab) => {
        const estaActiva = tab.id === activa
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, estaActiva && styles.tabActiva]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: estaActiva }}
          >
            <Text style={[styles.label, estaActiva && styles.labelActiva]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActiva: {
    borderBottomColor: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelActiva: {
    color: colors.primary,
    fontWeight: '700',
  },
})
