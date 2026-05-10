export const MATCH_STAGE_DISPLAY_LABELS = {
  'GRUPO A': 'Grupo A',
  'GRUPO B': 'Grupo B',
  'GRUPO C': 'Grupo C',
  'GRUPO D': 'Grupo D',
  'GRUPO E': 'Grupo E',
  'GRUPO F': 'Grupo F',
  'GRUPO G': 'Grupo G',
  'GRUPO H': 'Grupo H',
  'GRUPO I': 'Grupo I',
  'GRUPO J': 'Grupo J',
  'GRUPO K': 'Grupo K',
  'GRUPO L': 'Grupo L',
  'GROUP A': 'Grupo A',
  'GROUP B': 'Grupo B',
  'GROUP C': 'Grupo C',
  'GROUP D': 'Grupo D',
  'GROUP E': 'Grupo E',
  'GROUP F': 'Grupo F',
  'GROUP G': 'Grupo G',
  'GROUP H': 'Grupo H',
  'GROUP I': 'Grupo I',
  'GROUP J': 'Grupo J',
  'GROUP K': 'Grupo K',
  'GROUP L': 'Grupo L',
  ROUND_OF_32: '16avos',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINALS: 'Cuartos',
  SEMI_FINALS: 'Semifinales',
  THIRD_PLACE_MATCH: 'Tercer puesto',
  FINAL: 'Final',
}

function normalizeStageForLookup(rawStage) {
  if (rawStage === undefined || rawStage === null) {
    return ''
  }

  return String(rawStage).trim().toUpperCase()
}

function normalizeStageForLabelLookup(rawStage) {
  return String(rawStage)
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, ' ')
}

export function getMatchStageLabel(stage) {
  const normalized = normalizeStageForLookup(stage)
  if (!normalized) {
    return 'Fase por confirmar'
  }

  if (MATCH_STAGE_DISPLAY_LABELS[normalized]) {
    return MATCH_STAGE_DISPLAY_LABELS[normalized]
  }

  const spaced = normalizeStageForLabelLookup(normalized)
  if (MATCH_STAGE_DISPLAY_LABELS[spaced]) {
    return MATCH_STAGE_DISPLAY_LABELS[spaced]
  }

  const match = spaced.match(/^(?:GRUPO|GROUP)\s*([A-L])$/)
  if (match?.[1]) {
    return `Grupo ${match[1]}`
  }

  return normalizeStageToHumanReadable(spaced)
}

function normalizeStageToHumanReadable(rawStage) {
  return String(rawStage)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
