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
import { useTorneo } from '@/context/AppContext'
import { getMaxJugadores, getMinJugadores } from '@/constants/deportes'
import JugadorRow from '@/components/JugadorRow'
import ConfirmDialog from '@/components/ConfirmDialog'
import FAB from '@/components/FAB'
import EmptyState from '@/components/EmptyState'
import { colors } from '@/theme/colors'
import type { Jugador } from '@/types/torneo'

/**
 * Pantalla de plantel de un equipo.
 * Ruta: /torneo/[torneoId]/equipo/[equipoId]
 *
 * RF-04: Gestionar plantel — agregar y eliminar jugadores.
 * RN-04: No se pueden agregar más jugadores del máximo permitido por deporte.
 * RN-05: Se muestra aviso si el plantel tiene menos del mínimo requerido.
 */
export default function EquipoJugadoresScreen() {
  const { torneoId, equipoId } = useLocalSearchParams<{ torneoId: string; equipoId: string }>()
  const { torneo, dispatch } = useTorneo(torneoId!)
  const navigation = useNavigation()

  const [modalAgregar, setModalAgregar] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [dialogEliminar, setDialogEliminar] = useState<{ visible: boolean; jugadorId: string }>({
    visible: false, jugadorId: '',
  })

  const equipo = torneo?.equipos.find((e) => e.id === equipoId)

  // Configurar header con nombre del equipo
  useLayoutEffect(() => {
    if (!equipo) return
    navigation.setOptions({ title: equipo.nombre })
  }, [equipo, navigation])

  // Guards
  if (!torneo || !equipo) {
    router.back()
    return null
  }

  const maxJugadores = getMaxJugadores(torneo.deporte)
  const minJugadores = getMinJugadores(torneo.deporte)
  const cantJugadores = equipo.jugadores.length
  const plantelCompleto = cantJugadores >= maxJugadores
  const plantelInsuficiente = cantJugadores < minJugadores

  // ── Acciones ────────────────────────────────────────────────────────────────

  function abrirModalAgregar() {
    if (plantelCompleto) {
      Alert.alert(
        'Plantel completo',
        `El máximo para ${torneo!.deporte} es ${maxJugadores} jugadores (${getMinJugadores(torneo!.deporte)} titulares + ${maxJugadores - minJugadores} suplentes).`
      )
      return
    }
    setNombreNuevo('')
    setModalAgregar(true)
  }

  function confirmarAgregarJugador() {
    const nombre = nombreNuevo.trim()
    if (!nombre) return

    dispatch({
      type: 'AGREGAR_JUGADOR',
      payload: { torneoId: torneoId!, equipoId: equipoId!, nombre },
    })
    setNombreNuevo('')
    setModalAgregar(false)
  }

  function confirmarEliminarJugador() {
    dispatch({
      type: 'ELIMINAR_JUGADOR',
      payload: { torneoId: torneoId!, equipoId: equipoId!, jugadorId: dialogEliminar.jugadorId },
    })
    setDialogEliminar({ visible: false, jugadorId: '' })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.contenedor}>
      {/* Banner de advertencia si el plantel tiene menos del mínimo */}
      {plantelInsuficiente && (
        <View style={styles.bannerAviso}>
          <Text style={styles.bannerAvisoTexto}>
            ⚠️ Plantel incompleto: necesitás al menos {minJugadores} jugadores titulares para{' '}
            {torneo.deporte}.
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
              onEliminar={() => setDialogEliminar({ visible: true, jugadorId: item.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB para agregar jugador (deshabilitado si plantel completo) */}
      {!plantelCompleto && (
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

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
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
