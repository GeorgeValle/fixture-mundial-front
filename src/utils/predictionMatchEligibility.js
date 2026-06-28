import {
  ALL_KNOCKOUT_PHASES_VALUE,
  KNOCKOUT_PHASE_OPTIONS,
  KNOCKOUT_PHASE_SHORT_LABELS,
} from '../constants/knockoutPhases'
import { getMatchStageLabel } from '../constants/matchStages'
import { getPredictionStageType } from './predictionScoring'

const PLACEHOLDER_TEAM_PATTERNS = [
  /^tbd$/,
  /^equipo por definir$/,
  /^equipo por confirmar$/,
  /^pending official data$/,
  /^placeholder$/,
  /^ganador partido\b/,
  /^winner of\b/,
  /^winner match\b/,
  /^loser of\b/,
  /^loser match\b/,
]

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getTeamIdentifier(team) {
  return String(team?._id ?? team?.id ?? team?.teamId ?? '').trim()
}

export function isRealPredictionTeam(team) {
  const teamName = normalizeText(team?.name)

  return (
    Boolean(teamName) &&
    !PLACEHOLDER_TEAM_PATTERNS.some((pattern) => pattern.test(teamName))
  )
}

export function isGroupStageMatch(match) {
  return /^grupo\s+[a-l]$/i.test(normalizeText(match?.stage))
}

export function getGroupLetterFromStage(stage) {
  const match = normalizeText(stage).match(/^grupo\s+([a-l])$/i)
  return match ? match[1].toUpperCase() : ''
}

export function getKnockoutPhaseValue(match) {
  const stage = normalizeText(match?.stage ?? match?.round ?? match?.roundKey)

  if (
    stage.includes('round of 32') ||
    stage.includes('dieciseisavos') ||
    stage.includes('ronda de 32') ||
    stage === '16avos' ||
    stage === '16 avos'
  ) {
    return 'round-of-32'
  }

  if (
    stage.includes('round of 16') ||
    stage.includes('octavos') ||
    stage.includes('ronda de 16')
  ) {
    return 'round-of-16'
  }

  if (stage.includes('quarter') || stage.includes('cuartos')) {
    return 'quarter-finals'
  }

  if (stage.includes('semi') || stage.includes('semifinal')) {
    return 'semi-finals'
  }

  if (stage.includes('third place') || stage.includes('tercer puesto')) {
    return 'third-place'
  }

  if (stage === 'final') {
    return 'final'
  }

  return ''
}

export function getKnockoutPhaseLabel(value) {
  return (
    KNOCKOUT_PHASE_OPTIONS.find((option) => option.value === value)?.label ??
    'Todas las fases'
  )
}

export function getPredictionStageBadgeLabel(match) {
  if (getPredictionStageType(match) !== 'knockout') {
    return match?.stage ?? 'Grupo'
  }

  const phaseValue = getKnockoutPhaseValue(match)

  return (
    KNOCKOUT_PHASE_SHORT_LABELS[phaseValue] ??
    getMatchStageLabel(match?.stage ?? match?.round ?? match?.roundKey)
  )
}

export function isEligibleGroupMatch(match) {
  return (
    Boolean(match?._id) &&
    isGroupStageMatch(match) &&
    isRealPredictionTeam(match.homeTeam) &&
    isRealPredictionTeam(match.awayTeam)
  )
}

export function isEligibleKnockoutMatch(match) {
  return (
    getPredictionStageType(match) === 'knockout' &&
    Boolean(match?._id) &&
    Boolean(getKnockoutPhaseValue(match)) &&
    isRealPredictionTeam(match.homeTeam) &&
    isRealPredictionTeam(match.awayTeam) &&
    Boolean(getTeamIdentifier(match.homeTeam)) &&
    Boolean(getTeamIdentifier(match.awayTeam))
  )
}

export function filterKnockoutMatchesByPhase(matches, selectedPhase) {
  if (selectedPhase === ALL_KNOCKOUT_PHASES_VALUE) {
    return matches
  }

  return matches.filter((match) => getKnockoutPhaseValue(match) === selectedPhase)
}
