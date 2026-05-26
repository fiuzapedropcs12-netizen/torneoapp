import React, { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTorneo } from '@/context/TorneoContext'
import PartidoCard from '@/components/PartidoCard'
import LoadingScreen from '@/components/LoadingScreen'
import EmptyScreen from '@/components/EmptyScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { Partido } from '@/types/torneo'

// Hardcodeado para Entrega 1 — en E2 se deriva de state.partidos
const FECHAS = [1, 2, 3]

export default function FixtureScreen() {
  const { state, dispatch } = useTorneo()
  const router = useRouter()

  const [fechaSeleccionada, setFechaSeleccionada] = useState(1)
  const [dropdownVisible, setDropdownVisible] = useState(false)

  const partidosDeFecha = useMemo<Partido[]>(
    () => state.partidos.filter((p) => p.jornada === fechaSeleccionada),
    [state.partidos, fechaSeleccionada]
  )

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

  const handleSeleccionarFecha = (fecha: number) => {
    setFechaSeleccionada(fecha)
    setDropdownVisible(false)
  }

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
          <ErrorScreen message="No se pudo cargar el fixture." onRetry={handleRetry} />
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

      <View style={styles.contenido}>
        {/* Selector de fecha */}
        <View style={styles.selectorWrapper}>
          <TouchableOpacity
            style={styles.selectorBoton}
            onPress={() => setDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectorTexto}>FECHA {fechaSeleccionada}</Text>
            <MaterialCommunityIcons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Lista de partidos */}
        <FlatList<Partido>
          data={partidosDeFecha}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PartidoCard partido={item} onCargarResultado={handleCargarResultado} />
          )}
          contentContainerStyle={styles.listaContent}
        />
      </View>

      {/* Dropdown modal */}
      <Modal
        transparent
        visible={dropdownVisible}
        animationType="none"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                {FECHAS.map((fecha, index) => (
                  <TouchableOpacity
                    key={fecha}
                    style={[
                      styles.dropdownItem,
                      index < FECHAS.length - 1 && styles.dropdownItemBorder,
                    ]}
                    onPress={() => handleSeleccionarFecha(fecha)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dropdownItemTexto,
                        fecha === fechaSeleccionada && styles.dropdownItemTextoActivo,
                      ]}
                    >
                      FECHA {fecha}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  contenido: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectorWrapper: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  selectorBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectorTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  listaContent: {
    padding: 12,
    paddingBottom: 24,
  },
  // Dropdown
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    top: 60, // justo debajo del selector
    alignSelf: 'center',
    left: '25%',
    right: '25%',
    backgroundColor: colors.surface,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownItemTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  dropdownItemTextoActivo: {
    color: colors.primary,
  },
})
