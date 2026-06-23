import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import type { ConexionEstado } from '@/types/torneo'
import { colors } from '@/theme/colors'

type Props = {
  estado: ConexionEstado
}

type Config = {
  bg: string
  textColor: string
  dotColor?: string
  mensaje: string
  mostrarDot: boolean
}

const CONFIG: Record<ConexionEstado, Config> = {
  'en-vivo': {
    bg: colors.enVivoBg,
    textColor: colors.enVivoText,
    dotColor: colors.enVivoDot,
    mensaje: 'EN VIVO',
    mostrarDot: true,
  },
  reconectando: {
    bg: colors.warningBg,
    textColor: colors.warningText,
    mensaje: 'Reconectando...',
    mostrarDot: false,
  },
  'sin-conexion': {
    bg: colors.errorBg,
    textColor: colors.errorText,
    mensaje: 'Sin conexión',
    mostrarDot: false,
  },
}

/**
 * Banner horizontal que indica el estado de conexión al servidor en tiempo real.
 * - EN VIVO: verde con punto pulsante
 * - Reconectando: amarillo sin punto
 * - Sin conexión: rojo sin punto
 *
 * El punto verde anima con una opacidad pulsante para indicar actividad.
 */
export default function ConexionBanner({ estado }: Props) {
  const config = CONFIG[estado]
  const opacidad = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (estado !== 'en-vivo') {
      opacidad.setValue(1)
      return
    }

    // Pulso continuo: 1 → 0.3 → 1 en 1.4s
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    )
    animacion.start()
    return () => animacion.stop()
  }, [estado, opacidad])

  return (
    <View style={[styles.banner, { backgroundColor: config.bg }]}>
      {config.mostrarDot && config.dotColor && (
        <Animated.View
          style={[styles.dot, { backgroundColor: config.dotColor, opacity: opacidad }]}
        />
      )}
      <Text style={[styles.texto, { color: config.textColor }]}>{config.mensaje}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
