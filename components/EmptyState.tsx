import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme/colors'

type Variante = 'clubes' | 'torneos' | 'equipos' | 'fixture'

const CONTENIDO: Record<Variante, { emoji: string; titulo: string; subtitulo: string }> = {
  clubes: {
    emoji: '🏟️',
    titulo: 'Sin clubes aún',
    subtitulo: 'Tocá el botón + para crear tu primer club.',
  },
  torneos: {
    emoji: '🏆',
    titulo: 'Sin torneos aún',
    subtitulo: 'Tocá el botón + para crear tu primer torneo.',
  },
  equipos: {
    emoji: '👥',
    titulo: 'Sin equipos',
    subtitulo: 'Agregá equipos con el botón + antes de generar el fixture.',
  },
  fixture: {
    emoji: '📅',
    titulo: 'Sin fixture',
    subtitulo: 'Necesitás al menos 2 equipos para generar el fixture.',
  },
}

type Props = {
  variante: Variante
}

export default function EmptyState({ variante }: Props) {
  const { emoji, titulo, subtitulo } = CONTENIDO[variante]

  return (
    <View style={styles.contenedor}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.subtitulo}>{subtitulo}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
