import React, { useState, useEffect } from 'react';
import { Stadium, SeatBlock, Seat } from '../types';
import { INITIAL_STADIUMS } from '../data/mockData';
import { Armchair, ChevronRight, CheckCircle, Navigation, Info, Users, AlertTriangle, Coffee } from 'lucide-react';

interface StadiumMapProps {
  selectedBlockIdFromBot?: string | null;
  onBookingComplete?: (stadiumId: string, blockId: string, seatCount: number) => void;
}

export default function StadiumMap({ selectedBlockIdFromBot, onBookingComplete }: StadiumMapProps) {
  const [stadiums, setStadiums] = useState<Stadium[]>(INITIAL_STADIUMS);
  const [selectedStadium, setSelectedStadium] = useState<Stadium>(INITIAL_STADIUMS[0]);
  const [selectedBlock, setSelectedBlock] = useState<SeatBlock>(INITIAL_STADIUMS[0].blocks[2]); // Default Cat 1 East Block
  
  // Grid Seating State
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [bookingHistory, setBookingHistory] = useState<string[]>([
    "Fan booked Seat A-12 in VIP North Block (3 mins ago)",
    "Fan booked Seat D-4 in Cat 3 High Tier (5 mins ago)",
    "Fan booked Seat B-23 in Cat 1 West Side (8 mins ago)"
  ]);

  // Update selected block from prop (if passed by chatbot)
  useEffect(() => {
    if (selectedBlockIdFromBot) {
      const matchInStadium = selectedStadium.blocks.find(b => b.id === selectedBlockIdFromBot);
      if (matchInStadium) {
        setSelectedBlock(matchInStadium);
      } else {
        // Try other stadiums
        const otherStadium = stadiums.find(s => s.blocks.some(b => b.id === selectedBlockIdFromBot));
        if (otherStadium) {
          setSelectedStadium(otherStadium);
          const foundBlock = otherStadium.blocks.find(b => b.id === selectedBlockIdFromBot);
          if (foundBlock) setSelectedBlock(foundBlock);
        }
      }
    }
  }, [selectedBlockIdFromBot, selectedStadium, stadiums]);

  // Generate interactive seat grid whenever selected block changes
  useEffect(() => {
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const colsCount = 10;
    const generated: Seat[] = [];

    // Seed repeatable deterministic booked seats based on blockId hash
    const blockHash = selectedBlock.id.charCodeAt(selectedBlock.id.length - 1) || 5;

    for (const row of rows) {
      for (let i = 1; i <= colsCount; i++) {
        // Check if booked based on seed
        const isBooked = (row.charCodeAt(0) + i + blockHash) % 3 === 0;
        generated.push({
          blockId: selectedBlock.id,
          row,
          number: i,
          status: isBooked ? 'booked' : 'available',
          price: selectedBlock.price
        });
      }
    }
    setSeats(generated);
    setSelectedSeat(null);
  }, [selectedBlock]);

  // Live simulation updates (simulating other tickets booking around the stadium)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random block in current stadium to update
      const randomBlockIdx = Math.floor(Math.random() * selectedStadium.blocks.length);
      const targetBlock = selectedStadium.blocks[randomBlockIdx];

      if (targetBlock.bookedCount < targetBlock.capacity) {
        // Update booked counts
        setStadiums(prev => prev.map(s => {
          if (s.id === selectedStadium.id) {
            return {
              ...s,
              currentOccupancy: Math.min(s.capacity, s.currentOccupancy + 1),
              blocks: s.blocks.map(b => b.id === targetBlock.id ? { ...b, bookedCount: b.bookedCount + 1 } : b)
            };
          }
          return s;
        }));

        // Trigger visual logs
        const seatLetter = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A - E
        const seatNum = Math.floor(Math.random() * 30) + 1;
        setBookingHistory(prev => [
          `Fan booked Seat ${seatLetter}-${seatNum} in ${targetBlock.name} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`,
          ...prev.slice(0, 4)
        ]);
      }
    }, 15000); // simulation heartbeat every 15s

    return () => clearInterval(interval);
  }, [selectedStadium]);

  const handleSelectSeat = (seat: Seat) => {
    if (seat.status === 'booked') return;
    setSelectedSeat(prev => {
      if (prev && prev.row === seat.row && prev.number === seat.number) {
        return null;
      }
      return seat;
    });
  };

  const handleBookTicket = () => {
    if (!selectedSeat) return;

    // Transition state
    setSeats(prev => prev.map(s => {
      if (s.row === selectedSeat.row && s.number === selectedSeat.number) {
        return { ...s, status: 'booked' };
      }
      return s;
    }));

    // Update statistics
    setStadiums(prev => prev.map(s => {
      if (s.id === selectedStadium.id) {
        return {
          ...s,
          currentOccupancy: Math.min(s.capacity, s.currentOccupancy + 1),
          blocks: s.blocks.map(b => b.id === selectedBlock.id ? { ...b, bookedCount: b.bookedCount + 1 } : b)
        };
      }
      return s;
    }));

    // Update block view locally
    setSelectedBlock(prev => ({
      ...prev,
      bookedCount: Math.min(prev.capacity, prev.bookedCount + 1)
    }));

    // Raise booking triggers
    if (onBookingComplete) {
      onBookingComplete(selectedStadium.id, selectedBlock.id, 1);
    }

    setBookingHistory(prev => [
      `Ticket secured! You reserved Seat ${selectedSeat.row}-${selectedSeat.number} in ${selectedBlock.name} ($${selectedSeat.price})`,
      ...prev
    ]);

    setSelectedSeat(null);
  };

  const handleStadiumChange = (stadiumId: string) => {
    const selected = stadiums.find(s => s.id === stadiumId);
    if (selected) {
      setSelectedStadium(selected);
      setSelectedBlock(selected.blocks[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="stadium-seat-mapper">
      {/* Interactive Stadium & Blueprint SVG (Left Panel) */}
      <div className="xl:col-span-8 flex flex-col gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="font-bold text-zinc-100 text-lg tracking-tight">Interactive Arena Seating Blueprint</h3>
              <p className="text-zinc-400 text-xs mt-0.5">Select a venue, choose an allocation block, and book available spots live.</p>
            </div>

            <div className="flex items-center gap-2">
              {stadiums.map(stad => (
                <button
                  key={stad.id}
                  id={`btn-stadium-select-${stad.id}`}
                  onClick={() => handleStadiumChange(stad.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                    selectedStadium.id === stad.id 
                      ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/40' 
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-100 border border-zinc-800'
                  }`}
                >
                  {stad.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Map representation of Stadium Bowl */}
          <div className="relative bg-zinc-950 rounded-xl p-5 flex items-center justify-center border border-zinc-800/60 overflow-hidden min-h-[300px]" id="interactive-stadium-map-box">
            
            {/* SVG layout showing concentric seating blocks */}
            <svg viewBox="0 0 500 360" className="w-full max-w-[480px] h-auto drop-shadow-2xl">
              {/* Pitch outline center */}
              <rect x="180" y="110" width="140" height="90" fill="#18181b" stroke="#3f3f46" strokeWidth="2" rx="4" opacity="0.85" />
              <line x1="250" y1="110" x2="250" y2="200" stroke="#3f3f46" strokeWidth="2" opacity="0.85" />
              <circle cx="250" cy="155" r="22" fill="none" stroke="#3f3f46" strokeWidth="2" opacity="0.85" />
              
              {/* Stadium Ring Seating Blocks Paths */}
              {selectedStadium.blocks.map((block, idx) => {
                // Render custom SVG arcs and slices representing seats
                const isSelected = selectedBlock.id === block.id;
                
                // Let's draw blocks placed radially around the pitch center (250, 155)
                const angleStart = (idx * (360 / selectedStadium.blocks.length)) * Math.PI / 180;
                const angleEnd = ((idx + 1) * (360 / selectedStadium.blocks.length) - 5) * Math.PI / 180;
                
                const rInner = 105;
                const rOuter = 145;
                const cx = 250;
                const cy = 155;
                
                const x1 = cx + rInner * Math.cos(angleStart);
                const y1 = cy + rInner * Math.sin(angleStart);
                const x2 = cx + rOuter * Math.cos(angleStart);
                const y2 = cy + rOuter * Math.sin(angleStart);
                
                const x3 = cx + rOuter * Math.cos(angleEnd);
                const y3 = cy + rOuter * Math.sin(angleEnd);
                const x4 = cx + rInner * Math.cos(angleEnd);
                const y4 = cy + rInner * Math.sin(angleEnd);
                
                const pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;

                // Calculate midpoint for labels
                const labelAngle = (angleStart + angleEnd) / 2;
                const rLabel = 125;
                const labelX = cx + rLabel * Math.cos(labelAngle);
                const labelY = cy + rLabel * Math.sin(labelAngle);
                
                return (
                  <g key={block.id} className="cursor-pointer" onClick={() => setSelectedBlock(block)}>
                    <path
                      d={pathData}
                      id={`stadium-svg-path-${block.id}`}
                      className={`transition-all duration-300 ${
                        isSelected 
                          ? 'fill-amber-500/35 stroke-amber-400 stroke-[3px] filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                          : 'fill-zinc-850/40 stroke-zinc-700/60 hover:fill-zinc-800/50 hover:stroke-zinc-500 stroke-[1.5px]'
                      }`}
                    />
                    <text
                      x={labelX}
                      y={labelY + 4}
                      id={`stadium-svg-text-${block.id}`}
                      textAnchor="middle"
                      className={`text-[9px] font-extrabold select-none transition-all duration-300 ${
                        isSelected ? 'fill-amber-400 font-black' : 'fill-zinc-500'
                      }`}
                    >
                      {block.id}
                    </text>
                  </g>
                );
              })}

              {/* Outside Gates indicators */}
              <g id="map-gate-indicators">
                <circle cx="250" cy="20" r="12" className="fill-zinc-900 stroke-zinc-700 stroke-2" />
                <text x="250" y="24" textAnchor="middle" className="fill-zinc-300 text-[8px] font-black">A</text>

                <circle cx="470" cy="155" r="12" className="fill-zinc-900 stroke-zinc-700 stroke-2" />
                <text x="470" y="159" textAnchor="middle" className="fill-zinc-300 text-[8px] font-black">B</text>

                <circle cx="250" cy="340" r="12" className="fill-zinc-900 stroke-zinc-700 stroke-2" />
                <text x="250" y="344" textAnchor="middle" className="fill-zinc-300 text-[8px] font-black">C</text>

                <circle cx="30" cy="155" r="12" className="fill-zinc-900 stroke-zinc-700 stroke-2" />
                <text x="30" y="159" textAnchor="middle" className="fill-zinc-300 text-[8px] font-black">D</text>
              </g>
            </svg>

            {/* Inner details overlays */}
            <div className="absolute top-3 left-3 bg-zinc-900/90 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-400 flex flex-col gap-1">
              <span className="font-bold text-zinc-100 flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-amber-500" /> Map Legend:
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-amber-500/40 border border-amber-400" />
                <span>Selected Zone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-800 border border-zinc-700" />
                <span>Other Blocks</span>
              </div>
            </div>

            <div className="absolute bottom-3 right-3 bg-zinc-900/95 border border-zinc-800/80 rounded-lg p-2.5 text-[10px] text-zinc-400 flex flex-col gap-1 max-w-[170px]">
              <span className="text-zinc-100 font-bold text-xs mb-0.5">Directional Guide</span>
              <p className="leading-normal">
                Enter via <strong className="text-amber-500">{selectedBlock.gateEntrance}</strong>. Restrooms and first aid posts are positioned immediately around the block foyer.
              </p>
            </div>
          </div>

          {/* Seat Block Metadata Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Category tier</span>
              <strong className="text-sm text-zinc-200 block mt-0.5">{selectedBlock.category}</strong>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Base Price</span>
              <strong className="text-sm text-amber-500 block mt-0.5">${selectedBlock.price} USD</strong>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Allocation Availability</span>
              <strong className="text-sm text-zinc-200 block mt-0.5">
                {selectedBlock.capacity - selectedBlock.bookedCount} / {selectedBlock.capacity} left
              </strong>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Gate Entrance</span>
              <strong className="text-sm text-zinc-200 block mt-0.5 flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5 text-amber-500" />
                {selectedBlock.gateEntrance}
              </strong>
            </div>
          </div>

        </div>

        {/* Real-Time Live Feed tracker */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Simulated Real-Time Stadium Transactions Feed</span>
          </div>
          <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-xs flex flex-col gap-2 max-h-[100px] overflow-y-auto">
            {bookingHistory.map((log, idx) => (
              <div key={idx} id={`live-history-log-${idx}`} className="flex items-center justify-between text-zinc-400 border-b border-zinc-900/60 pb-1.5 last:border-0 last:pb-0">
                <span className="truncate pr-4">{log}</span>
                <span className="text-[10px] text-amber-500/80 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 shrink-0 font-bold uppercase">LIVE</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row Seat Grid Selector (Right Panel) */}
      <div className="xl:col-span-4 flex flex-col gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col h-full justify-between">
          <div>
            <div className="border-b border-zinc-800 pb-4 mb-4">
              <span className="text-[11px] font-bold text-amber-500 tracking-wider uppercase bg-amber-500/10 px-2 py-1 rounded">
                Block {selectedBlock.id} Selected
              </span>
              <h4 className="font-bold text-zinc-100 text-base mt-2.5">{selectedBlock.name} Grid</h4>
              <p className="text-zinc-400 text-xs mt-0.5">Click on an armchair to select your row and number.</p>
            </div>

            {/* Grid seating layout representation */}
            <div className="grid grid-cols-10 gap-1.5 mb-5 select-none bg-zinc-950 p-4 rounded-xl border border-zinc-800" id="seat-grid-scroller">
              {seats.map((seat, index) => {
                const isSelected = selectedSeat && selectedSeat.row === seat.row && selectedSeat.number === seat.number;
                const isBooked = seat.status === 'booked';
                
                return (
                  <button
                    key={index}
                    id={`btn-seat-${seat.row}-${seat.number}`}
                    disabled={isBooked}
                    onClick={() => handleSelectSeat(seat)}
                    aria-label={`Seat ${seat.row}-${seat.number} ${isBooked ? 'Booked' : 'Available'}`}
                    title={`Seat ${seat.row}-${seat.number} (${isBooked ? 'Booked' : 'Available'})`}
                    className={`h-7 w-7 rounded flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                      isBooked 
                        ? 'bg-zinc-850/40 text-zinc-600 border border-zinc-800 cursor-not-allowed' 
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 border border-amber-400 scale-110 shadow-lg shadow-amber-500/25'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-400'
                    }`}
                  >
                    <Armchair className="h-4 w-4" />
                    
                    {/* Hover seat code badge */}
                    <span className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-zinc-900 border border-zinc-800 text-zinc-100 text-[9px] px-1.5 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 font-mono whitespace-nowrap">
                      {seat.row}-{seat.number}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Seat Legends */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-zinc-400 mb-6 border-b border-zinc-800/40 pb-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-zinc-950 border border-zinc-800 inline-block" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-500 border border-amber-400 inline-block" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-zinc-850/40 border border-zinc-800 inline-block" />
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* Ticket Booking Receipt details */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5" id="ticket-booking-receipt">
            {selectedSeat ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">VENUE</span>
                    <strong className="text-xs text-zinc-100 block mt-0.5">{selectedStadium.name}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">ALLOCATION ZONE</span>
                    <strong className="text-xs text-zinc-200 block mt-0.5">Block {selectedBlock.id}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">SEAT ROW & NO</span>
                    <strong className="text-sm text-amber-500 block mt-0.5 font-mono">
                      Row {selectedSeat.row} • Seat {selectedSeat.number}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">SUBTOTAL</span>
                    <strong className="text-sm text-amber-500 block mt-0.5 font-bold">${selectedSeat.price} USD</strong>
                  </div>
                </div>

                <button
                  onClick={handleBookTicket}
                  id="btn-confirm-booking"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-950/40 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 text-sm mt-1 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Booking Now
                </button>
              </>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2" id="empty-booking-receipt">
                <Armchair className="h-8 w-8 text-zinc-700 animate-pulse" />
                <span className="text-xs font-bold text-zinc-400">No Seat Selected</span>
                <p className="text-[11px] text-zinc-500 max-w-[180px] mx-auto leading-normal">
                  Click on an available seat in the map grid above to view details and proceed with booking.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
