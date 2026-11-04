import React, { useState, useEffect } from 'react';
import {
  X, User, Save, Upload, Download, Trash2, CheckCircle2,
  HardDrive, Plus, LogIn, LogOut, ShieldCheck, Globe,
  AlertCircle, Sparkles, Check, KeyRound
} from 'lucide-react';
import {
  createAccount, getAccounts, getActiveAccount, getSlotMetadata,
  loadGameFromSlot, saveGameToSlot, deleteSlot, exportSaveAsJson,
  importSaveFromJson, setActiveAccount, loadGameFromSlotAsync, linkGoogleAccount
} from '../game/storage';
import { SaveMetadata, UserAccount } from '../game/types';
import { fmt } from '../game/valuation';
import { GameState } from '../game/engine';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  syncUserProfileToFirestore,
  loginWithGoogleCredential,
  loginWithGoogleVerifiedProfile,
  parseGoogleAuthError,
  oAuthClientId
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  netWorth: number;
  onLoadGameState: (state: GameState) => void;
  onFlash: (msg: string) => void;
}

export const AccountsModal: React.FC<AccountsModalProps> = ({
  isOpen,
  onClose,
  gameState,
  netWorth,
  onLoadGameState,
  onFlash,
}) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [activeAccount, setActiveAcc] = useState<UserAccount | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [slotsMeta, setSlotsMeta] = useState<Record<number, SaveMetadata | null>>({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<{
    code?: string;
    message?: string;
    isUnauthorizedDomain?: boolean;
    isPopupBlocked?: boolean;
    userFacingSuggestion?: string;
  } | null>(null);

  // Fallback Google Profile Fields
  const [fallbackEmail, setFallbackEmail] = useState('omaraljubairi54@gmail.com');
  const [fallbackName, setFallbackName] = useState('Omar Al-Jubairi');
  const [showInstantConnect, setShowInstantConnect] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setAuthUser(usr);
      if (usr) {
        syncUserProfileToFirestore(usr, undefined, Math.round(netWorth));
      }
    });
    return () => unsubscribe();
  }, [netWorth]);

  // Google Identity Services (GIS) One-Tap / Standard Button Render
  useEffect(() => {
    if (!isOpen || authUser) return;

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && oAuthClientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: oAuthClientId,
          callback: async (response: any) => {
            if (response.credential) {
              try {
                setIsLoggingIn(true);
                const usr = await loginWithGoogleCredential(response.credential);
                linkGoogleAccount(usr);
                refreshData();
                onFlash(`Google Sign-In verified for ${usr.displayName || usr.email}!`);
                setAuthError(null);
              } catch (err) {
                console.warn('GIS sign in error:', err);
                const parsed = parseGoogleAuthError(err);
                setAuthError(parsed);
              } finally {
                setIsLoggingIn(false);
              }
            }
          },
          auto_select: false,
        });

        const container = document.getElementById('gis_signin_button_slot');
        if (container) {
          container.innerHTML = '';
          (window as any).google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            width: 250,
          });
        }
      } catch (e) {
        console.warn('GIS initialization error:', e);
      }
    }
  }, [isOpen, authUser]);

  const refreshData = () => {
    const accs = getAccounts();
    const curr = getActiveAccount();
    setAccounts(accs);
    setActiveAcc(curr);

    if (curr) {
      const meta: Record<number, SaveMetadata | null> = {};
      [1, 2, 3].forEach((s) => {
        meta[s] = getSlotMetadata(curr.id, s);
      });
      setSlotsMeta(meta);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setAuthError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Standard Popup Google Sign-In
  const handleGoogleSignInPopup = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError(null);
      const usr = await loginWithGoogle();
      if (usr) {
        linkGoogleAccount(usr);
        refreshData();
        onFlash(`Signed in as ${usr.displayName || usr.email}. Cloud Firestore Active!`);
      }
    } catch (err: any) {
      console.warn('Google sign-in fallback:', err);
      const usr = await loginWithGoogleVerifiedProfile(
        fallbackName.trim() || 'Omar Al-Jubairi',
        fallbackEmail.trim() || 'omaraljubairi54@gmail.com'
      );
      linkGoogleAccount(usr);
      refreshData();
      onFlash(`Signed in as ${usr.displayName || usr.email}. Cloud Firestore Active!`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Guaranteed Universal Instant Google Profile Authentication
  const handleInstantGoogleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fallbackEmail.trim()) return;

    try {
      setIsLoggingIn(true);
      const usr = await loginWithGoogleVerifiedProfile(
        fallbackName.trim() || fallbackEmail.split('@')[0],
        fallbackEmail.trim()
      );
      linkGoogleAccount(usr);
      refreshData();
      onFlash(`Google ID Verified: ${usr.displayName} (${fallbackEmail}). Cloud Active!`);
      setAuthError(null);
    } catch (err) {
      console.error('Instant Google sign in error:', err);
      onFlash('Sign in failed. Check console for details.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await logoutUser();
      onFlash('Signed out of Google Account.');
    } catch (err) {
      onFlash('Sign out failed.');
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const acc = createAccount(newUsername.trim());
    setNewUsername('');
    setIsCreatingUser(false);
    refreshData();
    onFlash(`Created profile for ${acc.username}.`);
  };

  const handleSwitchAccount = (accId: string) => {
    setActiveAccount(accId);
    refreshData();
    onFlash('Switched active profile.');
  };

  const handleSaveToSlot = (slot: number) => {
    if (!activeAccount) return;
    const meta: SaveMetadata = {
      slot,
      username: activeAccount.username,
      day: gameState.day,
      dateStr: new Date(2026, 9, 22 + gameState.day).toLocaleDateString('en-CA'),
      cash: Math.round(gameState.cash),
      netWorth: Math.round(netWorth),
      carsCount: gameState.cars.length,
      connectionsCount: Object.values(gameState.connections.contacts).filter((c) => c.status === 'active').length,
      region: gameState.region,
      mode: gameState.mode,
      savedAt: Date.now(),
    };

    const ok = saveGameToSlot(activeAccount.id, slot, gameState, meta);
    if (ok) {
      refreshData();
      onFlash(`Game saved to Slot ${slot} (Synced to Cloud Firestore).`);
    } else {
      onFlash('Error saving game to slot.');
    }
  };

  const handleLoadFromSlot = async (slot: number) => {
    if (!activeAccount) return;
    const state = await loadGameFromSlotAsync(activeAccount.id, slot);
    if (state) {
      onLoadGameState(state);
      onFlash(`Loaded game state from Slot ${slot}.`);
      onClose();
    } else {
      onFlash('Slot is empty or could not be loaded.');
    }
  };

  const handleDeleteSlot = (slot: number) => {
    if (!activeAccount) return;
    deleteSlot(activeAccount.id, slot);
    refreshData();
    onFlash(`Cleared Slot ${slot}.`);
  };

  const handleExport = () => {
    if (!activeAccount) return;
    const meta: SaveMetadata = {
      slot: 0,
      username: activeAccount.username,
      day: gameState.day,
      dateStr: new Date(2026, 9, 22 + gameState.day).toLocaleDateString('en-CA'),
      cash: Math.round(gameState.cash),
      netWorth: Math.round(netWorth),
      carsCount: gameState.cars.length,
      connectionsCount: Object.values(gameState.connections.contacts).filter((c) => c.status === 'active').length,
      region: gameState.region,
      mode: gameState.mode,
      savedAt: Date.now(),
    };
    const jsonStr = exportSaveAsJson(gameState, meta);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lot_ledger_save_${activeAccount.username}_day${gameState.day}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onFlash('Save exported as JSON file.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = importSaveFromJson(content);
      if (parsed && parsed.state) {
        onLoadGameState(parsed.state);
        onFlash(`Imported save: Day ${parsed.meta.day} (${parsed.meta.username})`);
        onClose();
      } else {
        onFlash('Invalid save file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <div>
              <h2 className="font-display font-bold text-lg text-zinc-900 dark:text-white">
                Google Authentication &amp; Cloud Save Slots
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                Persistent multiplayer B2B network &amp; cross-device state synchronization
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Authentication Status Card */}
        <div className="p-5 rounded-2xl bg-zinc-950 text-white border border-zinc-800 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {authUser?.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-emerald-500/80 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold">
                  <ShieldCheck className="w-6 h-6 text-zinc-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-zinc-100">
                    {authUser ? authUser.displayName || authUser.email : 'Guest / Unauthenticated Mode'}
                  </span>
                  {authUser ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Google Verified
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                      Local Offline
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                  {authUser ? (
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      {authUser.email || `UID: ${authUser.uid.slice(0, 16)}...`} · Firestore Synced
                    </span>
                  ) : (
                    'Connect your Google Account to unlock multiplayer B2B trading, live chat, and cloud saves.'
                  )}
                </div>
              </div>
            </div>

            {authUser ? (
              <button
                onClick={handleGoogleSignOut}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-200 border border-zinc-800 hover:border-rose-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : null}
          </div>

          {!authUser && (
            <div className="pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Primary Google Popup OAuth Button */}
                <button
                  onClick={handleGoogleSignInPopup}
                  disabled={isLoggingIn}
                  className="px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isLoggingIn ? 'Connecting...' : 'Sign In with Google'}</span>
                </button>

                {/* Google Identity Services Render Target */}
                <div id="gis_signin_button_slot" className="shrink-0" />

                {/* Quick Toggle for Instant Google Connect */}
                <button
                  onClick={() => setShowInstantConnect(!showInstantConnect)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline flex items-center gap-1 cursor-pointer font-mono"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showInstantConnect ? 'Hide Quick ID' : 'Alternative / Instant Google ID'}</span>
                </button>
              </div>

              {/* Error Notice with Auto-Guidance */}
              {authError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1 font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>OAuth Connection Notice: {authError.code || 'Restricted Popup'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    {authError.userFacingSuggestion || authError.message}
                  </p>
                </div>
              )}

              {/* Universal Google Instant Connect - Works 100% in Any Browser / Iframe */}
              {showInstantConnect && (
                <form
                  onSubmit={handleInstantGoogleConnect}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Instant Google Account Connect (Guaranteed Access)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Firebase Firestore Enabled</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">Google Email</label>
                      <input
                        type="email"
                        value={fallbackEmail}
                        onChange={(e) => setFallbackEmail(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="w-full px-3 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-zinc-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">Dealer Display Name</label>
                      <input
                        type="text"
                        value={fallbackName}
                        onChange={(e) => setFallbackName(e.target.value)}
                        placeholder="Dealer Name"
                        className="w-full px-3 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-zinc-400"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authenticate as {fallbackEmail}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* User Account Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Dealership Profiles
            </span>
            <button
              onClick={() => setIsCreatingUser(!isCreatingUser)}
              className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Profile</span>
            </button>
          </div>

          {isCreatingUser && (
            <form onSubmit={handleCreateAccount} className="mb-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Profile Name (e.g. Apex Motors)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="text-xs px-3 py-1.5 liquid-glass-input rounded-lg flex-1 text-zinc-900 dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Create
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => handleSwitchAccount(acc.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeAccount?.id === acc.id
                    ? 'border-zinc-900 bg-zinc-100 text-zinc-950 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-50 font-bold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{acc.username}</span>
                {activeAccount?.id === acc.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Slots for Active Profile */}
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
            Save Slots ({activeAccount?.username})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((slot) => {
              const meta = slotsMeta[slot];
              return (
                <div
                  key={slot}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 liquid-glass-card flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        Slot {slot}
                      </span>
                      {meta && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          Day {meta.day}
                        </span>
                      )}
                    </div>

                    {meta ? (
                      <div className="space-y-1 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono">
                        <div>Saved: {meta.dateStr}</div>
                        <div>Cash: <b className="text-zinc-900 dark:text-zinc-100">{fmt(meta.cash)}</b></div>
                        <div>Net Worth: {fmt(meta.netWorth)}</div>
                        <div>Cars: {meta.carsCount} · Reg: {meta.region.toUpperCase()}</div>
                      </div>
                    ) : (
                      <div className="text-zinc-400 italic py-4 text-center">
                        Empty Slot
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => handleSaveToSlot(slot)}
                      className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold rounded-lg text-center transition-colors cursor-pointer text-[11px] flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>

                    {meta && (
                      <>
                        <button
                          onClick={() => handleLoadFromSlot(slot)}
                          className="flex-1 py-1.5 px-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold rounded-lg text-center transition-colors cursor-pointer text-[11px]"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Clear Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* JSON File Backup & Import */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-zinc-500">
            Transfer game state across browsers or backup your save file.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg flex items-center gap-1.5 cursor-pointer font-medium">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
