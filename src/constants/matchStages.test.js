import { describe, expect, it } from 'vitest'
import { getMatchStageLabel } from './matchStages'

describe('match stage labels', () => {
  const cases = [
    ['GROUP_A', 'Grupo A'],
    ['GRUPO A', 'Grupo A'],
    ['GROUP_B', 'Grupo B'],
    ['GRUPO_B', 'Grupo B'],
    ['GROUP_C', 'Grupo C'],
    ['GRUPO C', 'Grupo C'],
    ['GROUP_D', 'Grupo D'],
    ['GRUPO D', 'Grupo D'],
    ['GROUP_E', 'Grupo E'],
    ['GRUPO E', 'Grupo E'],
    ['GROUP_F', 'Grupo F'],
    ['GRUPO F', 'Grupo F'],
    ['GROUP_G', 'Grupo G'],
    ['GRUPO G', 'Grupo G'],
    ['GROUP_H', 'Grupo H'],
    ['GRUPO_H', 'Grupo H'],
    ['GROUP_I', 'Grupo I'],
    ['GRUPO I', 'Grupo I'],
    ['GROUP_J', 'Grupo J'],
    ['GRUPO J', 'Grupo J'],
    ['GROUP_K', 'Grupo K'],
    ['GRUPO_K', 'Grupo K'],
    ['GROUP_L', 'Grupo L'],
    ['GRUPO L', 'Grupo L'],
    ['ROUND_OF_32', '16avos'],
    ['ROUND_OF_16', 'Octavos'],
    ['QUARTER_FINALS', 'Cuartos'],
    ['SEMI_FINALS', 'Semifinales'],
    ['THIRD_PLACE', 'Tercer puesto'],
    ['THIRD_PLACE_MATCH', 'Tercer puesto'],
    ['FINAL', 'Final'],
  ]

  it.each(cases)('maps %s to %s', (value, label) => {
    expect(getMatchStageLabel(value)).toBe(label)
  })

  it('humanizes unknown stages safely', () => {
    expect(getMatchStageLabel('custom_stage_name')).toBe('Custom Stage Name')
    expect(getMatchStageLabel(undefined)).toBe('Fase por confirmar')
  })
})
