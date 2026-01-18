import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpModal } from './HelpModal';

describe('HelpModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal title', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText('ui.helpModal.title')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<HelpModal {...defaultProps} />);

    const closeButton = screen.getByText('✕');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<HelpModal {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders game flow section', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText('ui.helpModal.gameFlow.title')).toBeInTheDocument();
  });

  it('renders game flow instructions', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText(/ui\.helpModal\.gameFlow\.assignRoles/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.gameFlow\.distributeRoles/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.gameFlow\.phaseSwitch/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.gameFlow\.nightActions/)).toBeInTheDocument();
  });

  it('renders grimoire operations section', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText('ui.helpModal.grimoireOps.title')).toBeInTheDocument();
  });

  it('renders grimoire operation instructions', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText(/ui\.helpModal\.grimoireOps\.rightClickMenu/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.grimoireOps\.statusManagement/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.grimoireOps\.addMarkers/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.grimoireOps\.virtualPlayers/)).toBeInTheDocument();
  });

  it('renders atmosphere features section', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText('ui.helpModal.atmosphere.title')).toBeInTheDocument();
  });

  it('renders atmosphere feature instructions', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText(/ui\.helpModal\.atmosphere\.ambientSound/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.atmosphere\.notebook/)).toBeInTheDocument();
    expect(screen.getByText(/ui\.helpModal\.atmosphere\.aiAssistant/)).toBeInTheDocument();
  });

  it('renders tip section', () => {
    render(<HelpModal {...defaultProps} />);

    expect(screen.getByText('ui.helpModal.tip')).toBeInTheDocument();
  });

  it('renders in embedded mode without close button', () => {
    render(<HelpModal {...defaultProps} embedded={true} />);

    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('renders in embedded mode without title', () => {
    render(<HelpModal {...defaultProps} embedded={true} />);

    expect(screen.queryByText('ui.helpModal.title')).not.toBeInTheDocument();
  });

  it('renders content in embedded mode', () => {
    render(<HelpModal {...defaultProps} embedded={true} />);

    expect(screen.getByText('ui.helpModal.gameFlow.title')).toBeInTheDocument();
    expect(screen.getByText('ui.helpModal.grimoireOps.title')).toBeInTheDocument();
    expect(screen.getByText('ui.helpModal.atmosphere.title')).toBeInTheDocument();
  });

  it('renders with backdrop in non-embedded mode', () => {
    const { container } = render(<HelpModal {...defaultProps} />);

    const backdrop = container.querySelector('[class*="fixed"][class*="z-"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('does not render backdrop in embedded mode', () => {
    const { container } = render(<HelpModal {...defaultProps} embedded={true} />);

    const backdrop = container.querySelector('[class*="fixed"][class*="z-"]');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('renders section icons', () => {
    render(<HelpModal {...defaultProps} />);

    // Check that sections have colored highlights - the span contains amber-700
    const gameFlowSection = screen.getByText('ui.helpModal.gameFlow.title');
    const sectionSpan = gameFlowSection.parentElement?.querySelector('[class*="text-amber-"]');
    expect(sectionSpan).toBeInTheDocument();
  });

  it('renders all instruction items as list items', () => {
    render(<HelpModal {...defaultProps} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('renders HTML content in instructions', () => {
    render(<HelpModal {...defaultProps} />);

    // Instructions use dangerouslySetInnerHTML, so they should render
    const content = screen.getByText(/ui\.helpModal\.gameFlow\.assignRoles/);
    expect(content).toBeInTheDocument();
  });

  it('has scrollable content area', () => {
    const { container } = render(<HelpModal {...defaultProps} />);

    // The scrollable area is the div with p-6 and overflow-y-auto classes
    const scrollableArea = container.querySelector('[class*="overflow-y-auto"]');
    expect(scrollableArea).toBeInTheDocument();
  });

  it('renders tip with distinct styling', () => {
    render(<HelpModal {...defaultProps} />);

    const tip = screen.getByText('ui.helpModal.tip');
    const tipContainer = tip.closest('div');
    expect(tipContainer?.className).toContain('bg-stone-950');
    expect(tipContainer?.className).toContain('italic');
  });
});
