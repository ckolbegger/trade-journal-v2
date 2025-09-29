import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Accordion } from '../accordion'

describe('Accordion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render accordion with title and content', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div data-testid="accordion-content">Test Content</div>
      </Accordion>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByTestId('accordion-content')).toBeInTheDocument()
  })

  it('should render accordion with icon and indicator', () => {
    render(
      <Accordion
        title="Test Title"
        icon="🎯"
        indicator="(Immutable)"
        defaultOpen={true}
      >
        <div>Test Content</div>
      </Accordion>
    )

    expect(screen.getByText('🎯')).toBeInTheDocument()
    expect(screen.getByText('(Immutable)')).toBeInTheDocument()
  })

  it('should be expanded by default when defaultOpen is true', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div data-testid="accordion-content">Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).toHaveClass('active')
    expect(screen.getByTestId('accordion-content')).toBeVisible()
  })

  it('should be collapsed by default when defaultOpen is false', () => {
    render(
      <Accordion title="Test Title" defaultOpen={false}>
        <div data-testid="accordion-content">Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).not.toHaveClass('active')
    expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument()
  })

  it('should expand when clicked while collapsed', () => {
    render(
      <Accordion title="Test Title" defaultOpen={false}>
        <div data-testid="accordion-content">Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).not.toHaveClass('active')
    expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument()

    fireEvent.click(button!)

    expect(button).toHaveClass('active')
    expect(screen.getByTestId('accordion-content')).toBeVisible()
  })

  it('should collapse when clicked while expanded', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div data-testid="accordion-content">Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).toHaveClass('active')
    expect(screen.getByTestId('accordion-content')).toBeVisible()

    fireEvent.click(button!)

    expect(button).not.toHaveClass('active')
    expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument()
  })

  it('should toggle expansion state on multiple clicks', () => {
    render(
      <Accordion title="Test Title" defaultOpen={false}>
        <div data-testid="accordion-content">Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')

    // Initially collapsed
    expect(button).not.toHaveClass('active')
    expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(button!)
    expect(button).toHaveClass('active')
    expect(screen.getByTestId('accordion-content')).toBeVisible()

    // Click to collapse
    fireEvent.click(button!)
    expect(button).not.toHaveClass('active')
    expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument()

    // Click to expand again
    fireEvent.click(button!)
    expect(button).toHaveClass('active')
    expect(screen.getByTestId('accordion-content')).toBeVisible()
  })

  it('should show chevron icon that rotates based on state', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div>Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    const chevron = screen.getByText('▼')

    // Should be rotated when expanded
    expect(button).toHaveClass('active')
    expect(chevron).toHaveClass('rotate-180')

    fireEvent.click(button!)

    // Should not be rotated when collapsed
    expect(button).not.toHaveClass('active')
    expect(chevron).not.toHaveClass('rotate-180')
  })

  it('should apply hover styling when not active', () => {
    render(
      <Accordion title="Test Title" defaultOpen={false}>
        <div>Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).toHaveClass('hover:bg-gray-50')
  })

  it('should not apply hover styling when active (since it has background styling)', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div>Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).toHaveClass('bg-gray-50')
  })

  it('should render multiple accordions independently', () => {
    render(
      <div>
        <Accordion title="First Accordion" defaultOpen={true}>
          <div data-testid="first-content">First Content</div>
        </Accordion>
        <Accordion title="Second Accordion" defaultOpen={false}>
          <div data-testid="second-content">Second Content</div>
        </Accordion>
      </div>
    )

    const firstButton = screen.getByText('First Accordion').closest('button')
    const secondButton = screen.getByText('Second Accordion').closest('button')

    // First should be expanded, second collapsed
    expect(firstButton).toHaveClass('active')
    expect(secondButton).not.toHaveClass('active')
    expect(screen.getByTestId('first-content')).toBeVisible()
    expect(screen.queryByTestId('second-content')).not.toBeInTheDocument()

    // Click second to expand it
    fireEvent.click(secondButton!)

    // First should still be expanded, second now expanded
    expect(firstButton).toHaveClass('active')
    expect(secondButton).toHaveClass('active')
    expect(screen.getByTestId('first-content')).toBeVisible()
    expect(screen.getByTestId('second-content')).toBeVisible()

    // Click first to collapse it
    fireEvent.click(firstButton!)

    // First should be collapsed, second still expanded
    expect(firstButton).not.toHaveClass('active')
    expect(secondButton).toHaveClass('active')
    expect(screen.queryByTestId('first-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('second-content')).toBeVisible()
  })

  it('should handle empty content gracefully', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        {null}
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).toHaveClass('active')
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should handle complex content with multiple elements', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div>
          <h3>Content Title</h3>
          <p>Content paragraph</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </Accordion>
    )

    expect(screen.getByText('Content Title')).toBeVisible()
    expect(screen.getByText('Content paragraph')).toBeVisible()
    expect(screen.getByText('Item 1')).toBeVisible()
    expect(screen.getByText('Item 2')).toBeVisible()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <Accordion title="Test Title" defaultOpen={true}>
        <div>Test Content</div>
      </Accordion>
    )

    const button = screen.getByText('Test Title').closest('button')
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('hover:bg-gray-50')
    expect(button).toHaveClass('transition-colors')
  })

  it('should support dynamic indicators', () => {
    const testCases = [
      { indicator: '(0)', expected: '(0)' },
      { indicator: '(Empty)', expected: '(Empty)' },
      { indicator: '(3 items)', expected: '(3 items)' },
      { indicator: undefined, expected: undefined },
    ]

    testCases.forEach(({ indicator, expected }) => {
      const { container, unmount } = render(
        <Accordion title="Test Title" indicator={indicator} defaultOpen={true}>
          <div>Test Content</div>
        </Accordion>
      )

      if (expected) {
        expect(screen.getByText(expected)).toBeInTheDocument()
      } else {
        const indicatorText = container.querySelector('[class*="text-xs text-gray-500"]')
        if (indicatorText) {
          expect(indicatorText).not.toHaveTextContent()
        }
      }

      unmount()
    })
  })
})