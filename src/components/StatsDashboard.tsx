import React, { useState, useEffect, useMemo } from 'react';
import { Match, PlayerStats, HistoricalTournament, Stadium, MatchEvent, FacilityStatus } from '../types';
import { INITIAL_MATCHES, INITIAL_PLAYERS, INITIAL_TOURNAMENTS, INITIAL_STADIUMS } from '../data/mockData';
import { Search, Trophy, Users, Shield, Award, Sparkles, Plus, Play, Info, AlertTriangle, Check, Sliders, RefreshCw, Star } from 'lucide-react';

interface StatsDashboardProps {
  stadiumsOverride?: Stadium[];
  onStadiumUpdate?: (stadiums: Stadium[]) => void;
}

export default function StatsDashboard({ stadiumsOverride, onStadiumUpdate }: StatsDashboardProps) {
  // Live matches state
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  
  // Players state
  const [players, setPlayers] = useState<PlayerStats[]>(INITIAL_PLAYERS);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('All');

  // Tournaments state
  const [tournaments, setTournaments] = useState<HistoricalTournament[]>(INITIAL_TOURNAMENTS);
  const [tournamentSearch, setTournamentSearch] = useState('');

  // Stadium management state
  const [stadiums, setStadiums] = useState<Stadium[]>(stadiumsOverride || INITIAL_STADIUMS);

  // Synchronize internal state with override state if provided
  useEffect(() => {
    if (stadiumsOverride) {
      setStadiums(stadiumsOverride);
    }
  }, [stadiumsOverride]);

  // Live match simulator timer (makes the live match tick/update minute and occasionally trigger events)
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches(prev => prev.map(m => {
        if (m.status === 'live' && m.minute !== undefined) {
          const nextMinute = m.minute + 1;
          
          if (nextMinute >= 90) {
            // End the match
            return {
              ...m,
              minute: 90,
              status: 'completed'
            };
          }

          // Random chance of goal during active simulation tick!
          const goalChance = Math.random();
          let homeScore = m.homeScore;
          let awayScore = m.awayScore;
          let events = [...m.events];

          if (goalChance < 0.04) {
            // 4% chance of goal
            const isHome = Math.random() > 0.55;
            const scorer = isHome 
              ? ['Lionel Messi', 'Julián Álvarez', 'Lautaro Martínez'][Math.floor(Math.random() * 3)]
              : ['Kylian Mbappé', 'Antoine Griezmann', 'Olivier Giroud'][Math.floor(Math.random() * 3)];
            
            if (isHome) {
              homeScore += 1;
            } else {
              awayScore += 1;
            }

            const newGoalEvent: MatchEvent = {
              time: nextMinute,
              type: 'goal',
              player: scorer,
              teamCode: isHome ? m.homeTeam.code : m.awayTeam.code,
              detail: isHome ? 'Stunning strike!' : 'Fantastic assist'
            };

            events.push(newGoalEvent);

            // Also update player stat ranking goals dynamically!
            setPlayers(prevPlayers => prevPlayers.map(p => {
              if (p.name === scorer) {
                return { ...p, goals: p.goals + 1 };
              }
              return p;
            }));
          } else if (goalChance > 0.04 && goalChance < 0.08) {
            // Yellow card
            const isHome = Math.random() > 0.5;
            const target = isHome 
              ? ['Enzo Fernández', 'Rodrigo De Paul'][Math.floor(Math.random() * 2)]
              : ['Jules Koundé', 'Theo Hernández'][Math.floor(Math.random() * 2)];

            events.push({
              time: nextMinute,
              type: 'yellow_card',
              player: target,
              teamCode: isHome ? m.homeTeam.code : m.awayTeam.code
            });
          }

          return {
            ...m,
            minute: nextMinute,
            homeScore,
            awayScore,
            events
          };
        }
        return m;
      }));
    }, 12000); // Ticks every 12s for match action simulation

    return () => clearInterval(timer);
  }, []);

  // Manual Match Event simulation triggers (User Interaction)
  const triggerGoalManual = (matchId: string, team: 'home' | 'away') => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const nextMinute = m.minute || 78;
        const isHome = team === 'home';
        const scorerName = isHome 
          ? ['Lionel Messi', 'Julián Álvarez', 'Angel Di Maria'][Math.floor(Math.random() * 3)]
          : ['Kylian Mbappé', 'Marcus Thuram', 'Randal Kolo Muani'][Math.floor(Math.random() * 3)];
        
        const newEvent: MatchEvent = {
          time: nextMinute,
          type: 'goal',
          player: scorerName,
          teamCode: isHome ? m.homeTeam.code : m.awayTeam.code,
          detail: 'Manual simulator trigger'
        };

        // Update player goals
        setPlayers(prevPlayers => prevPlayers.map(p => {
          if (p.name === scorerName) {
            return { ...p, goals: p.goals + 1 };
          }
          return p;
        }));

        return {
          ...m,
          homeScore: isHome ? m.homeScore + 1 : m.homeScore,
          awayScore: !isHome ? m.awayScore + 1 : m.awayScore,
          events: [...m.events, newEvent]
        };
      }
      return m;
    }));
  };

  // Stadium management updates
  const handleToggleGate = (stadiumId: string, gateId: string) => {
    const updated = stadiums.map(st => {
      if (st.id === stadiumId) {
        return {
          ...st,
          gates: st.gates.map(g => {
            if (g.id === gateId) {
              const newStatus = g.status === 'Open' ? 'Closed' : g.status === 'Closed' ? 'Congested' : 'Open';
              return { 
                ...g, 
                status: newStatus as 'Open' | 'Closed' | 'Congested',
                flowRate: newStatus === 'Open' ? 400 : newStatus === 'Congested' ? 120 : 0
              };
            }
            return g;
          })
        };
      }
      return st;
    });

    setStadiums(updated);
    if (onStadiumUpdate) {
      onStadiumUpdate(updated);
    }
  };

  const handleFacilityCheck = (stadiumId: string, facilityName: string) => {
    const updated = stadiums.map(st => {
      if (st.id === stadiumId) {
        return {
          ...st,
          facilities: st.facilities.map(f => {
            if (f.name === facilityName) {
              const nextStatus = f.status === 'Operational' ? 'Maintenance' : 'Operational';
              return {
                ...f,
                status: nextStatus as 'Operational' | 'Maintenance',
                lastChecked: 'Just now'
              };
            }
            return f;
          })
        };
      }
      return st;
    });

    setStadiums(updated);
    if (onStadiumUpdate) {
      onStadiumUpdate(updated);
    }
  };

  // Filtering players list (memoized for efficiency)
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(playerSearch.toLowerCase()) || p.team.toLowerCase().includes(playerSearch.toLowerCase());
      const matchesPosition = playerPositionFilter === 'All' || p.position === playerPositionFilter;
      return matchesSearch && matchesPosition;
    }).sort((a, b) => b.rating - a.rating);
  }, [players, playerSearch, playerPositionFilter]);

  // Filtering historical tournaments list (memoized for efficiency)
  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      return t.host.toLowerCase().includes(tournamentSearch.toLowerCase()) || 
             t.winner.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
             t.year.toString().includes(tournamentSearch);
    });
  }, [tournaments, tournamentSearch]);

  return (
    <div className="flex flex-col gap-6" id="stats-dashboard-view">
      
      {/* 1. Live Match Board */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl" id="live-match-tracker-section">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-bold text-zinc-100 text-base tracking-tight">Live FIFA World Cup Match Centers</h3>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">Real-time goals, bookings, and timeline telemetry simulated automatically.</p>
          </div>
          
          <div className="text-[10px] bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-zinc-400">
            AST TIMING ZONE Active
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {matches.map(match => {
            const isLive = match.status === 'live';
            return (
              <div 
                key={match.id} 
                id={`match-card-${match.id}`}
                className={`lg:col-span-6 bg-zinc-950 border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${
                  isLive ? 'border-red-500/20 bg-gradient-to-b from-zinc-950 to-red-950/5' : 'border-zinc-800/80'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider">{match.stage}</span>
                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE • {match.minute}'
                    </span>
                  ) : match.status === 'completed' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-850 text-zinc-400">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950 border border-zinc-800 text-zinc-400">
                      SCHEDULED • {match.time} AST
                    </span>
                  )}
                </div>

                {/* Score panel */}
                <div className="flex items-center justify-around py-2.5 bg-zinc-900/40 rounded-xl border border-zinc-850 px-4 mb-4">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-1.5 text-center w-5/12">
                    <span className="text-3xl filter drop-shadow">{match.homeTeam.flag}</span>
                    <span className="font-bold text-zinc-100 text-sm truncate max-w-full">{match.homeTeam.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{match.homeTeam.code}</span>
                  </div>

                  {/* VS / SCORE */}
                  <div className="flex flex-col items-center justify-center w-2/12">
                    {match.status !== 'scheduled' ? (
                      <span className="text-2xl font-black text-zinc-100 font-mono tracking-tight">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-zinc-500 font-mono tracking-wide uppercase">VS</span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-1.5 text-center w-5/12">
                    <span className="text-3xl filter drop-shadow">{match.awayTeam.flag}</span>
                    <span className="font-bold text-zinc-100 text-sm truncate max-w-full">{match.awayTeam.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider">{match.awayTeam.code}</span>
                  </div>
                </div>

                {/* Interactive Simulation Controls */}
                {isLive && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 mr-1 uppercase">Simulate Match:</span>
                    <button
                      onClick={() => triggerGoalManual(match.id, 'home')}
                      className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-2 py-1.5 rounded-lg font-bold transition duration-300 flex-1 active:scale-95 cursor-pointer"
                    >
                      Goal {match.homeTeam.code} +
                    </button>
                    <button
                      onClick={() => triggerGoalManual(match.id, 'away')}
                      className="text-[10px] bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-2 py-1.5 rounded-lg font-bold transition duration-300 flex-1 active:scale-95 cursor-pointer"
                    >
                      Goal {match.awayTeam.code} +
                    </button>
                  </div>
                )}

                {/* Events Timeline */}
                {match.events.length > 0 && (
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block mb-2">Match events log:</span>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                      {match.events.map((ev, idx) => (
                        <div key={idx} className="flex items-start justify-between text-xs text-zinc-400 bg-zinc-900/30 px-2.5 py-1.5 rounded-lg border border-zinc-800/60 font-mono">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            <span className="text-[11px] font-black text-amber-500">{ev.time}'</span>
                            <span className="text-[13px]">
                              {ev.type === 'goal' ? '⚽' : ev.type === 'yellow_card' ? '🟨' : ev.type === 'red_card' ? '🟥' : '🔄'}
                            </span>
                            <span className="font-medium text-zinc-300 truncate">{ev.player}</span>
                            {ev.detail && <span className="text-[10px] text-zinc-500">({ev.detail})</span>}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">{ev.teamCode}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Stadium and Facility Management */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl" id="stadium-management-section">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-zinc-100 text-base tracking-tight">World Cup Stadium & Facility Control Center</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Toggle live security gates status, manage dining blocks load, and inspect toilets/clinics.</p>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
            STADIUM LEVEL ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {stadiums.map(st => (
            <div key={st.id} id={`stadium-control-${st.id}`} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm">{st.name}</h4>
                  <span className="text-[10px] text-zinc-400">{st.city} • Capacity {st.capacity.toLocaleString()}</span>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Live Attendance</span>
                  <strong className="text-xs text-zinc-100">
                    {st.currentOccupancy.toLocaleString()} ({Math.round((st.currentOccupancy / st.capacity) * 100)}%)
                  </strong>
                </div>
              </div>

              {/* Ingress / Egress Stats */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="bg-zinc-900/50 rounded-lg p-2 text-center border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono">Ingress Rate</span>
                  <strong className="text-xs text-amber-500">{st.ingressRate} pax/min</strong>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-2 text-center border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono">Egress Rate</span>
                  <strong className="text-xs text-zinc-300">{st.egressRate} pax/min</strong>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-2 text-center border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono">Congestion</span>
                  <strong className={`text-xs block ${
                    st.congestionLevel === 'High' ? 'text-red-400' : st.congestionLevel === 'Moderate' ? 'text-amber-400' : 'text-amber-500'
                  }`}>
                    {st.congestionLevel}
                  </strong>
                </div>
              </div>

              {/* Gate Controls */}
              <div className="mb-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5 font-mono">Gate Status and Flows (Click to toggle):</span>
                <div className="grid grid-cols-2 gap-2">
                  {st.gates.map(gate => (
                    <button
                       key={gate.id}
                       onClick={() => handleToggleGate(st.id, gate.id)}
                       id={`btn-gate-toggle-${st.id}-${gate.id}`}
                       className="flex items-center justify-between text-xs bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      <span className="font-medium text-zinc-300 truncate max-w-[65%]">{gate.name}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                        gate.status === 'Open' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : gate.status === 'Congested'
                          ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {gate.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Concourse Facility Status */}
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5 font-mono">Foyer & Concourse Services (Toggle maintenance):</span>
                <div className="grid grid-cols-2 gap-2">
                  {st.facilities.map((fac, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFacilityCheck(st.id, fac.name)}
                      id={`btn-facility-toggle-${st.id}-${idx}`}
                      className="flex items-center justify-between text-xs bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-left cursor-pointer transition-all duration-300 active:scale-95"
                    >
                      <div className="truncate pr-1">
                        <span className="font-semibold text-zinc-300 block truncate">{fac.name}</span>
                        <span className="text-[9px] text-zinc-500">Checked: {fac.lastChecked}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        fac.status === 'Operational' ? 'bg-amber-500/15 text-amber-500' : fac.status === 'Maintenance' ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {fac.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* 3. Player Stats and Historical Data */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="player-and-historical-stats-row">
        
        {/* Player Rankings Panel */}
        <div className="xl:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-zinc-100 text-base tracking-tight">FIFA World Cup Player Rankings</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Top performing tournament playmakers tracked live.</p>
              </div>

              {/* Search input and select filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-44">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search name..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    id="player-search-input"
                    aria-label="Search players by name"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <select
                  value={playerPositionFilter}
                  onChange={(e) => setPlayerPositionFilter(e.target.value)}
                  id="player-position-filter"
                  aria-label="Filter players by position"
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 py-2 px-2 focus:outline-none"
                >
                  <option value="All">All Positions</option>
                  <option value="Forward">Forwards</option>
                  <option value="Midfielder">Midfielders</option>
                  <option value="Defender">Defenders</option>
                  <option value="Goalkeeper">Goalkeepers</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto" id="player-rankings-table-container">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-2 pl-2">Rank</th>
                    <th className="py-2">Player</th>
                    <th className="py-2">Team</th>
                    <th className="py-2 text-center">G</th>
                    <th className="py-2 text-center">A</th>
                    <th className="py-2 text-center">MP</th>
                    <th className="py-2 text-right pr-2">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => (
                      <tr key={player.rank} id={`player-row-${player.rank}`} className="hover:bg-zinc-950/60 transition-colors">
                        <td className="py-2.5 pl-2 font-bold font-mono text-zinc-400">{player.rank}</td>
                        <td className="py-2.5">
                          <div>
                            <span className="font-bold text-zinc-200 block text-sm">{player.name}</span>
                            <span className="text-[10px] text-zinc-400">{player.position}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-zinc-300 font-medium">
                          <span className="font-mono text-xs text-zinc-400">{player.teamCode}</span> {player.team}
                        </td>
                        <td className="py-2.5 text-center font-bold font-mono text-amber-500">{player.goals}</td>
                        <td className="py-2.5 text-center font-bold font-mono text-zinc-300">{player.assists}</td>
                        <td className="py-2.5 text-center font-mono text-zinc-400">{player.matchesPlayed}</td>
                        <td className="py-2.5 text-right pr-2 font-mono text-amber-400 font-bold">
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline-block" />
                            {player.rating.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400">No matching World Cup playmakers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Historical Tournaments Explorer Panel */}
        <div className="xl:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-zinc-100 text-base tracking-tight">World Cup Tournament Archives</h3>
                <p className="text-zinc-400 text-xs mt-0.5">Explore historic Champions, Golden Boots, and records.</p>
              </div>

              <div className="relative w-full sm:w-44">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search Host / Champ..."
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                  id="tournament-search-input"
                  aria-label="Search tournaments by host or champion"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin" id="historical-tournaments-scroll">
              {filteredTournaments.map(t => (
                <div key={t.year} id={`tournament-card-${t.year}`} className="bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex flex-col justify-between transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1.5">
                    <strong className="text-sm text-zinc-100 font-mono tracking-wide">{t.year} - {t.host}</strong>
                    {t.winner !== 'TBD' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        🏆 Winner: {t.winner}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-500">Active Campaign</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block uppercase font-mono text-[9px]">Runner-up:</span>
                      <span className="font-medium text-zinc-300">{t.runnerUp}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-mono text-[9px]">Golden Boot:</span>
                      <span className="font-medium text-zinc-300">
                        {t.goldenBoot} {t.goldenBootGoals > 0 && `(${t.goldenBootGoals} Goals)`}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-mono text-[9px]">Total Goals:</span>
                      <span className="font-medium text-zinc-300">{t.totalGoals || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase font-mono text-[9px]">Avg Attendance:</span>
                      <span className="font-medium text-zinc-300">{t.averageAttendance.toLocaleString()} pax</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
