import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsDashboard from './StatsDashboard';
import StadiumMap from './StadiumMap';
import AIBot from './AIBot';

// Mock scrollIntoView which is missing in jsdom
beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }
});

describe('FIFA Pro Core Components Suite', () => {
  it('renders the Stats Dashboard correctly', () => {
    render(<StatsDashboard />);
    expect(screen.getByText(/Live FIFA World Cup Match Centers/i)).toBeInTheDocument();
    expect(screen.getByText(/World Cup Stadium & Facility Control Center/i)).toBeInTheDocument();
  });

  it('renders StadiumMap component and interactive seating legend', () => {
    render(<StadiumMap />);
    expect(screen.getByText(/Interactive Arena Seating Blueprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Category tier/i)).toBeInTheDocument();
  });

  it('renders the AIBot helper component', () => {
    render(<AIBot onNavigateToSeat={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Ask fifa guider/i)).toBeInTheDocument();
    expect(screen.getAllByText(/fifa guider/i).length).toBeGreaterThan(0);
  });
});
