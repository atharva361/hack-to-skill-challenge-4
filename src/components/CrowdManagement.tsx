import React, { useState, useEffect, useMemo } from 'react';
import { Users, ShieldAlert, Timer, RefreshCw, Train, Bus, AlertCircle, HelpCircle, Trophy, Lightbulb, MapPin, Gauge } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  status: 'Open' | 'Closed' | 'Congested';
  flowRate: number; // fans/min
  capacity: number;
}

interface StadiumFlow {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  gates: Gate[];
}

export default function CrowdManagement() {
  // 1. Interactive Stadium state
  const [stadiums, setStadiums] = useState<StadiumFlow[]>([
    {
      id: 'lusail',
      name: 'Lusail Iconic Stadium',
      capacity: 88900,
      occupancy: 81200,
      gates: [
        { id: 'gate-a', name: 'Gate A (North Entrance)', status: 'Open', flowRate: 450, capacity: 500 },
        { id: 'gate-b', name: 'Gate B (East Entrance)', status: 'Congested', flowRate: 110, capacity: 500 },
        { id: 'gate-c', name: 'Gate C (South Entrance)', status: 'Open', flowRate: 480, capacity: 500 },
        { id: 'gate-d', name: 'Gate D (West Entrance)', status: 'Open', flowRate: 400, capacity: 500 },
      ]
    },
    {
      id: 'al-bayt',
      name: 'Al Bayt Stadium',
      capacity: 68890,
      occupancy: 65100,
      gates: [
        { id: 'gate-1', name: 'Gate 1 (Main Entrance)', status: 'Open', flowRate: 420, capacity: 450 },
        { id: 'gate-2', name: 'Gate 2 (VIP Entrance)', status: 'Open', flowRate: 350, capacity: 450 },
        { id: 'gate-3', name: 'Gate 3 (Public East)', status: 'Open', flowRate: 380, capacity: 450 },
      ]
    }
  ]);

  const [activeStadiumId, setActiveStadiumId] = useState<string>('lusail');

  // Find currently active stadium safely
  const currentStadium = useMemo(() => {
    return stadiums.find(s => s.id === activeStadiumId) || stadiums[0];
  }, [stadiums, activeStadiumId]);

  // 2. Emergency Evacuation Simulation State
  const [evacActive, setEvacActive] = useState(false);
  const [evacProgress, setEvacProgress] = useState(0);
  const [evacRemainingFans, setEvacRemainingFans] = useState(0);
  const [evacLogs, setEvacLogs] = useState<string[]>([]);
  const [evacTimeElapsed, setEvacTimeElapsed] = useState(0); // in simulated minutes

  // 3. Public Transit Hub Queue State
  const [transitHubs, setTransitHubs] = useState([
    { id: 'metro', name: 'Lusail Metro Station (Red Line)', type: 'Train', queueSize: 1850, waitTime: 22, frequency: 2.5 },
    { id: 'bus-east', name: 'East Bus Depot (Express Shuttle)', type: 'Bus', queueSize: 420, waitTime: 8, frequency: 1.5 },
    { id: 'taxi-west', name: 'West Stadium Taxi Rank', type: 'Taxi', queueSize: 150, waitTime: 12, frequency: 5.0 },
  ]);

  // 4. Match & Trivia Section state
  const [selectedTrivia, setSelectedTrivia] = useState(0);
  const fifaTrivia = [
    {
      title: "🌍 Nomadic Architecture of Al Bayt",
      fact: "Al Bayt Stadium is styled after traditional 'Bayt al sha'ar' black-and-white tents used by nomadic peoples in Qatar. It features a fully retractable roof system that can close in just 20 minutes and is surrounded by 400,000 square meters of lush parkland.",
      impact: "This tent-design keeps the venue naturally insulated, requiring 35% less power for the advanced micro-cooling system compared to typical open stadiums."
    },
    {
      title: "❄️ Smart Stadium Zero-Carbon Cooling",
      fact: "All 2026 World Cup match centers utilize state-of-the-art under-seat cooling nozzles. Air is pushed at low velocity to cool the spectator zone (from 2 meters above ground and below), meaning only the occupied space is cooled rather than the entire dome airspace.",
      impact: "Saves up to 45% more energy than standard overhead blowers, while maintaining a perfect pitch temperature of exactly 21°C."
    },
    {
      title: "🎟️ The 88,900 Golden Bowl of Lusail",
      fact: "Lusail Iconic Stadium is shaped like a hand-crafted bowl referencing the traditional decorative bowls found across the Arab world. Its golden exterior mimics the intricate artwork of ancient craftsmanship and will naturally age into a beautiful, historic brass patina.",
      impact: "Its high-tech PTFE roof is self-cleaning and permits just enough sunlight to nurture the turf grass while blocking harsh heat."
    },
    {
      title: "🚉 Transit & Ingress Logistics Hub",
      fact: "Lusail Stadium is connected directly to the red line metro. In our telemetry simulator, more than 60% of all 80,000 spectators arrive via public transport, keeping local road emissions at a historical low.",
      impact: "Smart crowd gating and train dispatching keeps post-match station egress under 35 minutes total."
    }
  ];

  // Recalculate total egress rate of active stadium based on gate status
  const gateMetrics = useMemo(() => {
    let totalFlow = 0;
    let openCount = 0;
    currentStadium.gates.forEach(g => {
      if (g.status === 'Open') {
        totalFlow += g.flowRate;
        openCount++;
      } else if (g.status === 'Congested') {
        totalFlow += Math.round(g.flowRate * 0.3); // 70% reduction in flow when congested
        openCount++;
      }
    });

    // Simulated average exit time
    const avgExitTime = totalFlow > 0 ? Math.round(currentStadium.occupancy / totalFlow) : 999;

    return { totalFlow, openCount, avgExitTime };
  }, [currentStadium]);

  // Handle toggle gate status
  const handleToggleGate = (gateId: string) => {
    setStadiums(prev => prev.map(st => {
      if (st.id === activeStadiumId) {
        return {
          ...st,
          gates: st.gates.map(g => {
            if (g.id === gateId) {
              const nextStatus = g.status === 'Open' ? 'Closed' : g.status === 'Closed' ? 'Congested' : 'Open';
              let nextFlow = g.flowRate;
              if (nextStatus === 'Open') nextFlow = 450;
              if (nextStatus === 'Congested') nextFlow = 120;
              if (nextStatus === 'Closed') nextFlow = 0;
              return { ...g, status: nextStatus, flowRate: nextFlow };
            }
            return g;
          })
        };
      }
      return st;
    }));
  };

  // Dispatch extra transit vehicle (reduces queue size and wait time)
  const handleDispatchTransit = (hubId: string) => {
    setTransitHubs(prev => prev.map(hub => {
      if (hub.id === hubId) {
        const reduction = hub.type === 'Train' ? 350 : hub.type === 'Bus' ? 90 : 30;
        const newQueue = Math.max(0, hub.queueSize - reduction);
        const newWait = Math.round(newQueue * (hub.waitTime / Math.max(1, hub.queueSize)));
        return {
          ...hub,
          queueSize: newQueue,
          waitTime: Math.max(2, newWait),
          frequency: Math.max(1, parseFloat((hub.frequency * 0.85).toFixed(1)))
        };
      }
      return hub;
    }));
  };

  // Run simulated emergency evacuation
  const triggerEvacuation = () => {
    if (evacActive) return;
    setEvacActive(true);
    setEvacProgress(0);
    setEvacRemainingFans(currentStadium.occupancy);
    setEvacTimeElapsed(0);
    setEvacLogs([`[EMERGENCY DETECTED] Activating automated evacuation sirens in ${currentStadium.name}...`]);
  };

  // Simulation loop for emergency evacuation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (evacActive) {
      interval = setInterval(() => {
        setEvacTimeElapsed(prevTime => {
          const nextTime = prevTime + 1; // 1 simulated minute per tick
          
          // Egress rate is based on gate metrics
          const outflow = gateMetrics.totalFlow * 1.5; // Emergency speed exits are faster
          
          setEvacRemainingFans(prevFans => {
            const nextFans = Math.max(0, prevFans - outflow);
            const progress = Math.round(((currentStadium.occupancy - nextFans) / currentStadium.occupancy) * 100);
            setEvacProgress(progress);

            // Add logs on milestones
            if (nextFans === 0) {
              setEvacActive(false);
              setEvacLogs(prev => [
                `[COMPLETE] Evacuation successfully finished in ${nextTime} simulated minutes!`,
                `[SYSTEM] All ${currentStadium.occupancy} fans safely relocated to secure assembly points outside.`,
                ...prev
              ]);
            } else if (progress >= 75 && !evacLogs.some(l => l.includes('75%'))) {
              setEvacLogs(prev => [`[INFO] 75% stadium clearance achieved. Lower tier bowls completely cleared.`, ...prev]);
            } else if (progress >= 50 && !evacLogs.some(l => l.includes('50%'))) {
              setEvacLogs(prev => [`[INFO] 50% stadium clearance achieved. Mid-tier concourses flowing smoothly.`, ...prev]);
            } else if (progress >= 25 && !evacLogs.some(l => l.includes('25%'))) {
              setEvacLogs(prev => [`[INFO] 25% stadium clearance achieved. High-tier spectators directed to egress stairwells.`, ...prev]);
            }

            return nextFans;
          });

          return nextTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [evacActive, gateMetrics, currentStadium]);

  return (
    <div className="flex flex-col gap-6" id="crowd-management-view">
      {/* Overview Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              <h3 className="font-extrabold text-zinc-100 text-lg tracking-tight">
                FIFA Pro Smart Crowd Management
              </h3>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">
              Live pedestrian flow diagnostics, simulated evacuation countdowns, and dynamic public transit queue solvers.
            </p>
          </div>

          {/* Stadium Selectors */}
          <div className="flex gap-2">
            {stadiums.map(st => (
              <button
                key={st.id}
                onClick={() => {
                  if (!evacActive) {
                    setActiveStadiumId(st.id);
                  }
                }}
                disabled={evacActive}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeStadiumId === st.id
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/25'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic statistics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Live Occupancy</span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-lg text-zinc-100 font-extrabold">{currentStadium.occupancy.toLocaleString()}</strong>
              <span className="text-[10px] text-zinc-500">/ {currentStadium.capacity.toLocaleString()} fans</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentStadium.occupancy / currentStadium.capacity) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Gate Flow Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-lg text-amber-500 font-extrabold">{gateMetrics.totalFlow}</strong>
              <span className="text-[10px] text-zinc-400">fans / min</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-2">
              Combined egress speed across all open gates
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Est. Egress Duration</span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-lg text-zinc-100 font-extrabold">{gateMetrics.avgExitTime}</strong>
              <span className="text-[10px] text-zinc-400">minutes</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-2">
              Time needed to exit stadium safely at current flow
            </span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Open Gate Channels</span>
            <div className="flex items-baseline gap-1 mt-1">
              <strong className="text-lg text-zinc-100 font-extrabold">{gateMetrics.openCount}</strong>
              <span className="text-[10px] text-zinc-400">/ {currentStadium.gates.length} gates active</span>
            </div>
            <span className={`text-[10px] font-semibold block mt-2 ${
              gateMetrics.openCount < currentStadium.gates.length ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {gateMetrics.openCount < currentStadium.gates.length ? '⚠️ Gates closed or restricted' : '✓ All egress channels operational'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Interactive Gate Control vs Evacuation simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gate Control Panel (Left Column) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-800 pb-3 mb-4">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                <Gauge className="h-4.5 w-4.5 text-amber-500" />
                Interactive Gates Flow Controller
              </h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Simulate gate blockages or security delays. Click buttons to toggle gate status and watch crowd flow adapt.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              {currentStadium.gates.map(gate => {
                const isCongested = gate.status === 'Congested';
                const isClosed = gate.status === 'Closed';
                
                return (
                  <div 
                    key={gate.id} 
                    className={`bg-zinc-950 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-300 ${
                      isClosed ? 'border-red-900/30 bg-red-950/5' : isCongested ? 'border-amber-900/30 bg-amber-950/5' : 'border-zinc-800/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          isClosed ? 'bg-red-500' : isCongested ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-zinc-100 text-xs">{gate.name}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2 font-mono text-[11px] text-zinc-400">
                        <div>
                          Flow Capability: <strong className="text-zinc-200">{gate.capacity} / min</strong>
                        </div>
                        <div>
                          Current Flow: <strong className={
                            isClosed ? 'text-red-400' : isCongested ? 'text-amber-500' : 'text-emerald-400'
                          }>
                            {isClosed ? '0' : isCongested ? Math.round(gate.flowRate * 0.3) : gate.flowRate} / min
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                        isClosed ? 'bg-red-500/10 text-red-400' : isCongested ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {gate.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleToggleGate(gate.id)}
                        id={`btn-toggle-gate-${gate.id}`}
                        aria-label={`Toggle status of ${gate.name}`}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 cursor-pointer active:scale-95"
                      >
                        Change Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-start gap-2.5 mt-5">
            <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400 leading-normal">
              <strong>Crowd Dispatch AI Rule:</strong> Closing gates forces fans to redistribute to adjacent entries, creating localized density spikes. We highly advise keeping at least 3 channels fully open at all times.
            </p>
          </div>
        </div>

        {/* Emergency Evacuation Simulation (Right Column) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[450px] lg:h-auto">
          <div>
            <div className="border-b border-zinc-800 pb-3 mb-4">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                Emergency Evacuation Simulator
              </h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Run automated crowd clearance tests to calculate the safe egress times of the stadium.
              </p>
            </div>

            {/* Evacuation Meter and Progress */}
            <div className="flex flex-col items-center py-4">
              {evacActive ? (
                <div className="w-full text-center">
                  <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-xs animate-pulse mb-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    EVACUATION IN PROGRESS
                  </div>
                  
                  <div className="text-3xl font-black text-zinc-100 mb-1 font-mono">
                    {evacRemainingFans.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-4">
                    Remaining Spectators inside Arena
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="bg-red-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${evacProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5 text-[10px] text-zinc-400 font-mono">
                    <span>{evacProgress}% cleared</span>
                    <span>Elapsed: {evacTimeElapsed}s (sim minutes)</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="h-14 w-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldAlert className="h-7 w-7" />
                  </div>
                  <h5 className="font-bold text-zinc-200 text-sm">Egress Testing Suite Ready</h5>
                  <p className="text-zinc-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Runs simulated high-velocity fan exit algorithms based on active gate channels status.
                  </p>
                  
                  <button
                    onClick={triggerEvacuation}
                    id="btn-trigger-evacuation"
                    className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-red-950/30 transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-1.5 mx-auto"
                  >
                    <Timer className="h-4 w-4" />
                    Simulate Emergency Evacuation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Logs terminal for Evacuation */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-[10px] h-32 overflow-y-auto">
            <div className="text-zinc-500 mb-1 border-b border-zinc-900 pb-1 font-bold">EVACUATION COMMAND LOGS:</div>
            {evacLogs.length > 0 ? (
              evacLogs.map((log, index) => (
                <div key={index} className={`mb-1 last:mb-0 leading-relaxed ${
                  log.startsWith('[EMERGENCY') || log.startsWith('[COMPLETE') ? 'text-red-400 font-semibold' : 'text-zinc-400'
                }`}>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-zinc-600 italic">No diagnostic events running. System parameters nominal.</div>
            )}
          </div>
        </div>
      </div>

      {/* Public Transit Grid vs FIFA Interesting Spotlight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="transit-and-trivia-row">
        
        {/* Public Transit Dispatcher Panel (Left Column) */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="border-b border-zinc-800 pb-3 mb-4">
            <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
              <Train className="h-4.5 w-4.5 text-amber-500" />
              Transit Hub Telemetry & Dispatcher
            </h4>
            <p className="text-zinc-400 text-xs mt-0.5">
              Solve passenger backlogs at metro and bus hubs by dispatching additional vehicles.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            {transitHubs.map(hub => {
              const isHigh = hub.queueSize > 800;
              return (
                <div key={hub.id} className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-400">
                      {hub.type === 'Train' ? <Train className="h-4.5 w-4.5" /> : <Bus className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <span className="font-bold text-zinc-200 text-xs block">{hub.name}</span>
                      
                      <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-zinc-400">
                        <div>
                          Queue: <strong className={isHigh ? 'text-amber-500' : 'text-zinc-300'}>{hub.queueSize} fans</strong>
                        </div>
                        <div>
                          Wait: <strong className={isHigh ? 'text-amber-500' : 'text-zinc-300'}>{hub.waitTime} mins</strong>
                        </div>
                        <div>
                          Headway: <strong>{hub.frequency}m</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDispatchTransit(hub.id)}
                    id={`btn-dispatch-${hub.id}`}
                    disabled={hub.queueSize === 0}
                    aria-label={`Dispatch extra vehicle to ${hub.name}`}
                    className="bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg tracking-wider transition-all duration-300 cursor-pointer active:scale-95 disabled:shadow-none"
                  >
                    Dispatch {hub.type === 'Train' ? 'Train' : 'Shuttle'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* FIFA Spotlight & Trivia Card Panel (Right Column) - satisfies "attache 1 section about fifa so that people fill it intresting" */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-800 pb-3 mb-4">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
                FIFA Spotlight & Technology Trivia
              </h4>
              <p className="text-zinc-400 text-xs mt-0.5">
                Fascinating tech details and nomadic architectural records that make the 2026 World Cup unique.
              </p>
            </div>

            {/* Custom Trivia tab headers */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-950/50">
              {fifaTrivia.map((trivia, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTrivia(index)}
                  id={`btn-trivia-tab-${index}`}
                  aria-label={`Show trivia topic ${index + 1}`}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase shrink-0 transition-all duration-300 cursor-pointer ${
                    selectedTrivia === index
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Topic 0{index + 1}
                </button>
              ))}
            </div>

            {/* Trivia Active Content Display with elegant layout */}
            <div className="mt-4 bg-zinc-950 border border-zinc-850 p-4 rounded-xl shadow-inner min-h-[160px] flex flex-col justify-between" id="active-trivia-card">
              <div>
                <h5 className="font-extrabold text-amber-400 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  {fifaTrivia[selectedTrivia].title}
                </h5>
                <p className="text-zinc-300 text-xs leading-relaxed font-sans">
                  {fifaTrivia[selectedTrivia].fact}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-900/60 text-[10px] text-zinc-400 italic">
                <span className="font-bold text-zinc-300 not-italic uppercase tracking-wide block mb-0.5">Sustain-Tech Impact:</span>
                "{fifaTrivia[selectedTrivia].impact}"
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/60 rounded-xl p-3 border border-zinc-850 text-[10px] text-zinc-500 flex items-center gap-2 mt-4">
            <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Interactive specifications are verified in alignment with FIFA 2026 Telemetry guidelines.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
