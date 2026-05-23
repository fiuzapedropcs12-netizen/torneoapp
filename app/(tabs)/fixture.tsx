import React, { useCallback, useMemo } from 'react'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useTorneo } from '@/context/TorneoContext'
import PartidoCard from '@/components/PartidoCard'
import LoadingScreen from '@/components/LoadingScreen'
import EmptyScreen from '@/components/EmptyScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { Partido } from '@/types/torneo'

type Seccion = {
  jornada: number
  data: Partido[]
}

export default function FixtureScreen() {
  const { state, dispatch } = useTorneo()
  const router = useRouter()

  const secciones = useMemo<Seccion[]>(() => {
    const mapaJornadas = new Map<number, Partido[]>()
    for (const partido of state.partidos) {
      const lista = mapaJornadas.get(partido.jornada) ?? []
      lista.push(partido)
      mapaJornadas.set(partido.jornada, lista)
    }
    return Array.from(mapaJornadas.entries())
      .sort(([a], [b]) => a - b)
      .map(([jornada, data]) => ({ jornada, data }))
  }, [state.partidos])

  const handleCargarResultado = useCallback(
    (id: string) => {
      router.push(`/fixture/${id}`)
    },
    [router]
  )

  const handleRetry = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [dispatch])

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <Header nombre={state.nombre} />
        <LoadingScreen type="fixture" />
      </SafeAreaView>
    )
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <Header nombre={state.nombre} />
        <View style={styles.fill}>
          <ErrorScreen
            message="No se pudo cargar el fixture."
            onRetry={handleRetry}
          />
        </View>
      </SafeAreaView>
    )
  }

  if (state.partidos.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <Header nombre={state.nombre} />
        <View style={styles.fill}>
          <EmptyScreen
            title="Sin fixture"
            message="No hay partidos generados todavía."
            icon="calendar-blank"
          />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <Header nombre={state.nombre} />
      <SectionList<Partido, Seccion>
        sections={secciones}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.jornadaHeader}>
            <Text style={styles.jornadaText}>JORNADA {section.jornada}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PartidoCard
            partido={item}
            onCargarResultado={handleCargarResultado}
          />
        )}
        contentContainerStyle={styles.listaContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  )
}

function Header({ nombre }: { nombre: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerSubtitulo}>FIXTURE</Text>
      <Text style={styles.headerTitulo}>{nombre}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerSubtitulo: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerTitulo: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  listaContent: {
    padding: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
  },
  jornadaHeader: {
    marginTop: 8,
    marginBottom: 6,
  },
  jornadaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
})
