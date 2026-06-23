import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '@/theme/colors'

type Props = {
  visible: boolean
  titulo: string
  mensaje: string
  /** Texto del botón de confirmación destructiva. Por defecto 'Eliminar'. */
  labelConfirmar?: string
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Diálogo modal para acciones destructivas (eliminar torneo, equipo, etc.).
 * Botón de confirmación en rojo (danger), cancelar en gris.
 */
export default function ConfirmDialog({
  visible,
  titulo,
  mensaje,
  labelConfirmar = 'Eliminar',
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancelar}
      statusBarTranslucent
    >
      {/* Fondo semitransparente — tap fuera cancela */}
      <Pressable style={styles.fondo} onPress={onCancelar}>
        {/* Detener propagación para que el tap dentro no cierre */}
        <Pressable style={styles.caja} onPress={() => {}}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}>{mensaje}</Text>

          <View style={styles.botones}>
            <Pressable
              style={[styles.boton, styles.botonCancelar]}
              onPress={onCancelar}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.boton, styles.botonConfirmar]}
              onPress={onConfirmar}
              android_ripple={{ color: '#b91c1c' }}
            >
              <Text style={styles.textoConfirmar}>{labelConfirmar}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  caja: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 8,
    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  mensaje: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  boton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
  },
  botonCancelar: {
    backgroundColor: colors.pendingBg,
  },
  botonConfirmar: {
    backgroundColor: colors.danger,
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
