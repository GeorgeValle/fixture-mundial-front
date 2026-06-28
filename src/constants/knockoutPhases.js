export const ALL_KNOCKOUT_PHASES_VALUE = 'all'

export const KNOCKOUT_PHASE_OPTIONS = [
  { value: ALL_KNOCKOUT_PHASES_VALUE, label: 'Todas las fases' },
  { value: 'round-of-32', label: 'Dieciseisavos de final' },
  { value: 'round-of-16', label: 'Octavos de final' },
  { value: 'quarter-finals', label: 'Cuartos de final' },
  { value: 'semi-finals', label: 'Semifinales' },
  { value: 'third-place', label: 'Partido por el tercer puesto' },
  { value: 'final', label: 'Final' },
]

export const KNOCKOUT_PHASE_SHORT_LABELS = {
  'round-of-32': '16avos',
  'round-of-16': 'Octavos',
  'quarter-finals': 'Cuartos',
  'semi-finals': 'Semifinales',
  'third-place': 'Tercer puesto',
  final: 'Final',
}
