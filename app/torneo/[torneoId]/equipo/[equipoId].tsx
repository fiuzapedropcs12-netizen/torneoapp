import React, { useLayoutEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useEquipo, useHistorialEquipo } from '@/hooks/useTorneoApi'
import { useAuth } from '@/context/AuthContext'
import { getMaxJugadores, getMinJugadores } from '@/constants/deportes'
import JugadorRow from '@/components/JugadorRow'
import ConfirmDialog from '@/components/ConfirmDialog'
import FAB from '@/components/FAB'
import EmptyState from '@/components/EmptyState'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { Deporte, Jugador } from '@/types/torneo'
import type { PartidoHistorialApi } from '@/lib/api'

type TabEquipo = 'plantel' | 'historial'

/**
 * Pantalla de plantel de un equipo.
 * Ruta: /torneo/[torneoId]/equipo/[equipoId]
 * Params: torneoId, equipoId, deporte (viene de la pantalla anterior, para no
 * pedir el torneo completo solo para saber el límite de jugadores)
 *
 * RF-04: Gestionar plantel — agregar y eliminar jugadores.
 * RN-04: No se pueden agregar más jugadores del máximo permitido por deporte.
 * RN-05: Se muestra aviso si el plantel tiene menos del mínimo requerido.
 */
export default function EquipoJugadoresScreen() {
  const { equipoId, deporte } = useLocalSearchParams<{
    torneoId: string
    equipoId: string
    deporte: string
  }>()
  const { equipo, cargando, error, dispatch } = useEquipo(equipoId!)
  const { partidos: historial, cargando: cargandoHistorial } = useHistorialEquipo(equipoId!)
  const navigation = useNavigation()
  const { usuario } = useAuth()
  const esOrganizador = usuario?.rol === 'ORGANIZADOR'

  const [tab, setTab] = useState<TabEquipo>('plantel')
  const [modalAgregar, setModalAgregar] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [dialogEliminar, setDialogEliminar] = useState<{ visible: boolean; jugadorId: string }>({
    visible: false, jugadorId: '',
  })

  // Configurar header con nombre del equipo
  useLayoutEffect(() => {
    if (!equipo) return
    navigation.setOptions({ title: equipo.nombre })
  }, [equipo, navigation])

  if (cargando && !equipo) return <LoadingScreen type="fixture" />
  if (error && !equipo) return <ErrorScreen message={error} />

  // Guard: equipo eliminado o id inválido (ya terminó de cargar y no existe)
  if (!equipo) {
    router.back()
    return null
  }

  const deporteTipado = (deporte as Deporte) ?? 'Otro'
  const maxJugadores = getMaxJugadores(deporteTipado)
  const minJugadores = getMinJugadores(deporteTipado)
  const cantJugadores = equipo.jugadores.length
  const plantelCompleto = cantJugadores >= maxJugadores
  const plantelInsuficiente = cantJugadores < minJugadores

  // ── Acciones ────────────────────────────────────────────────────────────────

  function abrirModalAgregar() {
    if (plantelCompleto) {
      Alert.alert(
        'Plantel completo',
        `El máximo para ${deporteTipado} es ${maxJugadores} jugadores (${minJugadores} titulares + ${maxJugadores - minJugadores} suplentes).`
      )
      return
    }
    setNombreNuevo('')
    setModalAgregar(true)
  }

  function confirmarAgregarJugador() {
    const nombre = nombreNuevo.trim()
    if (!nombre) return

    dispatch({ type: 'AGREGAR_JUGADOR', payload: { nombre } })
    setNombreNuevo('')
    setModalAgregar(false)
  }

  function confirmarEliminarJugador() {
    dispatch({ type: 'ELIMINAR_JUGADOR', payload: { jugadorId: dialogEliminar.jugadorId } })
    setDialogEliminar({ visible: false, jugadorId: '' })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.contenedor}>
      {/* Selector Plantel / Historial */}
      <View style={styles.tabsContenedor}>
        <TouchableOpacity
          style={[styles.tab, tab === 'plantel' && styles.tabActiva]}
          onPress={() => setTab('plantel')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, tab === 'plantel' && styles.tabLabelActiva]}>Plantel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'historial' && styles.tabActiva]}
          onPress={() => setTab('historial')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, tab === 'historial' && styles.tabLabelActiva]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {tab === 'plantel' ? (
        <>
          {/* Banner de advertencia si el plantel tiene menos del mínimo */}
          {plantelInsuficiente && (
            <View style={styles.bannerAviso}>
              <Text style={styles.bannerAvisoTexto}>
                ⚠️ Plantel incompleto: necesitás al menos {minJugadores} jugadores titulares para{' '}
                {deporteTipado}.
              </Text>
            </View>
          )}

          {/* Contador de jugadores */}
          <View style={styles.contadorContenedor}>
            <Text style={styles.contadorTexto}>
              {cantJugadores} / {maxJugadores} jugadores
            </Text>
            <Text style={styles.contadorDetalle}>
              {minJugadores} titulares + {maxJugadores - minJugadores} suplentes
            </Text>
          </View>

          {/* Lista de jugadores */}
          {equipo.jugadores.length === 0 ? (
            <EmptyState variante="equipos" />
          ) : (
            <FlatList<Jugador>
              data={equipo.jugadores}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <JugadorRow
                  jugador={item}
                  numero={index + 1}
                  onPress={() => router.push({ pathname: '/jugador/[jugadorId]', params: { jugadorId: item.id } })}
                  onEliminar={esOrganizador ? () => setDialogEliminar({ visible: true, jugadorId: item.id }) : undefined}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* FAB para agregar jugador (deshabilitado si plantel completo, solo organizador) */}
          {esOrganizador && !plantelCompleto && (
            <FAB onPress={abrirModalAgregar} label="Agregar jugador" />
          )}

          {/* Mensaje cuando el plantel está completo */}
          {plantelCompleto && (
            <View style={styles.bannerCompleto}>
              <Text style={styles.bannerCompletoTexto}>
                Plantel completo ({maxJugadores}/{maxJugadores})
              </Text>
            </View>
          )}
        </>
      ) : (
        <HistorialEquipoTab partidos={historial} cargando={cargandoHistorial} />
      )}

      {/* ── Modales ─────────────────────────────────────────────────────────── */}

      {/* Modal agregar jugador */}
      <Modal
        transparent
        visible={modalAgregar}
        animationType="fade"
        onRequestClose={() => setModalAgregar(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalFondo}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalFondo} onPress={() => setModalAgregar(false)}>
            <Pressable style={styles.modalCaja} onPress={() => {}}>
              <Text style={styles.modalTitulo}>Agregar jugador</Text>
              <TextInput
                style={styles.modalInput}
                value={nombreNuevo}
                onChangeText={setNombreNuevo}
                placeholder="Nombre del jugador"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={confirmarAgregarJugador}
              />
              <View style={styles.modalBotones}>
                <Pressable
                  style={[styles.modalBoton, styles.modalBotonCancelar]}
                  onPress={() => setModalAgregar(false)}
                >
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBoton, styles.modalBotonConfirmar]}
                  onPress={confirmarAgregarJugador}
                >
                  <Text style={styles.textoConfirmar}>Agregar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmar eliminar jugador */}
      <ConfirmDialog
        visible={dialogEliminar.visible}
        titulo="Eliminar jugador"
        mensaje="¿Seguro que querés eliminar este jugador del plantel?"
        onConfirmar={confirmarEliminarJugador}
        onCancelar={() => setDialogEliminar({ visible: false, jugadorId: '' })}
      />
    </View>
  )
}

function HistorialEquipoTab({ partidos, cargando }: { partidos: PartidoHistorialApi[]; cargando: boolean }) {
  if (cargando && partidos.length === 0) return <LoadingScreen type="fixture" />
  if (partidos.length === 0) return <EmptyState variante="fixture" />

  return (
    <FlatList<PartidoHistorialApi>
      data={partidos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.historialLista}
      renderItem={({ item }) => {
        const jugado = item.estado === 'jugado'
        return (
          <View style={styles.historialCard}>
            <Text style={styles.historialJornada}>Jornada {item.jornada}</Text>
            <View style={styles.historialRow}>
              <Text style={styles.historialEquipo} numberOfLines={1}>{item.local.nombre}</Text>
              <Text style={styles.historialResultado}>
                {jugado ? `${item.golesLocal} — ${item.golesVisitante}` : 'VS'}
              </Text>
              <Text style={[styles.historialEquipo, styles.textRight]} numberOfLines={1}>{item.visitante.nombre}</Text>
            </View>
          </View>
        )
      }}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Tabs internos (Plantel / Historial) ──────────────────────────────────────
  tabsContenedor: {
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
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabLabelActiva: {
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Historial ──────────────────────────────────────────────────────────────
  historialLista: {
    padding: 16,
    paddingBottom: 24,
  },
  historialCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  historialJornada: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  historialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historialEquipo: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textRight: {
    textAlign: 'right',
  },
  historialResultado: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 8,
  },

  // ── Banners ────────────────────────────────────────────────────────────────
  bannerAviso: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  bannerAvisoTexto: {
    fontSize: 13,
    color: colors.warningText,
    fontWeight: '500',
    lineHeight: 18,
  },
  bannerCompleto: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: colors.enVivoBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerCompletoTexto: {
    fontSize: 13,
    color: colors.enVivoText,
    fontWeight: '700',
  },

  // ── Contador ───────────────────────────────────────────────────────────────
  contadorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contadorTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contadorDetalle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCaja: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalBoton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
  },
  modalBotonCancelar: {
    backgroundColor: colors.pendingBg,
  },
  modalBotonConfirmar: {
    backgroundColor: colors.primaryDark,
  },
  textoCancelar: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textoConfirmar: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
