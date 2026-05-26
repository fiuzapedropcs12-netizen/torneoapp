import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { FilaTabla } from '@/types/torneo'
import { colors } from '@/theme/colors'

type Props = {
  fila: FilaTabla
  posicion: number
  isFirst: boolean
  isEven: boolean
}

export default function TablaRow({ fila, posicion, isFirst, isEven }: Props) {
  const difColor =
    fila.dif > 0 ? colors.difPositiva : fila.dif < 0 ? colors.difNegativa : colors.difNeutral

  const difText = fila.dif > 0 ? `+${fila.dif}` : `${fila.dif}`

  const rowBg = isFirst ? colors.primaryLight : isEven ? colors.background : colors.surface

  return (
    <View style={[styles.row, { backgroundColor: rowBg }]}>
      {/* Posición */}
      <View style={styles.colPos}>
        {isFirst ? (
          <MaterialCommunityIcons name="trophy" size={16} color="#F59E0B" />
        ) : (
          <Text style={styles.textSecondary}>{posicion}</Text>
        )}
      </View>

      {/* Equipo */}
      <View style={styles.colEquipo}>
        <Text
          style={[styles.equipoText, isFirst && styles.equipoTextFirst]}
          numberOfLines={1}
        >
          {fila.equipo.nombre}
        </Text>
      </View>

      {/* PJ */}
      <Text style={[styles.colNum, styles.textSecondary]}>{fila.pj}</Text>

      {/* PG */}
      <Text style={[styles.colNum, styles.textSecondary]}>{fila.pg}</Text>

      {/* PE */}
      <Text style={[styles.colNum, styles.textSecondary]}>{fila.pe}</Text>

      {/* PP */}
      <Text style={[styles.colNum, styles.textSecondary]}>{fila.pp}</Text>

      {/* +/- */}
      <Text style={[styles.colNum, { color: difColor, fontWeight: '600' }]}>{difText}</Text>

      {/* GOLES */}
      <Text style={[styles.colGoles, styles.textSecondary]}>
        {fila.gf}:{fila.gc}
      </Text>

      {/* PTS */}
      <Text
        style={[
          styles.colPts,
          isFirst ? styles.ptsFirst : styles.textSecondary,
        ]}
      >
        {fila.pts}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colPos: {
    width: 24,
    alignItems: 'center',
  },
  colEquipo: {
    flex: 1,
    paddingHorizontal: 6,
  },
  colNum: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
  },
  colGoles: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
  },
  colPts: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
  },
  textSecondary: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  equipoText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  equipoTextFirst: {
    fontWeight: '700',
    color: colors.primary,
  },
  ptsFirst: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
})
