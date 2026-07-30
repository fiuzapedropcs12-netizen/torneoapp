import type { RondaEliminatoria } from '@/types/torneo'

export const RONDAS_ELIMINATORIA: { id: RondaEliminatoria; label: string; equipos: number }[] = [
  { id: 'octavos', label: 'Octavos de Final', equipos: 16 },
  { id: 'cuartos', label: 'Cuartos de Final', equipos: 8 },
  { id: 'semifinal', label: 'Semifinal', equipos: 4 },
  { id: 'final', label: 'Final', equipos: 2 },
]

export const LABEL_RONDA: Record<RondaEliminatoria, string> = {
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semifinal: 'Semifinal',
  final: 'Final',
}

export const EQUIPOS_POR_RONDA: Record<RondaEliminatoria, number> = {
  octavos: 16,
  cuartos: 8,
  semifinal: 4,
  final: 2,
}
