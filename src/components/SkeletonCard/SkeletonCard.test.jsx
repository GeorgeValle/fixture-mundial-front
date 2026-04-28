import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkeletonCard from './SkeletonCard'

describe('SkeletonCard', () => {
  it('renders as an accessible loading placeholder', () => {
    render(<SkeletonCard lines={2} variant="large" />)

    expect(screen.getByLabelText('Cargando contenido')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })
})
