import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Partido } from '@/types/torneo'
import { colors } from '@/theme/colors'

type Props = {
  partido: Partido
  /** Si no viene, el botón "Cargar resultado" no se muestra (rol JUGADOR). */
  onCargarResultado?: (id: string) => void
  /** Si no viene, el botón "Programar fecha" no se muestra (rol JUGADOR). */
  onProgramarFecha?: (id: string) => void
  /** Si no viene, el botón "Cargar estadísticas" no se muestra (rol JUGADOR). */
  onCargarEstadisticas?: (id: string) => void
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const horas = String(d.getHours()).padStart(2, '0')
  const minutos = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes} ${horas}:${minutos}`
}

export default function PartidoCard({ partido, onCargarResultado, onProgramarFecha, onCargarEstadisticas }: Props) {
  const jugado = partido.estado === 'jugado'

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Equipo local */}
        <Text style={styles.equipoText} numberOfLines={1}>
          {partido.local.nombre}
        </Text>

        {/* Centro: resultado o VS */}
        <View style={styles.centro}>
          {jugado ? (
            <Text style={styles.score}>
              {partido.golesLocal} — {partido.golesVisitante}
            </Text>
          ) : (
            <Text style={styles.vs}>VS</Text>
          )}
          {/* Badge de estado */}
          <View style={[styles.badge, jugado ? styles.badgeJugado : styles.badgePendiente]}>
            <Text style={[styles.badgeText, jugado ? styles.badgeTextJugado : styles.badgeTextPendiente]}>
              {jugado ? 'JUGADO' : 'PENDIENTE'}
            </Text>
          </View>
        </View>

        {/* Equipo visitante */}
        <Text style={[styles.equipoText, styles.textRight]} numberOfLines={1}>
          {partido.visitante.nombre}
        </Text>
      </View>

      {/* Ganador por penales, si el partido terminó empatado en una eliminatoria */}
      {partido.ganadorPenalesId && (
        <Text style={styles.penales}>
          Ganó{' '}
          {partido.ganadorPenalesId === partido.local.id ? partido.local.nombre : partido.visitante.nombre} por
          penales
        </Text>
      )}

      {/* Fecha programada, si la hay */}
      {partido.fecha && (
        <Text style={styles.fecha}>{formatFecha(partido.fecha)}</Text>
      )}

      {/* Acciones de organizador */}
      <View style={styles.acciones}>
        {!jugado && onCargarResultado && (
          <TouchableOpacity
            style={styles.botonCargar}
            onPress={() => onCargarResultado(partido.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.botonCargarText}>Cargar resultado</Text>
          </TouchableOpacity>
        )}

        {!jugado && onProgramarFecha && (
          <TouchableOpacity
            style={styles.botonCargar}
            onPress={() => onProgramarFecha(partido.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.botonCargarText}>{partido.fecha ? 'Reprogramar fecha' : 'Programar fecha'}</Text>
          </TouchableOpacity>
        )}

        {jugado && onCargarEstadisticas && (
          <TouchableOpacity
            style={styles.botonCargar}
            onPress={() => onCargarEstadisticas(partido.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.botonCargarText}>Cargar estadísticas</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textRight: {
    textAlign: 'right',
  },
  centro: {
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vs: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeJugado: {
    backgroundColor: colors.successBg,
  },
  badgePendiente: {
    backgroundColor: colors.pendingBg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextJugado: {
    color: colors.successText,
  },
  badgeTextPendiente: {
    color: colors.pendingText,
  },
  penales: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  fecha: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  botonCargar: {
    flexGrow: 1,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  botonCargarText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
})
