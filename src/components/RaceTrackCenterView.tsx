import React, { useState, useEffect } from 'react';
import {
  Flame, Flag, Trophy, ShieldAlert, DollarSign, Gauge, Users,
  CheckCircle2, Clock, Zap, ArrowRight, RefreshCw, Car as CarIcon, Play
} from 'lucide-react';
import { Car } from '../game/types';
import { GameState } from '../game/engine';
import { CAT } from '../game/data';
import { fmt } from '../game/valuation';
import { sound } from '../game/audio';
import {
  auth,
  CloudRaceInvite,
  CloudUserProfile,
  subscribeToOnlineDealers,
  subscribeToLiveRaceInvites,
  createRaceInviteInFirestore,
  updateRaceInviteStatusInFirestore
} from '../lib/firebase';
import {
  RACE_TRACKS,
  RaceTrack,
  calculateCarPerformanceMetrics
} from '../game/tuning';

interface RaceTrackCenterViewProps {
  state: GameState;
  onUpdateRacingStats: (result: {
    won: boolean;
    cashDelta: number;
    pinkSlipWonCar?: Car;
    pinkSlipLostCarUid?: number;
    eloChange: number;
  }) => void;
  onOpenTuningStudio: (car: Car) => void;
  onFlashNotification: (msg: string) => void;
  onOpenAccounts?: () => void;
}

export const RaceTrackCenterView: React.FC<RaceTrackCenterViewProps> = ({
  state,
  onUpdateRacingStats,
  onOpenTuningStudio,
  onFlashNotification,
  onOpenAccounts,
}) => {
  const [onlineDealers, setOnlineDealers] = useState<CloudUserProfile[]>([]);
  const [liveInvites, setLiveInvites] = useState<CloudRaceInvite[]>([]);
  
  // Race configuration state
  const [selectedTrackId, setSelectedTrackId] = useState<string>(RACE_TRACKS[0].id);
  const [selectedCarUid, setSelectedCarUid] = useState<number>(state.cars[0]?.uid || 0);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('ai_rival_apex');
  const [stakeType, setStakeType] = useState<'friendly' | 'cash' | 'pink_slip'>('cash');
  const [cashStakeInput, setCashStakeInput] = useState<number>(2000);

  // Active race animation & simulation state
  const [isSimulatingRace, setIsSimulatingRace] = useState(false);
  const [raceProgress, setRaceProgress] = useState(0); // 0 to 100
  const [playerSpeed, setPlayerSpeed] = useState(0);
  const [opponentSpeed, setOpponentSpeed] = useState(0);
  const [raceResultModal, setRaceResultModal] = useState<{
    won: boolean;
    playerTime: string;
    opponentTime: string;
    summary: string;
    cashDelta: number;
  } | null>(null);

  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid || 'guest_racer';
  const currentUserName = currentUser?.displayName || state.player?.name || 'Driver Alex';
  const currentDealership = state.player?.name ? `${state.player.name}'s Speed Shop` : 'Apex Motors';

  // Subscriptions to live B2B dealers & invites
  useEffect(() => {
    const unsubDealers = subscribeToOnlineDealers((dealers) => {
      setOnlineDealers(dealers);
    });

    const unsubInvites = subscribeToLiveRaceInvites(currentUserId, (invites) => {
      setLiveInvites(invites);
    });

    return () => {
      unsubDealers();
      unsubInvites();
    };
  }, [currentUserId]);

  const selectedTrack = RACE_TRACKS.find((t) => t.id === selectedTrackId) || RACE_TRACKS[0];
  const selectedCar = state.cars.find((c: Car) => c.uid === selectedCarUid) || state.cars[0];
  const playerMetrics = selectedCar ? calculateCarPerformanceMetrics(selectedCar) : null;

  // Send an invite to another player or challenge an AI Rival
  const handleSendRaceInvite = async () => {
    if (!selectedCar || !playerMetrics) {
      onFlashNotification('You must have an operational car in your garage to race!');
      return;
    }
    if (stakeType === 'cash' && state.cash < cashStakeInput) {
      onFlashNotification('Insufficient cash balance to cover your wager stake!');
      return;
    }

    sound.playClick();

    // Check if opponent is an AI rival
    if (selectedOpponentId.startsWith('ai_rival_')) {
      // Direct local simulated AI race!
      runRaceSimulation({
        opponentName: selectedOpponentId === 'ai_rival_apex' ? 'Marcus Vance (Apex GT3)' : 'Veloce AI Racer',
        opponentHp: Math.round(playerMetrics.hp * (0.88 + Math.random() * 0.28)),
        opponentZeroSixty: +(playerMetrics.zeroToSixtySec * (0.92 + Math.random() * 0.2)).toFixed(2),
        opponentHandling: Math.round(playerMetrics.handlingScore * (0.9 + Math.random() * 0.2)),
      });
      return;
    }

    // Multiplayer B2B Online player invite
    const opponent = onlineDealers.find((d) => d.uid === selectedOpponentId);
    const inviteObj: CloudRaceInvite = {
      id: `race_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderDealership: currentDealership,
      senderCar: {
        title: selectedCar.adTitle,
        hp: playerMetrics.hp,
        zeroToSixtySec: playerMetrics.zeroToSixtySec,
        quarterMileSec: playerMetrics.quarterMileSec,
        handlingScore: playerMetrics.handlingScore,
        carData: JSON.stringify(selectedCar),
      },
      targetUserId: selectedOpponentId,
      targetUserName: opponent?.displayName || 'Online Challenger',
      trackId: selectedTrack.id,
      trackName: selectedTrack.name,
      raceType: selectedTrack.type === 'drag_strip' ? 'drag' : 'circuit',
      stakeType,
      cashStake: stakeType === 'cash' ? cashStakeInput : 0,
      status: 'pending',
      createdAt: Date.now(),
    };

    const success = await createRaceInviteInFirestore(inviteObj);
    if (success) {
      sound.playCash();
      onFlashNotification(`Race challenge sent to ${opponent?.displayName || 'player'}!`);
    }
  };

  const runRaceSimulation = (opp: {
    opponentName: string;
    opponentHp: number;
    opponentZeroSixty: number;
    opponentHandling: number;
  }) => {
    if (!playerMetrics) return;

    setIsSimulatingRace(true);
    setRaceProgress(0);
    sound.playClick();

    // Score calculation based on track requirements
    let playerScore = 0;
    let opponentScore = 0;

    if (selectedTrack.favorsClass === 'acceleration') {
      playerScore = (15 - playerMetrics.zeroToSixtySec) * 2 + playerMetrics.hp * 0.15;
      opponentScore = (15 - opp.opponentZeroSixty) * 2 + opp.opponentHp * 0.15;
    } else if (selectedTrack.favorsClass === 'handling') {
      playerScore = playerMetrics.handlingScore * 1.5 + (15 - playerMetrics.zeroToSixtySec);
      opponentScore = opp.opponentHandling * 1.5 + (15 - opp.opponentZeroSixty);
    } else {
      playerScore = playerMetrics.hp * 0.1 + playerMetrics.handlingScore + (15 - playerMetrics.zeroToSixtySec);
      opponentScore = opp.opponentHp * 0.1 + opp.opponentHandling + (15 - opp.opponentZeroSixty);
    }

    // Add small driver reaction variance
    playerScore += Math.random() * 4 - 2;
    opponentScore += Math.random() * 4 - 2;

    const playerWon = playerScore >= opponentScore;
    const timeDelta = Math.abs(playerScore - opponentScore) * 0.08;
    const baseRunTime = selectedTrack.type === 'drag_strip' ? playerMetrics.quarterMileSec : 84.5;
    
    const pTime = playerWon ? baseRunTime : baseRunTime + timeDelta;
    const oTime = playerWon ? baseRunTime + timeDelta : baseRunTime;

    let step = 0;
    const interval = setInterval(() => {
      step += 4;
      setRaceProgress(Math.min(100, step));
      setPlayerSpeed(Math.round((step / 100) * playerMetrics.topSpeedKmh));
      setOpponentSpeed(Math.round((step / 100) * (playerMetrics.topSpeedKmh * (playerWon ? 0.96 : 1.04))));

      if (step >= 100) {
        clearInterval(interval);
        setIsSimulatingRace(false);

        let cashDelta = 0;
        let pinkSlipWonCar: Car | undefined;
        let pinkSlipLostUid: number | undefined;

        if (stakeType === 'cash') {
          cashDelta = playerWon ? cashStakeInput : -cashStakeInput;
        } else if (stakeType === 'pink_slip') {
          if (playerWon) {
            // Generate the opponent's vehicle title won in pink slip battle
            const randomCid = Math.floor(Math.random() * 8) + 1; // High performance catalog cars
            const catEntry = CAT[randomCid] || CAT[0];
            pinkSlipWonCar = {
              uid: Date.now() + Math.floor(Math.random() * 1000),
              cid: randomCid,
              trim: 2,
              color: ['Obsidian Black', '#18181b'],
              vin: `PINK_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
              owners: 2,
              use: 'personal',
              km: Math.floor(12000 + Math.random() * 28000),
              shown: Math.floor(12000 + Math.random() * 28000),
              rolled: false,
              tr: catEntry.tr,
              eng: catEntry.eng[0] || 'V8 Twin Turbo',
              q: 4,
              issues: [],
              rust: 0,
              dents: 0,
              repaint: false,
              gaps: false,
              interior: 1,
              water: false,
              lien: 0,
              lienPaid: true,
              tread: 95,
              modded: true,
              recall: false,
              receipts: 3,
              masked: false,
              detail: true,
              regd: true,
              reg: 'valid',
              idle: 0,
              basis: Math.round(catEntry.base * 1.3),
              bought: state.day,
              partGrade: 'new',
              winter: false,
              cloned: false,
              latent: [],
              job: null,
              sale: null,
              adTitle: `🏆 ${catEntry.year} ${catEntry.make} ${catEntry.model} (Pink Slip Trophy)`,
              title: 'clean',
              know: {
                issues: {},
                rust: 0,
                dents: 0,
                interior: 1,
                tires: { tread: 95, winter: false },
                accident: false,
                water: false,
                odo: true,
                odoSus: false,
                hist: { title: 'clean' },
                ppi: true,
                said: [],
                mech: null,
                full: true,
              },
              tuning: {
                stage: 2,
                parts: ['ecu_stage2', 'fi_cold_air_intake', 'exh_catback'],
                boostPsi: 1.4,
                gearRatioBias: 'short',
                suspensionStiffness: 8,
                totalInvested: 5200,
              },
            };
          } else {
            pinkSlipLostUid = selectedCar.uid;
          }
        }

        const eloChange = playerWon ? 24 : -18;
        onUpdateRacingStats({
          won: playerWon,
          cashDelta,
          pinkSlipWonCar,
          pinkSlipLostCarUid: pinkSlipLostUid,
          eloChange,
        });

        if (playerWon) sound.playCash();

        setRaceResultModal({
          won: playerWon,
          playerTime: `${pTime.toFixed(3)}s`,
          opponentTime: `${oTime.toFixed(3)}s`,
          summary: playerWon
            ? `Victory! Your ${selectedCar.adTitle} crossed the finish line ahead of ${opp.opponentName}.`
            : `Defeat. ${opp.opponentName} edged you out at the finish line by ${timeDelta.toFixed(3)}s.`,
          cashDelta,
        });
      }
    }, 120);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center shadow-lg font-bold">
            <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-black tracking-tight text-white">
                Race Track Center &amp; B2B Wager Circuit
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-white text-zinc-950 rounded-full">
                LIVE RACING
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Challenge online dealers to Drag, Circuit &amp; Pink Slip battles · Track Elo &amp; Metrics
            </p>
          </div>
        </div>

        {/* Player Racing HUD Stats */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Elo Rating</span>
            <span className="text-amber-400 font-bold">{state.racingStats?.eloRating || 1200} pts</span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Record</span>
            <span className="text-white font-bold">
              {state.racingStats?.wins || 0}W - {state.racingStats?.losses || 0}L
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">Pink Slips Taken</span>
            <span className="text-emerald-400 font-bold">+{state.racingStats?.pinkSlipsWon || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Track Selection & Challenger Lobby */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Race Setup & Track Selector (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Track Picker */}
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              <span>Select Sanctioned Race Track</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RACE_TRACKS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTrackId(track.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTrackId === track.id
                      ? 'bg-zinc-800/90 border-white shadow-xl'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-zinc-900 text-zinc-300">
                        {track.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">{track.difficulty}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{track.name}</h4>
                    <span className="text-[11px] font-mono text-zinc-400 block">{track.location} · {track.lengthKm} km</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 font-sans line-clamp-2 leading-relaxed">
                    {track.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle Staging Card */}
          {selectedCar && playerMetrics && (
            <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white">Staged Race Vehicle</h3>
                  {state.cars.length > 1 ? (
                    <select
                      value={selectedCar.uid}
                      onChange={(e) => {
                        sound.playClick();
                        setSelectedCarUid(Number(e.target.value));
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-zinc-600"
                    >
                      {state.cars.map((car: Car) => (
                        <option key={car.uid} value={car.uid}>
                          {car.adTitle} ({calculateCarPerformanceMetrics(car).hp} HP)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-zinc-400 font-mono">{selectedCar.adTitle}</p>
                  )}
                </div>
                <button
                  onClick={() => onOpenTuningStudio(selectedCar)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold hover:bg-amber-500/30 transition-all cursor-pointer shrink-0"
                >
                  Open Dyno Tune
                </button>
              </div>

              {/* Vehicle Specs Bar */}
              <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase">Power</span>
                  <span className="font-bold text-emerald-400">{playerMetrics.hp} HP</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase">0-60 MPH</span>
                  <span className="font-bold text-white">{playerMetrics.zeroToSixtySec}s</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase">1/4 Mile</span>
                  <span className="font-bold text-white">{playerMetrics.quarterMileSec}s</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase">Track Grip</span>
                  <span className="font-bold text-cyan-400">{playerMetrics.handlingScore}/100</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Challenger Selection & Wager Stakes (Right 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl space-y-5 font-mono">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Select Opponent Challenger</span>
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Pick a live online B2B network dealer or challenge the city AI rival.
              </p>
            </div>

            {/* Challenger Selector */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 block font-bold">Opponent:</label>
              <select
                value={selectedOpponentId}
                onChange={(e) => setSelectedOpponentId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-zinc-600"
              >
                <optgroup label="AI Rivals (Instant Race)">
                  <option value="ai_rival_apex">Marcus Vance — Apex Prime (Tuned 911 GT3)</option>
                  <option value="ai_rival_crown">Eleanor Sterling — Crown Heritage (M3 Comp)</option>
                  <option value="ai_rival_redline">Redline Syndicate AI — Modified Supra MK5</option>
                </optgroup>
                <optgroup label="Live B2B Online Dealers">
                  {onlineDealers.map((d) => (
                    <option key={d.uid} value={d.uid}>
                      {d.displayName} ({d.dealershipName})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Stake Wager Type */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 block font-bold">Match Stake Wager:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['friendly', 'cash', 'pink_slip'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      sound.playClick();
                      setStakeType(type);
                    }}
                    className={`py-2.5 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                      stakeType === type
                        ? type === 'pink_slip'
                          ? 'bg-rose-500 text-zinc-950 border-rose-400 font-black shadow-md'
                          : 'bg-white text-zinc-950 border-white shadow-md'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {type === 'pink_slip' ? 'Pink Slip' : type === 'cash' ? 'Cash Pot' : 'Friendly'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Stake Amount Slider if cash wager */}
            {stakeType === 'cash' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Cash Pot Wager (Each)</span>
                  <span className="font-bold text-emerald-400">{fmt(cashStakeInput)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={cashStakeInput}
                  onChange={(e) => setCashStakeInput(parseInt(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            )}

            {stakeType === 'pink_slip' && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  <strong>EXTREME RISK:</strong> Pink Slip wagers mean the winner drives home the loser's car title!
                </span>
              </div>
            )}

            {/* Start Race Button */}
            <button
              disabled={isSimulatingRace}
              onClick={handleSendRaceInvite}
              className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-sm font-mono transition-all shadow-2xl cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Launch Race Challenge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Simulation Overlay Animation */}
      {isSimulatingRace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 max-w-xl w-full text-center space-y-6 shadow-2xl font-mono">
            <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-3">
              <span className="text-amber-400 font-bold uppercase">{selectedTrack.name}</span>
              <span className="text-white font-bold">{raceProgress}% Complete</span>
            </div>

            {/* Speeds HUD */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-500 block">Your Speed</span>
                <span className="text-3xl font-black text-white">{playerSpeed} <span className="text-sm font-normal">km/h</span></span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs text-zinc-500 block">Opponent Speed</span>
                <span className="text-3xl font-black text-amber-400">{opponentSpeed} <span className="text-sm font-normal">km/h</span></span>
              </div>
            </div>

            {/* Progress Track Animation Bar */}
            <div className="space-y-1">
              <div className="h-4 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-150"
                  style={{ width: `${raceProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>Green Light</span>
                <span>Finish Line</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Race Outcome Modal */}
      {raceResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 max-w-md w-full text-center space-y-5 shadow-2xl font-mono">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl ${
              raceResultModal.won ? 'bg-emerald-950 border border-emerald-500' : 'bg-rose-950 border border-rose-500'
            }`}>
              {raceResultModal.won ? '🏆' : '💥'}
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">
                {raceResultModal.won ? 'RACE VICTORY!' : 'RACE DEFEAT'}
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-1 leading-relaxed">
                {raceResultModal.summary}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block">Your Lap Time</span>
                <span className="font-bold text-white text-base">{raceResultModal.playerTime}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Opponent Time</span>
                <span className="font-bold text-amber-400 text-base">{raceResultModal.opponentTime}</span>
              </div>
            </div>

            {raceResultModal.cashDelta !== 0 && (
              <div className={`text-base font-bold ${
                raceResultModal.cashDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {raceResultModal.cashDelta > 0 ? `+${fmt(raceResultModal.cashDelta)} Wager Won!` : `${fmt(raceResultModal.cashDelta)} Wager Lost`}
              </div>
            )}

            <button
              onClick={() => setRaceResultModal(null)}
              className="w-full py-3 rounded-2xl bg-white text-zinc-950 font-black text-xs cursor-pointer shadow-lg active:scale-95"
            >
              Back to Track Paddock
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
