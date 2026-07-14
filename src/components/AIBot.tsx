import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, MapPin, Bot, User, HelpCircle, Compass, AlertCircle, Info } from 'lucide-react';

interface AIBotProps {
  onNavigateToSeat?: (blockId: string) => void;
}

export default function AIBot({ onNavigateToSeat }: AIBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Marhaban! I am 'fifa guider', your official FIFA World Cup Stadium & directions assistant. 🏟️\n\nI can guide you step-by-step through Lusail Stadium and Al Bayt Stadium, help you locate restrooms, dining areas, medical tents, and find the least congested gates! Try choosing one of the prompt suggestions below or type your own question.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestionPrompts = [
    { text: 'Directions to Block B101 (VIP) from Gate A', category: 'navigation' },
    { text: 'Where is the nearest food court from Gate B?', category: 'navigation' },
    { text: 'Which Lusail gates are currently congested?', category: 'status' },
    { text: 'What is the score of the Argentina vs France live match?', category: 'match' },
    { text: 'Al Bayt Stadium Gate locations and directions', category: 'navigation' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setWarning(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userMessage: textToSend,
          messages: messages.slice(-10) // Send recent message history context
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (data.warning) {
        setWarning(data.warning);
      }

      setMessages(prev => [...prev, botMsg]);

      // Detect if bot references a seat block, and trigger callback to highlight it on the map!
      if (onNavigateToSeat) {
        const blocks = ['B101', 'B102', 'B201', 'B202', 'B301', 'B302', 'B401', 'BA01', 'BA02', 'BA03', 'BA04'];
        for (const block of blocks) {
          if (data.text.includes(block)) {
            onNavigateToSeat(block);
            break;
          }
        }
      }

    } catch (error: any) {
      console.error('Error talking to bot API:', error);
      
      // Fallback response inside client if express server is totally unavailable
      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        sender: 'bot',
        text: `My apologies! I'm having trouble connecting to the routing engine. Let me provide standard directional tips:\n\n• **Lusail Stadium Gate A (North):** Best route for VIP Block B101 and General Admission B301.\n• **Lusail Stadium Gate B (East):** Leads to Block B201. (Currently HIGH security wait times! Please enter via Gate C instead).\n• **Al Bayt Stadium Gate 1:** Perfect path for Category 1 BA02 and Family Zone BA04.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col h-[580px] justify-between relative" id="ai-navigation-bot-container">
      {/* Bot Chat Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/15 text-zinc-950 font-bold">
            <Bot className="h-5.5 w-5.5 text-zinc-950" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base tracking-tight flex items-center gap-1.5">
              fifa guider
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            </h3>
            <p className="text-zinc-400 text-xs">Official Stadium & Match Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-zinc-400 text-xs font-mono">
          <Compass className="h-4 w-4 text-amber-500 animate-spin-slow" />
          <span>ACTIVE COGNITIVE PATHS</span>
        </div>
      </div>

      {/* Warning Alert if running in offline mode */}
      {warning && (
        <div className="mb-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl p-3 text-xs flex items-start gap-2 animate-fade-in" id="bot-api-warning">
          <AlertCircle className="h-4.5 w-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Offline Assist Mode:</span>
            {warning}
          </div>
        </div>
      )}

      {/* Chat History View */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 mb-4 max-h-[360px] scrollbar-thin" id="bot-chat-history">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              id={`chat-bubble-${msg.id}`}
              className={`flex items-start gap-2.5 max-w-[85%] ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                isBot ? 'bg-zinc-800 text-amber-500' : 'bg-amber-500 text-zinc-950'
              }`}>
                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className="flex flex-col gap-1">
                <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  isBot 
                    ? 'bg-zinc-950 text-zinc-200 border border-zinc-800' 
                    : 'bg-amber-500 text-zinc-950 font-semibold shadow-md'
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[10px] text-zinc-400 ${isBot ? 'text-left pl-1' : 'text-right pr-1'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[85%] self-start" id="chat-loading-indicator">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 text-amber-500 flex items-center justify-center">
              <Bot className="h-4 w-4 animate-bounce" />
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-1.5 text-zinc-400 text-sm">
              <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs font-mono ml-1.5 text-zinc-400">Calculating directions...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="mb-3" id="suggestion-chips-container">
          <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase block mb-1.5 pl-1 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> SUGGESTED QUESTIONS
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestionPrompts.map((prompt, idx) => (
              <button
                key={idx}
                id={`chip-${idx}`}
                onClick={() => handleSendMessage(prompt.text)}
                className="text-[11px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 px-2.5 py-1.5 rounded-lg transition-all duration-300 text-left cursor-pointer active:scale-95"
              >
                {prompt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-zinc-800/80 pt-3"
        id="bot-input-form"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask fifa guider (e.g. 'How to get to Block 102?')..."
          id="chat-input-field"
          aria-label="Ask fifa guider stadium directions"
          className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 focus:outline-none rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-400 transition-colors duration-300"
          disabled={isLoading}
        />
        <button
          type="submit"
          id="btn-send-message"
          aria-label="Send message"
          disabled={isLoading || !input.trim()}
          className="h-11 w-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transition-all duration-300 shadow-md shadow-amber-950/25 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none cursor-pointer"
        >
          <Send className="h-4.5 w-4.5 text-zinc-950" />
        </button>
      </form>
    </div>
  );
}
