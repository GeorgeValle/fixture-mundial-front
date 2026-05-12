import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import * as adminTeamsService from './adminTeamsService'

const team = {
  _id: 'team-1',
  name: 'Argentina',
  group: 'A',
  shieldUrl: 'https://example.com/argentina.svg',
  position: 1,
  qualifiedTo: 'ROUND_OF_32',
}

describe('adminTeamsService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads teams through GET /api/teams with credentials', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({ data: [team] })

    await expect(adminTeamsService.getAdminTeams()).resolves.toEqual([team])

    expect(getSpy).toHaveBeenCalledWith('/api/teams', { withCredentials: true })
  })

  it('normalizes wrapped teams responses', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: {
        status: 'success',
        data: [{ ...team, shieldUrl: null, flagUrl: 'https://example.com/legacy.svg' }],
      },
    })

    await expect(adminTeamsService.getAdminTeams()).resolves.toEqual([
      expect.objectContaining({
        _id: 'team-1',
        shieldUrl: 'https://example.com/legacy.svg',
      }),
    ])
    expect(getSpy).toHaveBeenCalledWith('/api/teams', { withCredentials: true })
  })

  it('updates team corrections with PUT /api/teams/:id and credentials', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValue({ data: { status: 'success' } })
    const postSpy = vi.spyOn(axiosClient, 'post')

    await expect(adminTeamsService.updateAdminTeamCorrection('team-1', {
      position: 2,
      qualifiedTo: 'ROUND_OF_16',
      shieldUrl: 'https://example.com/new.svg',
    })).resolves.toEqual({ status: 'success' })

    expect(putSpy).toHaveBeenCalledWith(
      '/api/teams/team-1',
      {
        position: 2,
        qualifiedTo: 'ROUND_OF_16',
        shieldUrl: 'https://example.com/new.svg',
      },
      { withCredentials: true },
    )
    expect(putSpy.mock.calls[0][0]).not.toContain('/api/admin/teams')
    expect(postSpy).not.toHaveBeenCalled()
  })

  it('sends a clean partial payload without empty strings', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValue({ data: { status: 'success' } })

    await adminTeamsService.updateAdminTeamCorrection('team-1', {
      position: '',
      qualifiedTo: 'ELIMINATED',
      shieldUrl: '',
    })

    expect(putSpy).toHaveBeenCalledWith(
      '/api/teams/team-1',
      { qualifiedTo: 'ELIMINATED' },
      { withCredentials: true },
    )
  })

  it('rejects an empty payload before calling the backend', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put')

    await expect(adminTeamsService.updateAdminTeamCorrection('team-1', {
      position: '',
      shieldUrl: '',
    })).rejects.toMatchObject({
      source: 'adminTeamsService',
      message: 'No hay cambios válidos para guardar.',
    })
    expect(putSpy).not.toHaveBeenCalled()
  })

  it('rejects blocked fields and never sends full team data', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put')

    await expect(adminTeamsService.updateAdminTeamCorrection('team-1', {
      name: 'Otro nombre',
      group: 'B',
      confederation: 'CONMEBOL',
      _id: 'team-2',
      standings: [],
      slots: [],
      matches: [],
      qualifiedTo: 'ROUND_OF_32',
    })).rejects.toMatchObject({
      source: 'adminTeamsService',
      message: 'La corrección solo permite position, qualifiedTo y shieldUrl.',
    })
    expect(putSpy).not.toHaveBeenCalled()
  })

  it('rejects legacy qualifiedTo values as new payload', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put')

    await expect(adminTeamsService.updateAdminTeamCorrection('team-1', {
      qualifiedTo: '16AVOS',
    })).rejects.toMatchObject({
      message: 'Seleccioná una clasificación válida.',
    })
    expect(putSpy).not.toHaveBeenCalled()
  })

  it('surfaces backend errors', async () => {
    vi.spyOn(axiosClient, 'put').mockRejectedValue({
      source: 'axiosClient',
      message: 'No autorizado',
      status: 403,
    })

    await expect(adminTeamsService.updateAdminTeamCorrection('team-1', {
      qualifiedTo: 'ROUND_OF_32',
    })).rejects.toMatchObject({
      message: 'No autorizado',
      status: 403,
    })
  })

  it('does not expose create or delete helpers', () => {
    expect(adminTeamsService.createTeam).toBeUndefined()
    expect(adminTeamsService.deleteTeam).toBeUndefined()
    expect(adminTeamsService.createAdminTeam).toBeUndefined()
    expect(adminTeamsService.removeTeam).toBeUndefined()
    expect(adminTeamsService.postTeam).toBeUndefined()
  })
})
