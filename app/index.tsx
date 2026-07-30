import React, { useCallback } from 'react'
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useTorneos } from '@/hooks/useTorneoApi'
import { useAuth } from '@/context/AuthContext'
import EmptyState from '@/components/EmptyState'
import FAB from '@/components/FAB'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import { colors } from '@/theme/colors'
import type { TorneoResumen } from '@/lib/api'

const EMOJI_DEPORTE: Record<string, string> = {
  'Fútbol 5': '⚽',
  'Fútbol 9': '⚽',
  Pádel: '🎾',
  Básquet: '🏀',
  Otro: '🏅',
}

/**
 * Pantalla principal — lista de todos los torneos.
 * Ruta: /
 */
export default function HomeScreen() {
  const { torneos, cargando, error, refetch } = useTorneos()
  const { usuario, logout } = useAuth()

  // Vuelve a pedir la lista cada vez que la pantalla recupera foco (ej: al
  // volver de crear un torneo nuevo), no solo al montar.
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  if (cargando && torneos.length === 0) return <LoadingScreen type="tabla" />
  if (error && torneos.length === 0) return <ErrorScreen message={error} onRetry={refetch} />

  function irATorneo(torneoId: string) {
    router.push(`/torneo/${torneoId}`)
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
        data={torneos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TorneoRow torneo={item} onPress={() => irATorneo(item.id)} />}
        contentContainerStyle={[styles.lista, torneos.length === 0 && styles.listaVacia]}
        ListEmptyComponent={<EmptyState variante="torneos" />}
        showsVerticalScrollIndicator={false}
      />

      {/* Solo el rol organizador puede crear torneos */}
      {usuario?.rol === 'ORGANIZADOR' && (
        <FAB onPress={() => router.push('/torneo/crear')} label="Crear torneo" />
      )}
    </View>
  )
}

function TorneoRow({ torneo, onPress }: { torneo: TorneoResumen; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconoContenedor}>
        <Text style={styles.emoji}>{EMOJI_DEPORTE[torneo.deporte] ?? '🏅'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>{torneo.nombre}</Text>
        <Text style={styles.meta}>{torneo.deporte} · Liga</Text>
      </View>
      <Text style={styles.flecha}>›</Text>
    </TouchableOpacity>
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
})
