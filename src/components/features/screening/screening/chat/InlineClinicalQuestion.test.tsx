/**
 * InlineClinicalQuestion Component Tests
 *
 * CRITICAL: These tests prevent the bug where multi-choice questions
 * were showing as text input boxes instead of checkboxes.
 */

import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import { InlineClinicalQuestion } from './InlineClinicalQuestion'

describe('InlineClinicalQuestion', () => {
  describe('multiple-choice type (multi-select)', () => {
    const mockOptions = [
      { value: 'walking', label: 'Walking' },
      { value: 'stairs', label: 'Going up stairs' },
      { value: 'squatting', label: 'Squatting' },
    ]

    it('renders checkboxes for all options (NOT text input)', () => {
      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          allowMultiple={true}
        />
      )

      // CRITICAL: Should NOT show text input
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText(/type/i)).not.toBeInTheDocument()

      // Should show all options as clickable buttons
      expect(screen.getByText('Walking')).toBeInTheDocument()
      expect(screen.getByText('Going up stairs')).toBeInTheDocument()
      expect(screen.getByText('Squatting')).toBeInTheDocument()
    })

    it('displays the question text', () => {
      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          allowMultiple={true}
        />
      )

      expect(screen.getByText('What makes your pain worse?')).toBeInTheDocument()
    })

    it('allows selecting multiple options', () => {
      const mockOnChange = jest.fn()

      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={[]}
          onChange={mockOnChange}
          allowMultiple={true}
        />
      )

      // Click first option
      fireEvent.click(screen.getByText('Walking'))
      expect(mockOnChange).toHaveBeenCalledWith(['walking'])

      // Render again with first option selected
      mockOnChange.mockClear()
      const { rerender } = render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={['walking']}
          onChange={mockOnChange}
          allowMultiple={true}
        />
      )

      // Click second option - should add to array
      fireEvent.click(screen.getByText('Squatting'))
      expect(mockOnChange).toHaveBeenCalledWith(['walking', 'squatting'])
    })

    it('allows deselecting options', () => {
      const mockOnChange = jest.fn()

      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={['walking', 'stairs']}
          onChange={mockOnChange}
          allowMultiple={true}
        />
      )

      // Click already selected option to deselect
      fireEvent.click(screen.getByText('Walking'))
      expect(mockOnChange).toHaveBeenCalledWith(['stairs'])
    })

    it('shows Continue button when allowMultiple is true', () => {
      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={[]}
          onChange={jest.fn()}
          onSubmit={jest.fn()}
          allowMultiple={true}
        />
      )

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('calls onSubmit when Continue button is clicked', () => {
      const mockOnSubmit = jest.fn()

      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={mockOptions}
          value={['walking']}
          onChange={jest.fn()}
          onSubmit={mockOnSubmit}
          allowMultiple={true}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /continue/i }))
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })
  })

  describe('yes-no type', () => {
    it('renders Yes and No buttons', () => {
      render(
        <InlineClinicalQuestion
          question="Does your pain travel?"
          type="yes-no"
          value=""
          onChange={jest.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
    })

    it('calls onChange and onSubmit when Yes is clicked', () => {
      const mockOnChange = jest.fn()
      const mockOnSubmit = jest.fn()

      render(
        <InlineClinicalQuestion
          question="Does your pain travel?"
          type="yes-no"
          value=""
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /yes/i }))

      expect(mockOnChange).toHaveBeenCalledWith('yes')
      // onSubmit should be called after a delay
      setTimeout(() => {
        expect(mockOnSubmit).toHaveBeenCalled()
      }, 400)
    })
  })

  describe('vas-slider type', () => {
    it('renders slider with value display', () => {
      render(
        <InlineClinicalQuestion
          question="Rate your pain 0-10"
          type="vas-slider"
          value={5}
          onChange={jest.fn()}
        />
      )

      // Should show slider
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()

      // Should show value
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('updates value when slider is moved', () => {
      const mockOnChange = jest.fn()

      render(
        <InlineClinicalQuestion
          question="Rate your pain 0-10"
          type="vas-slider"
          value={5}
          onChange={mockOnChange}
        />
      )

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '7' } })

      expect(mockOnChange).toHaveBeenCalledWith(7)
    })

    it('shows Continue button', () => {
      render(
        <InlineClinicalQuestion
          question="Rate your pain 0-10"
          type="vas-slider"
          value={5}
          onChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })
  })

  describe('text type', () => {
    it('renders textarea input', () => {
      render(
        <InlineClinicalQuestion
          question="Describe your symptoms"
          type="text"
          value=""
          onChange={jest.fn()}
        />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
    })

    it('updates value on input', () => {
      const mockOnChange = jest.fn()

      render(
        <InlineClinicalQuestion
          question="Describe your symptoms"
          type="text"
          value=""
          onChange={mockOnChange}
        />
      )

      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Sharp pain in knee' } })

      expect(mockOnChange).toHaveBeenCalledWith('Sharp pain in knee')
    })

    it('shows Continue button when onSubmit provided', () => {
      render(
        <InlineClinicalQuestion
          question="Describe your symptoms"
          type="text"
          value="test"
          onChange={jest.fn()}
          onSubmit={jest.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('disables all interactions when disabled prop is true', () => {
      render(
        <InlineClinicalQuestion
          question="What makes your pain worse?"
          type="multiple-choice"
          options={[{ value: 'test', label: 'Test' }]}
          value={[]}
          onChange={jest.fn()}
          disabled={true}
        />
      )

      const button = screen.getByText('Test')
      expect(button).toHaveClass('cursor-not-allowed')
    })
  })
})
