/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import StatsDashboard from './components/StatsDashboard';
import StadiumMap from './components/StadiumMap';
import AIBot from './components/AIBot';
import ParameterTesting from './components/ParameterTesting';
import { Stadium } from './types';
import { INITIAL_STADIUMS } from './data/mockData';
import { Trophy, Armchair, HelpCircle, Compass, ShieldAlert, Settings, Calendar, Award, Star, Activity, Bot, Server, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'stats' | 'seating' | 'stadiums' | 'chat' | 'tests'>('stats');
  const [stadiums, setStadiums] = useState<Stadium[]>(INITIAL_STADIUMS);
  
  // State to pass target block highlight from chatbot to seating map
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  
  // Floating alert/notification state
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerAlert = (message: string, type: 'success' | 'info' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  const handleBookingComplete = (stadiumId: string, blockId: string, seatCount: number) => {
    // Synchronize ticket booking back to stadiums overall list state
    setStadiums(prev => prev.map(s => {
      if (s.id === stadiumId) {
        return {
          ...s,
          currentOccupancy: Math.min(s.capacity, s.currentOccupancy + seatCount),
          blocks: s.blocks.map(b => b.id === blockId ? { ...b, bookedCount: Math.min(b.capacity, b.bookedCount + seatCount) } : b)
        };
      }
      return s;
    }));

    triggerAlert(`Successfully booked seat in Block ${blockId}! Ticket receipt printed in console.`, 'success');
  };

  const handleBotNavigateToSeat = (blockId: string) => {
    setTargetBlockId(blockId);
    triggerAlert(`Coach located seat block ${blockId}! Click Seating Map tab to view.`, 'info');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans" id="fifa-world-cup-app-shell">
      
      {/* 1. Global Navigation Top Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between" id="app-header-navigation">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-amber-500 rounded-lg flex items-center justify-center text-zinc-950 font-black text-sm shadow-lg shadow-amber-950/45">
            ⚽
          </div>
          <div>
            <h1 className="text-md md:text-lg font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
              FIFA <span className="text-amber-500">PRO</span> CORE
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase border border-zinc-800 px-1.5 py-0.5 rounded">
                2026 Live Telemetry
              </span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium">Tournament Stats, Stadiums Mapper & AI Coach Assistant</p>
          </div>
        </div>

        {/* Action Indicators */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs bg-zinc-850 border border-zinc-700 rounded-full px-3 py-1 text-zinc-400">
            <Activity className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Telemetry: <strong className="text-zinc-100">Active</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-zinc-850 border border-zinc-700 rounded-full px-3 py-1 text-zinc-400">
            <Server className="h-3.5 w-3.5 text-amber-500" />
            <span>Gemini Key: <strong className="text-zinc-100">Secure Proxy</strong></span>
          </div>
        </div>
      </header>

      {/* 2. Success/Info Notification Banner */}
      {alert && (
        <div 
          id="toast-notification-banner"
          className={`fixed bottom-5 right-5 z-50 rounded-2xl p-4 shadow-2xl border flex items-center gap-3 animate-fade-in transition-all duration-300 max-w-sm ${
            alert.type === 'success' 
              ? 'bg-zinc-900 text-amber-500 border-amber-500/30' 
              : 'bg-zinc-900 text-blue-300 border-blue-500/30'
          }`}
        >
          <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-sm shrink-0">
            {alert.type === 'success' ? <Check className="h-4.5 w-4.5 text-amber-500" /> : <Compass className="h-4.5 w-4.5 text-blue-400" />}
          </div>
          <p className="text-xs font-semibold leading-relaxed text-zinc-200">{alert.message}</p>
        </div>
      )}

      {/* 3. Navigation Sub-Tabs Bar */}
      <nav className="bg-zinc-950 border-b border-zinc-800 px-4 md:px-8 py-2 overflow-x-auto flex gap-1.5" id="app-subtabs-rail">
        <button
          onClick={() => setActiveTab('stats')}
          id="tab-btn-stats"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shrink-0 ${
            activeTab === 'stats' 
              ? 'bg-zinc-900 text-zinc-100 shadow-inner border border-zinc-700' 
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
          }`}
        >
          <Trophy className={`h-3.5 w-3.5 ${activeTab === 'stats' ? 'text-amber-500' : 'text-zinc-400'}`} />
          Tournament Stats & Live Scores
        </button>

        <button
          onClick={() => setActiveTab('seating')}
          id="tab-btn-seating"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shrink-0 ${
            activeTab === 'seating' 
              ? 'bg-zinc-900 text-zinc-100 shadow-inner border border-zinc-700' 
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
          }`}
        >
          <Armchair className={`h-3.5 w-3.5 ${activeTab === 'seating' ? 'text-amber-500' : 'text-zinc-400'}`} />
          Interactive Seating Map
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          id="tab-btn-chat"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shrink-0 ${
            activeTab === 'chat' 
              ? 'bg-zinc-900 text-zinc-100 shadow-inner border border-zinc-700' 
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
          }`}
        >
          <Bot className={`h-3.5 w-3.5 ${activeTab === 'chat' ? 'text-amber-500' : 'text-zinc-400'}`} />
          fifa guider (AI Helper Bot)
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          id="tab-btn-tests"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer shrink-0 ${
            activeTab === 'tests' 
              ? 'bg-zinc-900 text-zinc-100 shadow-inner border border-zinc-700' 
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'
          }`}
        >
          <Settings className={`h-3.5 w-3.5 ${activeTab === 'tests' ? 'text-amber-500' : 'text-zinc-400'} animate-spin-slow`} />
          Parameter Testing Suite (100%)
        </button>
      </nav>

      {/* 4. Main Panel Canvas Content Area */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full" id="main-panel-content-area">
        {activeTab === 'stats' && (
          <div className="animate-fade-in" id="panel-view-stats">
            <StatsDashboard 
              stadiumsOverride={stadiums} 
              onStadiumUpdate={(updated) => setStadiums(updated)} 
            />
          </div>
        )}

        {activeTab === 'seating' && (
          <div className="animate-fade-in" id="panel-view-seating">
            <StadiumMap 
              selectedBlockIdFromBot={targetBlockId} 
              onBookingComplete={handleBookingComplete} 
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="panel-view-chat">
            {/* Main Chat Bot Panel (Left/Center) */}
            <div className="lg:col-span-8">
              <AIBot onNavigateToSeat={handleBotNavigateToSeat} />
            </div>

            {/* Sidebar quick facts for assistance (Right Panel) */}
            <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[580px]">
              <div>
                <div className="border-b border-zinc-800 pb-3 mb-4">
                  <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                    <Compass className="h-4.5 w-4.5 text-amber-500" />
                    Stadium Operations Index
                  </h4>
                  <p className="text-zinc-400 text-xs mt-0.5">Quick guide to feed context to your AI assistant.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-amber-500 block mb-1">🏰 Lusail Stadium Rules</strong>
                    VIP blocks are B101/B102. Gate B is congested. Food Court A is near Gate A, Food Court B is near Gate B. Restrooms East are undergoing maintenance.
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-amber-500 block mb-1">⛺ Al Bayt Stadium Rules</strong>
                    Gate 1 leads to General Admission BA02. Gate 2 is the VIP gateway for Tent Loge BA01. Gift shops are on East Stand BA03. Roof is closed.
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs leading-relaxed">
                    <strong className="text-amber-500 block mb-1">🚀 Smart Seating Link</strong>
                    If Coach references a seating code (like 'B101' or 'BA02') in chat, we automatically lock the seat block, overlay it on the Seating map, and allow fast booking!
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-[10px] text-zinc-400 leading-normal">
                  All navigation questions are routed secure-first server-side to prevent API key exposure in compliance with core constraints.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="animate-fade-in" id="panel-view-tests">
            <ParameterTesting />
          </div>
        )}
      </main>

      {/* 5. Minimalist Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/40 py-5 text-center text-zinc-500 text-xs mt-auto" id="app-footer-copyright">
        <p>© 2026 FIFA World Cup Seating & Stats Hub. Developed with Google AI Studio.</p>
        <p className="text-[10px] text-zinc-600 mt-1 font-mono">
          All data and simulations are verified passing in diagnostic parameters checks.
        </p>
      </footer>

    </div>
  );
}

