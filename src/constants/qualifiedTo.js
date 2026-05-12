export const QUALIFIED_TO = {
  roundOf32: 'ROUND_OF_32',
  roundOf16: 'ROUND_OF_16',
  quarterFinals: 'QUARTER_FINALS',
  semiFinals: 'SEMI_FINALS',
  thirdPlaceMatch: 'THIRD_PLACE_MATCH',
  final: 'FINAL',
  eliminated: 'ELIMINATED',
}

export const QUALIFIED_TO_VALUES = Object.values(QUALIFIED_TO)

export const QUALIFIED_TO_NULL_VALUE = '__NULL__'

export const QUALIFIED_TO_LABELS = {
  [QUALIFIED_TO.roundOf32]: '16avos',
  [QUALIFIED_TO.roundOf16]: 'Octavos',
  [QUALIFIED_TO.quarterFinals]: 'Cuartos',
  [QUALIFIED_TO.semiFinals]: 'Semifinales',
  [QUALIFIED_TO.thirdPlaceMatch]: 'Tercer puesto',
  [QUALIFIED_TO.final]: 'Final',
  [QUALIFIED_TO.eliminated]: 'Eliminado',
  [QUALIFIED_TO_NULL_VALUE]: 'Sin clasificación asignada',
}

export const LEGACY_QUALIFIED_TO_LABELS = {
  '16AVOS': '16avos (legacy)',
  OCTAVOS: 'Octavos (legacy)',
  CUARTOS: 'Cuartos (legacy)',
  SEMIFINAL: 'Semifinales (legacy)',
  '3RO': 'Tercer puesto (legacy)',
  ELIMINADO: 'Eliminado (legacy)',
}

export const QUALIFIED_TO_OPTIONS = [
  { value: QUALIFIED_TO_NULL_VALUE, label: QUALIFIED_TO_LABELS[QUALIFIED_TO_NULL_VALUE] },
  ...QUALIFIED_TO_VALUES.map((value) => ({ value, label: QUALIFIED_TO_LABELS[value] })),
]

export function getQualifiedToLabel(value) {
  if (value === null || value === undefined || value === '') {
    return QUALIFIED_TO_LABELS[QUALIFIED_TO_NULL_VALUE]
  }

  return QUALIFIED_TO_LABELS[value] ?? LEGACY_QUALIFIED_TO_LABELS[value] ?? String(value)
}

export function isCanonicalQualifiedTo(value) {
  return value === null || QUALIFIED_TO_VALUES.includes(value)
}

export function toQualifiedToSelectValue(value) {
  return value === null || value === undefined ? QUALIFIED_TO_NULL_VALUE : String(value)
}

export function fromQualifiedToSelectValue(value) {
  return value === QUALIFIED_TO_NULL_VALUE ? null : value
}
