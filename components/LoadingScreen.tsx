import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors } from '@/theme/colors'

type Props = {
  type: 'tabla' | 'fixture'
}

function SkeletonRect({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: colors.skeleton, borderRadius: 6, opacity },
        style,
      ]}
    />
  )
}

function TablaSkeletonRow() {
  return (
    <View style={styles.tablaRow}>
      <SkeletonRect width={20} height={14} />
      <SkeletonRect width={80} height={14} style={styles.equipoCol} />
      <SkeletonRect width={22} height={14} />
      <SkeletonRect width={22} height={14} />
      <SkeletonRect width={22} height={14} />
      <SkeletonRect width={22} height={14} />
      <SkeletonRect width={28} height={14} />
      <SkeletonRect width={38} height={14} />
      <SkeletonRect width={22} height={14} />
    </View>
  )
}

function FixtureSkeletonCard() {
  return (
    <View style={styles.fixtureCard}>
      <View style={styles.fixtureRow}>
        <SkeletonRect width={80} height={14} />
        <SkeletonRect width={40} height={20} style={styles.mx8} />
        <SkeletonRect width={80} height={14} />
      </View>
      <SkeletonRect width={90} height={12} style={styles.mt8} />
    </View>
  )
}

export default function LoadingScreen({ type }: Props) {
  if (type === 'tabla') {
    return (
      <View style={styles.container}>
        <View style={styles.tablaHeader}>
          {['#', 'EQUIPO', 'PJ', 'PG', 'PE', 'PP', '+/-', 'GOLES', 'PTS'].map((col) => (
            <SkeletonRect key={col} width={col === 'EQUIPO' ? 80 : 28} height={12} />
          ))}
        </View>
        {Array.from({ length: 6 }).map((_, i) => (
          <TablaSkeletonRow key={i} />
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SkeletonRect width={100} height={16} style={styles.jornadaHeader} />
      {Array.from({ length: 3 }).map((_, i) => (
        <FixtureSkeletonCard key={`j1-${i}`} />
      ))}
      <SkeletonRect width={100} height={16} style={styles.jornadaHeader} />
      {Array.from({ length: 3 }).map((_, i) => (
        <FixtureSkeletonCard key={`j2-${i}`} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  tablaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  tablaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  equipoCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  fixtureCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jornadaHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  mx8: {
    marginHorizontal: 8,
  },
  mt8: {
    marginTop: 8,
    alignSelf: 'center',
  },
})
