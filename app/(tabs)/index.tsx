import React, { useCallback } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTorneo } from '@/context/TorneoContext'
import TablaRow from '@/components/TablaRow'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { FilaTabla } from '@/types/torneo'

function CabeceraTabla() {
  return (
    <View style={styles.cabecera}>
      <Text style={[styles.cabeceraCol, styles.cabeceraPos]}>#</Text>
      <Text style={[styles.cabeceraCol, styles.cabeceraEquipo]}>EQUIPO</Text>
      <Text style={styles.cabeceraCol}>PJ</Text>
      <Text style={styles.cabeceraCol}>PG</Text>
      <Text style={styles.cabeceraCol}>PE</Text>
      <Text style={styles.cabeceraCol}>PP</Text>
      <Text style={styles.cabeceraCol}>+/-</Text>
      <Text style={[styles.cabeceraCol, styles.cabeceraGoles]}>GOLES</Text>
      <Text style={styles.cabeceraCol}>PTS</Text>
    </View>
  )
}

function BannerVacio() {
  return (
    <View style={styles.bannerVacio}>
      <MaterialCommunityIcons name="trophy-outline" size={20} color={colors.primary} />
      <Text style={styles.bannerVacioText}>
        Todavía no hay partidos jugados. ¡Cargá el primer resultado!
      </Text>
    </View>
  )
}

function Leyenda() {
  return (
    <Text style={styles.leyenda}>
      PJ: Jugados · PG: Ganados · PE: Empatados · PP: Perdidos
    </Text>
  )
}

export default function TablaScreen() {
  const { state, dispatch } = useTorneo()

  const hayPartidosJugados = state.partidos.some((p) => p.estado === 'jugado')

  const handleRetry = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_LOADING', payload: true })
    // Al no tener error, el Provider no se reinicializa. Recargamos manualmente.
    // Para el MVP de E1 basta con limpiar el error y mostrar la tabla.
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [dispatch])

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <Header nombre={state.nombre} deporte={state.deporte} />
        <LoadingScreen type="tabla" />
      </SafeAreaView>
    )
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="light" />
        <Header nombre={state.nombre} deporte={state.deporte} />
        <ErrorScreen
          message="No se pudo cargar la tabla. Intentá de nuevo."
          onRetry={handleRetry}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <Header nombre={state.nombre} deporte={state.deporte} />
      <FlatList<FilaTabla>
        data={state.tabla}
        keyExtractor={(item) => item.equipo.id}
        renderItem={({ item, index }) => (
          <TablaRow
            fila={item}
            posicion={index + 1}
            isFirst={index === 0}
            isEven={index % 2 === 0}
          />
        )}
        ListHeaderComponent={
          <>
            {!hayPartidosJugados && <BannerVacio />}
            <CabeceraTabla />
          </>
        }
        ListFooterComponent={<Leyenda />}
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
      />
    </SafeAreaView>
  )
}

function Header({ nombre, deporte }: { nombre: string; deporte: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerSubtitulo}>{deporte.toUpperCase()}</Text>
      <Text style={styles.headerTitulo}>{nombre}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
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
  lista: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listaContent: {
    paddingBottom: 24,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cabeceraCol: {
    width: 28,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cabeceraPos: {
    width: 24,
  },
  cabeceraEquipo: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 6,
  },
  cabeceraGoles: {
    width: 40,
  },
  bannerVacio: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    margin: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  bannerVacioText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  leyenda: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
})

