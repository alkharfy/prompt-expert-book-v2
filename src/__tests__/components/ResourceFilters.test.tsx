// Tests for ResourceFilters component
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResourceFilters from '@/components/resources/ResourceFilters'

const defaultProps = {
  activeCategory: 'all',
  activeSpecialization: 'all',
  activeLevel: 'all',
  searchQuery: '',
  showSaved: false,
  isLoggedIn: true,
  onCategoryChange: vi.fn(),
  onSpecializationChange: vi.fn(),
  onLevelChange: vi.fn(),
  onSearchChange: vi.fn(),
  onSavedToggle: vi.fn(),
}

describe('ResourceFilters', () => {
  it('should render the search input', () => {
    render(<ResourceFilters {...defaultProps} />)
    expect(screen.getByPlaceholderText('ابحث عن مصدر...')).toBeInTheDocument()
  })

  it('should render all 8 category buttons', () => {
    render(<ResourceFilters {...defaultProps} />)
    const categoryLabels = ['الكل', 'أدوات AI', 'دورات', 'مقالات', 'فيديوهات', 'قوالب', 'كتب', 'مجتمعات']
    categoryLabels.forEach((label) => {
      expect(screen.getByText(new RegExp(label))).toBeInTheDocument()
    })
  })

  it('should render specialization dropdown with 6 options', () => {
    render(<ResourceFilters {...defaultProps} />)
    const specOptions = ['كل التخصصات', 'عام', 'برمجة', 'تجارة إلكترونية', 'تصميم', 'تسويق']
    specOptions.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it('should render level dropdown with 4 options', () => {
    render(<ResourceFilters {...defaultProps} />)
    const levelOptions = ['كل المستويات', 'مبتدئ', 'متوسط', 'متقدم']
    levelOptions.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it('should render saved toggle button when logged in', () => {
    render(<ResourceFilters {...defaultProps} />)
    expect(screen.getByText(/المحفوظات/)).toBeInTheDocument()
  })

  it('should NOT render saved toggle when not logged in', () => {
    render(<ResourceFilters {...defaultProps} isLoggedIn={false} />)
    expect(screen.queryByText(/المحفوظات/)).not.toBeInTheDocument()
  })

  it('should call onSearchChange when typing in search', () => {
    const onSearchChange = vi.fn()
    render(<ResourceFilters {...defaultProps} onSearchChange={onSearchChange} />)
    fireEvent.change(screen.getByPlaceholderText('ابحث عن مصدر...'), { target: { value: 'ChatGPT' } })
    expect(onSearchChange).toHaveBeenCalledWith('ChatGPT')
  })

  it('should call onCategoryChange when clicking a category', () => {
    const onCategoryChange = vi.fn()
    render(<ResourceFilters {...defaultProps} onCategoryChange={onCategoryChange} />)
    fireEvent.click(screen.getByText(/أدوات AI/))
    expect(onCategoryChange).toHaveBeenCalledWith('tool')
  })

  it('should call onCategoryChange("all") when clicking الكل', () => {
    const onCategoryChange = vi.fn()
    render(<ResourceFilters {...defaultProps} activeCategory="tool" onCategoryChange={onCategoryChange} />)
    fireEvent.click(screen.getByText(/الكل/))
    expect(onCategoryChange).toHaveBeenCalledWith('all')
  })

  it('should call onSpecializationChange when selecting specialization', () => {
    const onSpecializationChange = vi.fn()
    render(<ResourceFilters {...defaultProps} onSpecializationChange={onSpecializationChange} />)
    
    const selects = screen.getAllByRole('combobox')
    // First combobox is specialization
    fireEvent.change(selects[0], { target: { value: 'programming' } })
    expect(onSpecializationChange).toHaveBeenCalledWith('programming')
  })

  it('should call onLevelChange when selecting level', () => {
    const onLevelChange = vi.fn()
    render(<ResourceFilters {...defaultProps} onLevelChange={onLevelChange} />)
    
    const selects = screen.getAllByRole('combobox')
    // Second combobox is level
    fireEvent.change(selects[1], { target: { value: 'advanced' } })
    expect(onLevelChange).toHaveBeenCalledWith('advanced')
  })

  it('should call onSavedToggle when clicking saved button', () => {
    const onSavedToggle = vi.fn()
    render(<ResourceFilters {...defaultProps} onSavedToggle={onSavedToggle} />)
    fireEvent.click(screen.getByText(/المحفوظات/))
    expect(onSavedToggle).toHaveBeenCalledTimes(1)
  })

  it('should show 💛 when showSaved is true', () => {
    render(<ResourceFilters {...defaultProps} showSaved={true} />)
    expect(screen.getByText(/💛/)).toBeInTheDocument()
  })

  it('should show 🤍 when showSaved is false', () => {
    render(<ResourceFilters {...defaultProps} showSaved={false} />)
    expect(screen.getByText(/🤍/)).toBeInTheDocument()
  })

  it('should display current search query value', () => {
    render(<ResourceFilters {...defaultProps} searchQuery="test query" />)
    const input = screen.getByPlaceholderText('ابحث عن مصدر...') as HTMLInputElement
    expect(input.value).toBe('test query')
  })
})
