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
import { useClub } from '@/hooks/useTorneoApi'
import { useAuth } from '@/context/AuthContext'
import { DEPORTES } from '@/constants/deportes'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import FAB from '@/components/FAB'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { Deporte } from '@/types/torneo'

const EMOJI_DEPORTE: Record<string, string> = {
  'Fútbol 5': '⚽',
  'Fútbol 9': '⚽',
  Pádel: '🎾',
  Básquet: '🏀',
  Otro: '🏅',
}

/**
 * Detalle de un club — lista sus torneos.
 * Ruta: /club/[clubId]
 */
export default function ClubDetailScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>()
  const { club, cargando, error, crearTorneo, eliminarClub } = useClub(clubId!)
  const { usuario } = useAuth()
  const navigation = useNavigation()

  const esOwner = usuario && club && usuario.id === club.ownerId

  const [modalCrear, setModalCrear] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [deporteNuevo, setDeporteNuevo] = useState<Deporte>('Fútbol 5')
  const [creando, setCreando] = useState(false)
  const [dialogEliminarClub, setDialogEliminarClub] = useState(false)

  useLayoutEffect(() => {
    if (!club) return
    navigation.setOptions({
      title: club.nombre,
      headerRight: esOwner
        ? () => (
            <TouchableOpacity onPress={() => setDialogEliminarClub(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.headerBtn}>🗑️</Text>
            </TouchableOpacity>
          )
        : undefined,
    })
  }, [club, esOwner, navigation])

  if (cargando && !club) return <LoadingScreen type="tabla" />
  if (error && !club) return <ErrorScreen message={error} />
  if (!club) {
    router.replace('/')
    return null
  }

  async function confirmarCrearTorneo() {
    const nombre = nombreNuevo.trim()
    if (!nombre) return
    setCreando(true)
    const ok = await crearTorneo(nombre, deporteNuevo)
    setCreando(false)
    if (ok) {
      setNombreNuevo('')
      setModalCrear(false)
    }
  }

  async function confirmarEliminarClub() {
    setDialogEliminarClub(false)
    const ok = await eliminarClub()
    if (ok) router.replace('/')
  }

  return (
    <View style={styles.contenedor}>
      <FlatList
        data={club.torneos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/torneo/${item.id}`)} activeOpacity={0.75}>
            <View style={styles.iconoContenedor}>
              <Text style={styles.emoji}>{EMOJI_DEPORTE[item.deporte] ?? '🏅'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
              <Text style={styles.meta}>{item.deporte} · Liga</Text>
            </View>
            <Text style={styles.flecha}>›</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.lista, club.torneos.length === 0 && styles.listaVacia]}
        ListEmptyComponent={<EmptyState variante="torneos" />}
        showsVerticalScrollIndicator={false}
      />

      {esOwner && <FAB onPress={() => setModalCrear(true)} label="Crear torneo" />}

      <Modal transparent visible={modalCrear} animationType="fade" onRequestClose={() => setModalCrear(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.modalFondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalFondo} onPress={() => setModalCrear(false)}>
            <Pressable style={styles.modalCaja} onPress={() => {}}>
              <Text style={styles.modalTitulo}>Nuevo torneo</Text>
              <TextInput
                style={styles.modalInput}
                value={nombreNuevo}
                onChangeText={setNombreNuevo}
                placeholder="Ej: Liga de Verano 2026"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                maxLength={60}
                returnKeyType="done"
              />
              <View style={styles.chips}>
                {DEPORTES.map((d) => {
                  const seleccionado = d === deporteNuevo
                  return (
                    <Pressable
                      key={d}
                      style={[styles.chip, seleccionado && styles.chipActivo]}
                      onPress={() => setDeporteNuevo(d)}
                    >
                      <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>{d}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <View style={styles.modalBotones}>
                <Pressable style={[styles.modalBoton, styles.modalBotonCancelar]} onPress={() => setModalCrear(false)}>
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBoton, styles.modalBotonConfirmar, creando && { opacity: 0.6 }]}
                  onPress={confirmarCrearTorneo}
                  disabled={creando}
                >
                  <Text style={styles.textoConfirmar}>{creando ? 'Creando…' : 'Crear'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog
        visible={dialogEliminarClub}
        titulo="Eliminar club"
        mensaje="Se van a borrar todos los torneos, equipos y resultados del club. Esta acción no se puede deshacer."
        onConfirmar={confirmarEliminarClub}
        onCancelar={() => setDialogEliminarClub(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.background },
  headerBtn: { fontSize: 18, marginRight: 4 },
  lista: { padding: 16 },
  listaVacia: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconoContenedor: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  nombre: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 13, color: colors.textSecondary },
  flecha: { fontSize: 22, color: colors.textSecondary, fontWeight: '300' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCaja: { backgroundColor: colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360, gap: 12 },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  modalInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.textPrimary,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  chipTextoActivo: { color: '#FFFFFF' },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  modalBoton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, minWidth: 88, alignItems: 'center' },
  modalBotonCancelar: { backgroundColor: colors.pendingBg },
  modalBotonConfirmar: { backgroundColor: colors.primaryDark },
  textoCancelar: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  textoConfirmar: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
})
