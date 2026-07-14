/**
 * Types and Interfaces for FIFA World Cup Stats & Stadium Hub
 */

export interface Team {
  name: string;
  code: string;
  flag: string;
}

export interface MatchEvent {
  time: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  player: string;
  teamCode: string;
  detail?: string;
}

export interface Match {
  id: string;
  stage: string;
  group?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'completed';
  minute?: number;
  stadiumId: string;
  date: string;
  time: string;
  spectators?: number;
  events: MatchEvent[];
}

export interface PlayerStats {
  rank: number;
  name: string;
  team: string;
  teamCode: string;
  position: 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper';
  goals: number;
  assists: number;
  matchesPlayed: number;
  minutesPlayed: number;
  rating: number;
}

export interface HistoricalTournament {
  year: number;
  host: string;
  winner: string;
  runnerUp: string;
  goldenBoot: string;
  goldenBootGoals: number;
  totalGoals: number;
  averageAttendance: number;
  stadiumsCount: number;
}

export interface FacilityStatus {
  name: string;
  status: 'Operational' | 'Maintenance' | 'Restricted';
  load: 'Low' | 'Medium' | 'High';
  lastChecked: string;
}

export interface SeatBlock {
  id: string;
  name: string;
  category: 'Category 1' | 'Category 2' | 'Category 3' | 'VIP';
  price: number;
  capacity: number;
  bookedCount: number;
  color: string;
  gateEntrance: string;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  capacity: number;
  currentOccupancy: number;
  roofType: 'Retractable' | 'Open' | 'Closed';
  ingressRate: number; // people per minute
  egressRate: number;  // people per minute
  congestionLevel: 'Low' | 'Moderate' | 'High';
  gates: {
    id: string;
    name: string;
    status: 'Open' | 'Closed' | 'Congested';
    flowRate: number; // people/min
  }[];
  facilities: FacilityStatus[];
  blocks: SeatBlock[];
}

export interface Seat {
  blockId: string;
  row: string;
  number: number;
  status: 'available' | 'booked' | 'selected';
  price: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  type?: 'general' | 'direction' | 'update';
  coordinates?: { x: number; y: number; label: string };
}

export interface TestCaseParameter {
  id: string;
  name: string;
  category: 'Performance' | 'Accessibility' | 'Security' | 'Integration' | 'Data';
  status: 'pending' | 'running' | 'passed' | 'failed';
  score: number;
  log: string;
}
