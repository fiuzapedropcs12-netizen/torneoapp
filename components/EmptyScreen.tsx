import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

type Props = {
  title: string
  message: string
  icon?: keyof typeof MaterialCommunityIcons.glyphMap
}

export default function EmptyScreen({ title, message, icon = 'calendar-blank' }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={56} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
