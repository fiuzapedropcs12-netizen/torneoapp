import React, { useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useClubes } from '@/hooks/useTorneoApi'
import { useAuth } from '@/context/AuthContext'
import ClubCard from '@/components/ClubCard'
import EmptyState from '@/components/EmptyState'
import FAB from '@/components/FAB'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'

/**
 * Pantalla principal — lista de todos los clubes del usuario.
 * Un club agrupa varios torneos (expansión vertical del dominio, E3).
 */
export default function HomeScreen() {
  const { clubes, cargando, error, crearClub, refetch } = useClubes()
  const { usuario, logout } = useAuth()

  const [modalCrear, setModalCrear] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [creando, setCreando] = useState(false)

  if (cargando && clubes.length === 0) return <LoadingScreen type="tabla" />
  if (error && clubes.length === 0) return <ErrorScreen message={error} onRetry={refetch} />

  function irAClub(clubId: string) {
    router.push(`/club/${clubId}`)
  }

  async function confirmarCrearClub() {
    const nombre = nombreNuevo.trim()
    if (!nombre) return
    setCreando(true)
    const ok = await crearClub(nombre)
    setCreando(false)
    if (ok) {
      setNombreNuevo('')
      setModalCrear(false)
    }
  }

  function confirmarLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <View style={styles.contenedor}>
      {usuario && (
        <View style={styles.header}>
          <Text style={styles.saludo}>
            {usuario.nombre} · {usuario.rol === 'ORGANIZADOR' ? 'Organizador' : 'Jugador'}
          </Text>
          <TouchableOpacity onPress={confirmarLogout}>
            <Text style={styles.logout}>Salir</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={clubes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClubCard club={item} onPress={() => irAClub(item.id)} />}
        contentContainerStyle={[styles.lista, clubes.length === 0 && styles.listaVacia]}
        ListEmptyComponent={<EmptyState variante="clubes" />}
        showsVerticalScrollIndicator={false}
      />

      {/* Solo el rol organizador puede crear clubes */}
      {usuario?.rol === 'ORGANIZADOR' && (
        <FAB onPress={() => setModalCrear(true)} label="Crear club" />
      )}

      <Modal
        transparent
        visible={modalCrear}
        animationType="fade"
        onRequestClose={() => setModalCrear(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView style={styles.modalFondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalFondo} onPress={() => setModalCrear(false)}>
            <Pressable style={styles.modalCaja} onPress={() => {}}>
              <Text style={styles.modalTitulo}>Nuevo club</Text>
              <TextInput
                style={styles.modalInput}
                value={nombreNuevo}
                onChangeText={setNombreNuevo}
                placeholder="Ej: Club Atlético Central"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={confirmarCrearClub}
              />
              <View style={styles.modalBotones}>
                <Pressable style={[styles.modalBoton, styles.modalBotonCancelar]} onPress={() => setModalCrear(false)}>
                  <Text style={styles.textoCancelar}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBoton, styles.modalBotonConfirmar, creando && { opacity: 0.6 }]}
                  onPress={confirmarCrearClub}
                  disabled={creando}
                >
                  <Text style={styles.textoConfirmar}>{creando ? 'Creando…' : 'Crear'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saludo: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  logout: { fontSize: 13, color: colors.danger, fontWeight: '700' },
  lista: { padding: 16 },
  listaVacia: { flex: 1 },
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
  },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
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
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  modalBoton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, minWidth: 88, alignItems: 'center' },
  modalBotonCancelar: { backgroundColor: colors.pendingBg },
  modalBotonConfirmar: { backgroundColor: colors.primaryDark },
  textoCancelar: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  textoConfirmar: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
})
