import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkeletonList from './SkeletonList'

describe('SkeletonList', () => {
  it('renders the requested amount of skeleton cards', () => {
    render(<SkeletonList count={4} label="Cargando partidos" />)

    expect(screen.getByRole('status', { name: 'Cargando partidos' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Cargando contenido')).toHaveLength(4)
  })
})
