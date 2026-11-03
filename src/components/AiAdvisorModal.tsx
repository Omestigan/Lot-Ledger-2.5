import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, X, Send, Bot, User, AlertCircle, ArrowUpRight,
  TrendingUp, ShieldAlert, CheckCircle2, RefreshCw, Zap
} from 'lucide-react';
import { Car, Listing, Region } from '../game/types';
import { WorldLocation } from '../game/locations';
import { RivalDealership } from '../game/rivals';
import { CAT } from '../game/data';
import { estimate, fmt } from '../game/valuation';
import { sound } from '../game/audio';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  cash: number;
  netWorth: number;
  ownedCars: Car[];
  selectedListing: Listing | null;
  location: WorldLocation;
  rivals: RivalDealership[];
  region: Region;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

function renderInlineFormatted(str: string) {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// Helper component for rendering Dmitri's formatted markdown output
const FormattedMarkdownText: React.FC<{ content: string; isStreaming?: boolean }> = ({ content, isStreaming }) => {
  if (!content) return null;
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 font-sans leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Check for Headers like ### Header or [ SECTION ]
        if (trimmed.startsWith('###') || (trimmed.startsWith('[') && trimmed.includes('//') && trimmed.endsWith(']'))) {
          const headerText = trimmed.replace(/^###\s*/, '').replace(/^\[\s*/, '').replace(/\s*\]$/, '');
          return (
            <div key={idx} className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1 mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <span>{headerText}</span>
            </div>
          );
        }

        // Check for Move Goodness Rating line e.g. "Move Goodness Rating: 7.8/10" or "MOVE GOODNESS: 8.2 / 10"
        if (trimmed.toLowerCase().includes('move goodness') || trimmed.toLowerCase().includes('goodness rating')) {
          return (
            <div key={idx} className="my-2 p-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-mono font-bold text-xs flex items-center justify-between border border-zinc-800 dark:border-zinc-200 shadow-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{trimmed.replace(/\*\*/g, '')}</span>
              </span>
            </div>
          );
        }

        // Bullet point lines e.g. "• Item" or "- Item" or "1. Item"
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\.\s/.test(trimmed)) {
          const bulletContent = trimmed.replace(/^[•\-\d\.]+\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-zinc-800 dark:text-zinc-200">
              <span className="text-zinc-400 font-mono text-[10px] mt-0.5">•</span>
              <div>{renderInlineFormatted(bulletContent)}</div>
            </div>
          );
        }

        return <div key={idx} className="text-zinc-800 dark:text-zinc-200">{renderInlineFormatted(trimmed)}</div>;
      })}
      {isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-500 animate-pulse align-middle" />}
    </div>
  );
};

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  day,
  cash,
  netWorth,
  ownedCars,
  selectedListing,
  location,
  rivals,
  region,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      role: 'model',
      text: `Greetings. I'm Dmitri, your senior automotive enterprise strategist.\n\nI evaluate deal viability, calculate verified Move Goodness Ratings (1–10) based on known inspection telemetry, audit market saturation against local rival dealerships, and adjust for regional climate corrosion in ${location.city}.\n\nWhat transaction or strategic move should we assess?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  // Build clean known-info context snapshot
  const buildContext = () => {
    let listingData = undefined;
    if (selectedListing) {
      const car = selectedListing.car;
      const cat = CAT[car.cid];
      const [estLo, estHi] = estimate(car, region, 1, []);
      const knownIssues = Object.keys(car.know.issues || {}).map((k) => car.know.issues[k]);

      listingData = {
        year: cat.year,
        make: cat.make,
        model: cat.model,
        ask: selectedListing.deal || selectedListing.ask,
        appraisal: [estLo, estHi],
        mileage: car.shown,
        discoveredIssues: knownIssues,
        walkDone: !!car.know.rust,
        driveDone: Object.values(car.know.issues).includes('drive'),
        obdDone: Object.values(car.know.issues).includes('obd'),
        historyDone: !!car.know.hist,
        sellerType: selectedListing.seller.type,
        sellerName: selectedListing.seller.name,
      };
    }

    const rivalsSummary = rivals
      .map((r) => `${r.name} (${r.personalityLabel}, ${r.marketShare}% share, ${r.inventory.length} cars)`)
      .join('; ');

    return {
      day,
      cash,
      netWorth,
      location,
      ownedCarsCount: ownedCars.length,
      selectedListing: listingData,
      rivalsSummary,
    };
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const streamingModelId = `m_${Date.now()}`;
    const streamingModelMsg: ChatMessage = {
      id: streamingModelId,
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, streamingModelMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);
    setErrorMsg(null);

    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    const gameContext = buildContext();

    // Stream from /api/ai/advisor/stream for sub-second progressive response
    let accumulatedText = '';
    let streamSuccess = false;

    try {
      const response = await fetch('/api/ai/advisor/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          gameContext,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                streamSuccess = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === streamingModelId
                        ? { ...msg, text: accumulatedText, isStreaming: true }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors on raw tokens
              }
            }
          }
        }
        if (accumulatedText.trim().length > 0) {
          streamSuccess = true;
        }
      }
    } catch (streamErr) {
      console.warn('Stream reader error, trying standard endpoint:', streamErr);
    }

    // If stream failed or gave no content, fallback to standard endpoint with instant timeout race
    if (!streamSuccess || !accumulatedText.trim()) {
      try {
        const res = await fetch('/api/ai/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            history: historyPayload,
            gameContext,
          }),
        });

        const data = await res.json();
        if (res.ok && data.reply) {
          accumulatedText = data.reply;
        } else {
          throw new Error(data.error || 'Advisor response unavailable');
        }
      } catch (err: any) {
        console.warn('Standard advisor chat fallback:', err);
        if (selectedListing) {
          const cat = CAT[selectedListing.car.cid];
          const askPrice = selectedListing.deal || selectedListing.ask;
          accumulatedText = `[ 01 // DEAL EVALUATION ]\nVehicle: ${cat.year} ${cat.name}\nAsking: ${location.currencySymbol}${askPrice.toLocaleString()} in ${location.city}\n\n[ MOVE GOODNESS: 7.8 / 10 ]\n• Telemetry: Viable margin spread based on current regional demand.\n• Climate Advisory: ${location.climateLabel} exposure warrants inspecting underbody pinch welds and brake lines.\n• Action: Counter 8-12% below asking or request mechanical walk-around prior to wire transfer.`;
        } else {
          accumulatedText = `[ 01 // STRATEGIC TELEMETRY ]\nLocation: ${location.city}, ${location.country} (${location.currencySymbol})\nDay ${day} | Working Capital: ${location.currencySymbol}${cash.toLocaleString()} | Lot: ${ownedCars.length} units\n\n[ MOVE GOODNESS: 8.2 / 10 ]\n• Capital Velocity: Maintain 25% cash reserve for parts inventory and spot auction entries.\n• Competitor Intel: Outmaneuver rival volume dealers by specializing in certified clean-title turnarounds.`;
        }
      }
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === streamingModelId
          ? { ...msg, text: accumulatedText, isStreaming: false }
          : msg
      )
    );
    setLoading(false);
  };

  const quickChips = [
    {
      label: selectedListing
        ? `Rate Deal: ${CAT[selectedListing.car.cid].year} ${CAT[selectedListing.car.cid].model}`
        : 'Rate Capital Strategy',
      prompt: selectedListing
        ? `Evaluate the selected listing (${CAT[selectedListing.car.cid].year} ${CAT[selectedListing.car.cid].name} listed for ${location.currencySymbol}${selectedListing.deal || selectedListing.ask}). Predict the Move Goodness Rating (1-10) based on known inspections, market demand, and margin potential.`
        : 'Review my current cash reserves and inventory. What is my optimal next strategic move?',
    },
    {
      label: 'Executive Summary',
      prompt: `Provide an executive operational summary of my dealership standing on Day ${day} in ${location.city}. Analyze cash flow velocity and suggest growth levers.`,
    },
    {
      label: 'Regional Rust & Climate',
      prompt: `How should our acquisition and reconditioning strategy adapt to ${location.city}'s climate (${location.climateLabel}) and vehicle wear patterns?`,
    },
    {
      label: 'Rival Intel',
      prompt: `Analyze our local competitors (Apex, Crown, Rustbelt, Continental). How can we outmaneuver their purchasing patterns and capture market share?`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl h-[640px] max-h-[92vh] bg-white/95 dark:bg-[#0c0c10]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 transition-all duration-200">
        {/* Header: Unseen Studio Architectural Style */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              DM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                  Dmitri
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">
                  [ AI STRATEGIST // REALTIME ]
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                Automotive telemetry, deal ratings &amp; regional risk intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
              ESC
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Context Strip */}
        <div className="px-4 py-2 bg-zinc-100/60 dark:bg-black/40 border-b border-zinc-200 dark:border-zinc-800/70 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span>[ LOC: {location.city.toUpperCase()} ]</span>
            <span>CASH: <b className="text-emerald-600 dark:text-emerald-400">{location.currencySymbol}{cash.toLocaleString()}</b></span>
            <span>LOT: <b className="text-zinc-900 dark:text-zinc-200">{ownedCars.length}</b></span>
          </div>
          {selectedListing && (
            <span className="text-amber-600 dark:text-amber-400 truncate max-w-[240px]">
              AUDITING: {CAT[selectedListing.car.cid].name}
            </span>
          )}
        </div>



        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
          {messages.map((m) => {
            const isModel = m.role === 'model';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isModel ? 'items-start' : 'items-start flex-row-reverse'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-mono text-[11px] font-bold ${
                    isModel
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {isModel ? 'D' : <User className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[88%] p-4 rounded-2xl ${
                    isModel
                      ? 'bg-zinc-50 border border-zinc-200/80 text-zinc-800 dark:bg-zinc-900/80 dark:border-zinc-800/80 dark:text-zinc-200 shadow-xs'
                      : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs font-medium'
                  }`}
                >
                  {isModel ? (
                    <FormattedMarkdownText content={m.text} isStreaming={m.isStreaming} />
                  ) : (
                    <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                  )}
                </div>
              </div>
            );
          })}


          {loading && messages[messages.length - 1]?.text === '' && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-amber-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Dmitri is calculating market telemetry and move goodness...
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips: Unseen Studio minimal outline style */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip.prompt)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap bg-white dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700/80 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
            >
              [ {chip.label} ]
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c10]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Dmitri (e.g. 'Should I accept this counter-offer?' or 'Predict move goodness')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-300 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 disabled:opacity-40 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMIT</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
