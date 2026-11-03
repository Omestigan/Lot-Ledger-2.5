import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users, UserCheck, Shield, Sparkles, Wrench, Building2, Gavel,
  FileText, Award, Skull, Truck, Search, ZoomIn, ZoomOut, RotateCcw,
  CheckCircle2, DollarSign, ArrowRight, Lock, HelpCircle, Star, Compass,
  Radio, Globe2, ShoppingBag, Plus
} from 'lucide-react';
import { Car, ConnectionGraph, Contact, ContactCategory } from '../game/types';
import { findPathToContact, getActivePerks } from '../game/connections';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';
import { CAT } from '../game/data';
import { CarPhotoCard } from './CarPhotoCard';

interface ConnectionsViewProps {
  graph: ConnectionGraph;
  onUnlockContact: (contactId: string) => void;
  onCompleteQuest: (contactId: string, questId: string) => void;
  playerCash: number;
  playerFavours: number;
  playerRep: number;
  playerCars?: Car[];
  currentUserId?: string;
  currentUsername?: string;
  onFlash?: (msg: string) => void;
}

const CATEGORY_COLORS: Record<ContactCategory, { bg: string; border: string; text: string; fill: string; dot: string }> = {
  mechanic: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-400', fill: '#f59e0b', dot: 'bg-amber-500' },
  wholesaler: { bg: 'bg-zinc-500/10 dark:bg-zinc-500/20', border: 'border-zinc-500', text: 'text-zinc-800 dark:text-zinc-200', fill: '#71717a', dot: 'bg-zinc-500' },
  auction: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-400', fill: '#a855f7', dot: 'bg-purple-500' },
  insider: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', fill: '#10b981', dot: 'bg-emerald-500' },
  collector: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-700 dark:text-rose-400', fill: '#f43f5e', dot: 'bg-rose-500' },
  underground: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', border: 'border-slate-500', text: 'text-slate-700 dark:text-slate-300', fill: '#64748b', dot: 'bg-slate-500' },
  logistics: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-700 dark:text-cyan-400', fill: '#06b6d4', dot: 'bg-cyan-500' },
};

const CATEGORY_ICONS: Record<ContactCategory, React.ElementType> = {
  mechanic: Wrench,
  wholesaler: Building2,
  auction: Gavel,
  insider: FileText,
  collector: Award,
  underground: Skull,
  logistics: Truck,
};

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  graph,
  onUnlockContact,
  onCompleteQuest,
  playerCash,
  playerFavours,
  playerRep,
  playerCars = [],
  currentUserId = 'user_default',
  currentUsername = 'Alex Flipper',
  onFlash = () => {},
}) => {
  const [networkSubTab, setNetworkSubTab] = useState<'graph' | 'players' | 'b2b'>('graph');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Graph Pan / Zoom State with smooth bounds
  const [pan, setPan] = useState({ x: 380, y: 260 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Live Player Network State (Loaded from backend)
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [myPlayerLinks, setMyPlayerLinks] = useState<string[]>([]);
  const [b2bListings, setB2bListings] = useState<any[]>([]);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedCarToList, setSelectedCarToList] = useState<Car | null>(null);
  const [b2bPriceInput, setB2bPriceInput] = useState('');

  // Fetch backend players & market
  const fetchBackendNetwork = () => {
    fetch('/api/auth/players')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.players) setOnlinePlayers(d.players);
      })
      .catch(() => {});

    fetch(`/api/network/connections/${currentUserId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.connections) {
          const ids = d.connections.map((c: any) => (c.from === currentUserId ? c.to : c.from));
          setMyPlayerLinks(ids);
        }
      })
      .catch(() => {});

    fetch('/api/network/b2b-market')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.listings) setB2bListings(d.listings);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBackendNetwork();
    const interval = setInterval(fetchBackendNetwork, 8000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const contactsList = useMemo(() => Object.values(graph.contacts), [graph.contacts]);
  const activeContacts = useMemo(() => contactsList.filter((c) => c.status === 'active'), [contactsList]);

  // Default selection
  useEffect(() => {
    if (!selectedId && activeContacts.length > 0) {
      setSelectedId(activeContacts[0].id);
    }
  }, [activeContacts, selectedId]);

  // Compute node coordinates
  const nodeCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    coords[graph.rootId] = { x: 0, y: 0 };

    const total = contactsList.length;
    contactsList.forEach((c, idx) => {
      const isInner = c.status === 'active' || c.status === 'revealed';
      const radius = isInner ? 190 + (idx % 2) * 45 : 330 + (idx % 2) * 45;
      const angle = (idx / total) * Math.PI * 2;
      coords[c.id] = {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      };
    });
    return coords;
  }, [contactsList, graph.rootId]);

  const activePath = useMemo(() => {
    if (!selectedId) return [];
    return findPathToContact(graph, selectedId);
  }, [graph, selectedId]);

  const selectedContact = selectedId ? graph.contacts[selectedId] : null;

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contactsList.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contactsList, categoryFilter, searchQuery]);

  // Smooth Drag & Zoom Handlers with wheel clamp
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('.node-element')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.min(2.2, Math.max(0.4, z * zoomFactor)));
  };

  // Connect to Player via Backend
  const handleConnectPlayer = (targetPlayerId: string, targetName: string) => {
    sound.playUnlock();
    fetch('/api/network/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: currentUserId, toUserId: targetPlayerId }),
    })
      .then((r) => r.json())
      .then(() => {
        setMyPlayerLinks((prev) => [...prev, targetPlayerId]);
        onFlash(`Formed partnership with ${targetName}! B2B wholesale discounts unlocked.`);
      })
      .catch(() => {});
  };

  // List Car on B2B Wholesale Market
  const handlePostB2bCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarToList || !b2bPriceInput) return;
    sound.playCash();

    fetch('/api/network/b2b-market/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: currentUserId,
        sellerName: currentUsername,
        car: selectedCarToList,
        askPrice: +b2bPriceInput,
        notes: 'Verified wholesale runner with full inspection sheet.',
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setIsListingModalOpen(false);
          setSelectedCarToList(null);
          setB2bPriceInput('');
          fetchBackendNetwork();
          onFlash('Vehicle posted to Player B2B Wholesale Market!');
        }
      })
      .catch(() => {});
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Network Header Banner (Liquid Glass) */}
      <div className="liquid-glass rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Network Connections &amp; Player Registry
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {activeContacts.length} Contacts · {onlinePlayers.length} Live Players
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Explore your expanding procedural web of mechanics, fleet wholesalers, and scrap kings.
              Connect directly to actual registered players and trade in the B2B Wholesale Exchange.
            </p>
          </div>

          {/* Sub-tab Switcher (Procedural Graph vs Live Players vs B2B Market) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-md">
            <button
              onClick={() => setNetworkSubTab('graph')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                networkSubTab === 'graph'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>Relationship Graph</span>
            </button>
            <button
              onClick={() => setNetworkSubTab('players')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                networkSubTab === 'players'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Online Players ({onlinePlayers.length})</span>
            </button>
            <button
              onClick={() => setNetworkSubTab('b2b')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                networkSubTab === 'b2b'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>B2B Exchange ({b2bListings.length})</span>
            </button>
          </div>
        </div>

        {/* Filter bar for graph view */}
        {networkSubTab === 'graph' && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'mechanic', 'wholesaler', 'auction', 'insider', 'collector', 'underground', 'logistics'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer capitalize ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search contacts, orgs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs liquid-glass-input rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: PROCEDURAL GRAPH VIEW */}
      {networkSubTab === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Graph Canvas Container */}
          <div className="lg:col-span-8 liquid-glass rounded-2xl overflow-hidden shadow-sm relative h-[580px] select-none flex flex-col">
            {/* Zoom & Pan Controls */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-xl border border-white/40 dark:border-white/10 shadow-sm">
              <button
                onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setPan({ x: 380, y: 260 });
                  setZoom(1);
                }}
                className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Path Tracer Header Bar */}
            {activePath.length > 1 && (
              <div className="absolute top-3 left-3 z-10 bg-amber-500/15 dark:bg-amber-500/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 text-amber-900 dark:text-amber-200 shadow-sm">
                <Compass className="w-3.5 h-3.5" />
                <span>Path:</span>
                <span className="font-semibold">
                  {activePath
                    .map((id) => (id === graph.rootId ? 'You' : graph.contacts[id]?.name.split(' ')[0] || id))
                    .join(' → ')}
                </span>
              </div>
            )}

            {/* Interactive SVG Canvas */}
            <div
              className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            >
              <svg ref={svgRef} className="w-full h-full" style={{ width: '100%', height: '100%' }}>
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="1" fill="currentColor" className="text-slate-300 dark:text-slate-700" />
                    </pattern>
                  </defs>
                  <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#grid)" />

                  {/* Distance Rings */}
                  <circle cx="0" cy="0" r="190" fill="none" stroke="currentColor" strokeDasharray="4 4" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
                  <circle cx="0" cy="0" r="330" fill="none" stroke="currentColor" strokeDasharray="4 4" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />

                  {/* Branching Links */}
                  {graph.links.map((link, idx) => {
                    const src = nodeCoords[link.source];
                    const tgt = nodeCoords[link.target];
                    if (!src || !tgt) return null;

                    const isPath =
                      activePath.includes(link.source) &&
                      activePath.includes(link.target) &&
                      Math.abs(activePath.indexOf(link.source) - activePath.indexOf(link.target)) === 1;

                    return (
                      <g key={idx}>
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke={isPath ? '#f59e0b' : '#94a3b8'}
                          strokeWidth={isPath ? 3.5 : link.strength}
                          strokeOpacity={isPath ? 0.95 : 0.3}
                          strokeDasharray={isPath ? undefined : '2 2'}
                        />
                      </g>
                    );
                  })}

                  {/* Player Center Root Node */}
                  <g
                    transform="translate(0, 0)"
                    className="cursor-pointer"
                    onClick={() => setSelectedId(null)}
                  >
                    <circle cx="0" cy="0" r="30" fill="#2563eb" className="shadow-lg" />
                    <circle cx="0" cy="0" r="36" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 2" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">
                      YOU
                    </text>
                  </g>

                  {/* Procedural Contact Nodes */}
                  {contactsList.map((contact) => {
                    const coords = nodeCoords[contact.id];
                    if (!coords) return null;

                    const isSelected = selectedId === contact.id;
                    const isFiltered = filteredContacts.some((c) => c.id === contact.id);
                    const catStyle = CATEGORY_COLORS[contact.category];
                    const Icon = CATEGORY_ICONS[contact.category];

                    const isRumored = contact.status === 'rumored';
                    const isRevealed = contact.status === 'revealed';
                    const isActive = contact.status === 'active';

                    const radius = isActive ? 22 : isRevealed ? 18 : 15;

                    return (
                      <g
                        key={contact.id}
                        transform={`translate(${coords.x}, ${coords.y})`}
                        className="node-element cursor-pointer group"
                        onClick={() => {
                          sound.playClick();
                          setSelectedId(contact.id);
                        }}
                        opacity={isFiltered ? 1 : 0.25}
                      >
                        {isSelected && (
                          <circle
                            cx="0"
                            cy="0"
                            r={radius + 8}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3.5"
                            className="animate-pulse"
                          />
                        )}

                        <circle
                          cx="0"
                          cy="0"
                          r={radius}
                          fill={isActive ? catStyle.fill : isRevealed ? '#e2e8f0' : '#475569'}
                          stroke={isRevealed ? catStyle.fill : '#ffffff'}
                          strokeWidth={isRevealed ? 2.5 : 2}
                          strokeDasharray={isRevealed ? '3 3' : undefined}
                          className="transition-transform group-hover:scale-110"
                        />

                        {isRumored ? (
                          <text x="0" y="4" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="bold">
                            ?
                          </text>
                        ) : (
                          <foreignObject x={-10} y={-10} width="20" height="20">
                            <div className="w-full h-full flex items-center justify-center text-white">
                              <Icon className={`w-3.5 h-3.5 ${isRevealed ? 'text-slate-700' : 'text-white'}`} />
                            </div>
                          </foreignObject>
                        )}

                        <text
                          x="0"
                          y={radius + 14}
                          textAnchor="middle"
                          className="text-[11px] font-sans font-medium fill-slate-800 dark:fill-slate-200 select-none pointer-events-none"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                        >
                          {isRumored ? 'Rumored Contact' : contact.name.split(' ')[0]}
                        </text>

                        {isActive && (
                          <text
                            x="0"
                            y={radius + 24}
                            textAnchor="middle"
                            className="text-[9px] fill-amber-500 font-mono"
                          >
                            {'★'.repeat(contact.quality)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {/* Contact Dossier Sidebar (Liquid Glass) */}
          <div className="lg:col-span-4 liquid-glass rounded-2xl p-5 shadow-sm flex flex-col gap-4 max-h-[580px] overflow-y-auto">
            {selectedContact ? (
              <>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${CATEGORY_COLORS[selectedContact.category].bg} ${CATEGORY_COLORS[selectedContact.category].text} border ${CATEGORY_COLORS[selectedContact.category].border} shadow-sm`}>
                        {React.createElement(CATEGORY_ICONS[selectedContact.category], { className: 'w-6 h-6' })}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">
                          {selectedContact.status === 'rumored' ? 'Rumored Contact' : selectedContact.name}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{selectedContact.title}</span>
                          <span>·</span>
                          <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                            {selectedContact.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500 text-sm">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < selectedContact.quality ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 liquid-glass-card p-3 rounded-xl">
                    <p className="italic">"{selectedContact.bio}"</p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between text-[11px] text-slate-500">
                      <span>Location: {selectedContact.location}</span>
                      <span>Org: {selectedContact.organization}</span>
                    </div>
                  </div>
                </div>

                {/* Trust Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Trust &amp; Affinity</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedContact.trust}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${selectedContact.trust}%` }}
                    />
                  </div>
                </div>

                {/* Unlock Button if Revealed */}
                {selectedContact.status === 'revealed' && (
                  <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300 text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Ready for Introduction</span>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      {selectedContact.introReq.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-900 text-xs">
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        Cost:{' '}
                        {selectedContact.introReq.type === 'free'
                          ? 'Free'
                          : selectedContact.introReq.type === 'cash'
                          ? fmt(selectedContact.introReq.cost || 50)
                          : '1 Social Favor'}
                      </span>
                      <button
                        onClick={() => {
                          sound.playUnlock();
                          onUnlockContact(selectedContact.id);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Connect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Perks */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                    Connection Perks
                  </h4>
                  <div className="space-y-2">
                    {selectedContact.perks.map((perk) => (
                      <div
                        key={perk.id}
                        className="p-2.5 rounded-xl liquid-glass-card text-xs"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{perk.title}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                          {perk.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quests with Strict Verification */}
                {selectedContact.quests.length > 0 && selectedContact.status === 'active' && (
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                      Requests &amp; Career Bounties
                    </h4>
                    <div className="space-y-2.5">
                      {selectedContact.quests.map((quest) => {
                        let canFulfill = false;
                        let missingDetail = '';
                        let matchingCar: Car | null = null;

                        if (quest.targetType === 'lend_money') {
                          const needed = quest.criteria?.amount || 350;
                          canFulfill = playerCash >= needed;
                          if (!canFulfill) missingDetail = `Requires ${fmt(needed)} cash in account (You have ${fmt(playerCash)})`;
                        } else if (quest.targetType === 'bring_car') {
                          const matching = playerCars.filter((c) => {
                            const cat = CAT[c.cid];
                            if (!cat) return false;
                            if (quest.criteria?.cls && cat.cls !== quest.criteria.cls) return false;
                            if (quest.criteria?.cleanTitleOnly && c.title !== 'clean') return false;
                            if (quest.criteria?.maxKm && c.shown > quest.criteria.maxKm) return false;
                            return true;
                          });
                          canFulfill = matching.length > 0;
                          matchingCar = matching[0] || null;
                          if (!canFulfill) {
                            missingDetail = `Requires ${quest.criteria?.cls ? quest.criteria.cls.toUpperCase() : 'vehicle'} with clean title ${quest.criteria?.maxKm ? `under ${quest.criteria.maxKm.toLocaleString()} km` : ''} in your garage (0 matching in lot)`;
                          }
                        } else {
                          canFulfill = playerCars.length > 0 || playerCash >= 500;
                          if (!canFulfill) missingDetail = `Must own at least 1 reconditioned vehicle to prove trade reliability`;
                        }

                        return (
                          <div
                            key={quest.id}
                            className={`p-3.5 rounded-2xl liquid-glass-card text-xs space-y-2 border ${
                              quest.completed
                                ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/20'
                                : canFulfill
                                ? 'border-blue-500/40'
                                : 'border-slate-200/60 dark:border-slate-700/60 opacity-90'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {quest.title}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                +{quest.rewardTrust}% Trust · {fmt(quest.rewardCash)} Reward
                              </span>
                            </div>

                            <p className="text-slate-500 text-[11px] leading-relaxed">
                              {quest.description}
                            </p>

                            {quest.completed ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px] pt-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed &amp; Bounty Paid ({fmt(quest.rewardCash)})</span>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className={`text-[11px] font-mono ${canFulfill ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {canFulfill
                                    ? matchingCar
                                      ? `Ready: Deliver ${CAT[matchingCar.cid]?.name || 'Vehicle'} (VIN: ${matchingCar.vin.slice(0, 8)}...)`
                                      : 'Criteria satisfied! Ready to fulfill.'
                                    : `Pending: ${missingDetail}`}
                                </span>

                                <button
                                  onClick={() => {
                                    if (!canFulfill) return;
                                    sound.playCash();
                                    onCompleteQuest(selectedContact.id, quest.id);
                                  }}
                                  disabled={!canFulfill}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                                    canFulfill
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  {canFulfill ? `Deliver & Claim ${fmt(quest.rewardCash)}` : 'Criteria Unmet'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Select a contact on the relationship canvas to view their profile, perks, and requests.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LIVE PLAYERS REGISTRY */}
      {networkSubTab === 'players' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlinePlayers.map((player) => {
              const isMe = player.id === currentUserId;
              const isConnected = myPlayerLinks.includes(player.id);

              return (
                <div
                  key={player.id}
                  className="liquid-glass-card rounded-2xl p-5 flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {player.username}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">
                        {player.region}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {player.dealershipName}
                    </span>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <div>Reputation: <b className="text-slate-900 dark:text-white">{player.rep}/100</b></div>
                      <div>Net Worth: <b className="text-slate-900 dark:text-white">{fmt(player.netWorth)}</b></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    {isMe ? (
                      <span className="text-slate-400 italic">Your Dealership</span>
                    ) : isConnected ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected Partner</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnectPlayer(player.id, player.username)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Form Partnership
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: B2B WHOLESALE EXCHANGE */}
      {networkSubTab === 'b2b' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <span>Player-to-Player B2B Wholesale Market</span>
            </h3>

            <button
              onClick={() => setIsListingModalOpen(true)}
              disabled={playerCars.length === 0}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>List Car for Other Players</span>
            </button>
          </div>

          {b2bListings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 liquid-glass rounded-2xl">
              No vehicles currently listed on the B2B wholesale exchange. Be the first to list a car from your garage!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {b2bListings.map((l) => (
                <div
                  key={l.id}
                  className="liquid-glass-card rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="h-32 rounded-xl overflow-hidden mb-2">
                      <CarPhotoCard car={l.car} compact={true} className="w-full h-full border-0" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {l.car.shown.toLocaleString()} km
                      </span>
                      <span className="font-mono font-bold text-base text-emerald-600">
                        {fmt(l.askPrice)}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 block mt-1">
                      Seller: <b className="text-slate-800 dark:text-slate-200">{l.sellerName}</b>
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">
                      "{l.notes}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                    {l.sellerId === currentUserId ? (
                      <span className="text-slate-400 text-[11px] italic">Your Listing</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (playerCash < l.askPrice) {
                            onFlash('Insufficient cash to purchase wholesale vehicle.');
                            return;
                          }
                          sound.playCash();
                          fetch('/api/network/b2b-market/buy', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ listingId: l.id, buyerId: currentUserId }),
                          })
                            .then((r) => r.json())
                            .then((d) => {
                              if (d.success) {
                                fetchBackendNetwork();
                                onFlash(`Bought wholesale vehicle from ${l.sellerName} for ${fmt(l.askPrice)}!`);
                              }
                            });
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                      >
                        Buy Wholesale
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: List Car on B2B Wholesale Market */}
      {isListingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="liquid-glass rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              List Vehicle to Player Wholesale Market
            </h3>

            <form onSubmit={handlePostB2bCar} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Select Car from Your Garage</label>
                <select
                  value={selectedCarToList?.uid || ''}
                  onChange={(e) => {
                    const c = playerCars.find((x) => x.uid === +e.target.value);
                    setSelectedCarToList(c || null);
                  }}
                  className="w-full p-2 rounded-lg liquid-glass-input text-slate-900 dark:text-white cursor-pointer"
                  required
                >
                  <option value="">Select a car...</option>
                  {playerCars.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      VIN: {c.vin.slice(0, 10)}... · Invested: {fmt(c.basis)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Wholesale Asking Price ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 2400"
                  value={b2bPriceInput}
                  onChange={(e) => setB2bPriceInput(e.target.value)}
                  className="w-full p-2 rounded-lg liquid-glass-input font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsListingModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Post to Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
