import React, { useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Equipo } from '@/types/torneo'
import { colors } from '@/theme/colors'

type Props = {
  equipo: Equipo
  fixtureGenerado: boolean
  onVerJugadores: () => void
  /** Si no viene, no se muestra "Renombrar" en el menú (rol JUGADOR). */
  onRenombrar?: () => void
  /** Si no viene, no se muestra "Eliminar" en el menú (rol JUGADOR). También se oculta si el fixture ya fue generado (RN-03). */
  onEliminar?: () => void
}

/**
 * Fila de equipo dentro de la pestaña Equipos del torneo.
 * Muestra nombre, cantidad de jugadores y un menú "…" con acciones.
 * Eliminar se deshabilita si el fixture ya está generado.
 */
export default function EquipoRow({
  equipo,
  fixtureGenerado,
  onVerJugadores,
  onRenombrar,
  onEliminar,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false)
  const anchorRef = useRef<View>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  const cantJugadores = equipo.jugadores.length

  function abrirMenu() {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ top: y + height, right: 0 })
      setMenuVisible(true)
    })
  }

  return (
    <>
      <TouchableOpacity style={styles.fila} onPress={onVerJugadores} activeOpacity={0.7}>
        {/* Nombre y conteo de jugadores */}
        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{equipo.nombre}</Text>
          <Text style={styles.jugadores}>
            {cantJugadores} {cantJugadores === 1 ? 'jugador' : 'jugadores'}
          </Text>
        </View>

        {/* Botón menú */}
        <TouchableOpacity
          ref={anchorRef}
          style={styles.botonMenu}
          onPress={abrirMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Opciones del equipo"
        >
          <Text style={styles.iconoMenu}>⋯</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Menú flotante */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.fondoMenu} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { top: menuPos.top, right: 16 }]}>
            <TouchableOpacity
              style={styles.opcion}
              onPress={() => { setMenuVisible(false); onVerJugadores() }}
            >
              <Text style={styles.textoOpcion}>Ver jugadores</Text>
            </TouchableOpacity>

            {onRenombrar && (
              <>
                <View style={styles.separador} />
                <TouchableOpacity
                  style={styles.opcion}
                  onPress={() => { setMenuVisible(false); onRenombrar() }}
                >
                  <Text style={styles.textoOpcion}>Renombrar</Text>
                </TouchableOpacity>
              </>
            )}

            {!fixtureGenerado && onEliminar && (
              <>
                <View style={styles.separador} />
                <TouchableOpacity
                  style={styles.opcion}
                  onPress={() => { setMenuVisible(false); onEliminar() }}
                >
                  <Text style={[styles.textoOpcion, styles.textoEliminar]}>Eliminar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  jugadores: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  botonMenu: {
    padding: 4,
  },
  iconoMenu: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Menú flotante
  fondoMenu: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: 10,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  opcion: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  textoOpcion: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  textoEliminar: {
    color: colors.danger,
  },
  separador: {
    height: 1,
    backgroundColor: colors.border,
  },
})
