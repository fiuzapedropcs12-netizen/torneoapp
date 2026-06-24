import React from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { useApp } from '@/context/AppContext'
import TorneoCard from '@/components/TorneoCard'
import EmptyState from '@/components/EmptyState'
import FAB from '@/components/FAB'
import LoadingScreen from '@/components/LoadingScreen'
import ErrorScreen from '@/components/ErrorScreen'
import type { Torneo } from '@/types/torneo'
import { colors } from '@/theme/colors'

/**
 * Pantalla principal — lista de todos los torneos.
 * RF-01: ver lista de torneos.
 * RF-02: crear torneo (FAB → modal crear).
 */
export default function HomeScreen() {
  const { state } = useApp()

  if (state.loading) return <LoadingScreen />
  if (state.error) return <ErrorScreen mensaje={state.error} />

  function irATorneo(torneo: Torneo) {
    router.push(`/torneo/${torneo.id}`)
  }

  function irACrear() {
    router.push('/torneo/crear')
  }

  return (
    <View style={styles.contenedor}>
      <FlatList
        data={state.torneos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TorneoCard torneo={item} onPress={() => irATorneo(item)} />
        )}
        contentContainerStyle={[
          styles.lista,
          state.torneos.length === 0 && styles.listaVacia,
        ]}
        ListEmptyComponent={<EmptyState variante="torneos" />}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={irACrear} label="Crear torneo" />
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lista: {
    padding: 16,
  },
  listaVacia: {
    flex: 1,
  },
})
