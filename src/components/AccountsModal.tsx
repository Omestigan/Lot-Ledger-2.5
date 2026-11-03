import React, { useState, useEffect } from 'react';
import {
  X, User, Save, Upload, Download, Trash2, CheckCircle2,
  HardDrive, Plus, LogIn, LogOut, ShieldCheck, Globe
} from 'lucide-react';
import {
  createAccount, getAccounts, getActiveAccount, getSlotMetadata,
  loadGameFromSlot, saveGameToSlot, deleteSlot, exportSaveAsJson,
  importSaveFromJson, setActiveAccount, loadGameFromSlotAsync
} from '../game/storage';
import { SaveMetadata, UserAccount } from '../game/types';
import { fmt } from '../game/valuation';
import { GameState } from '../game/engine';
import { auth, loginWithGoogle, logoutUser, syncUserProfileToFirestore } from '../lib/firebase';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setAuthUser(usr);
      if (usr) {
        // Sync online account profile
        syncUserProfileToFirestore(usr, undefined, Math.round(netWorth));
      }
    });
    return () => unsubscribe();
  }, [netWorth]);

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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsLoggingIn(true);
      const usr = await loginWithGoogle();
      if (usr) {
        const username = usr.displayName || usr.email?.split('@')[0] || 'Pro Dealer';
        const acc = createAccount(username);
        refreshData();
        onFlash(`Signed in as ${username}. Cloud Firestore Sync Active!`);
      }
    } catch (err) {
      onFlash('Google Sign-In was cancelled or failed.');
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
      onFlash(`Game saved to Slot ${slot} (Synced to Cloud).`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              User Accounts &amp; Cloud Game Saves
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Authentication Status */}
        <div className="p-4 rounded-2xl bg-slate-900/80 text-white flex flex-wrap items-center justify-between gap-3 border border-slate-700">
          <div className="flex items-center gap-3">
            {authUser?.photoURL ? (
              <img src={authUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-blue-500/50" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {authUser ? authUser.displayName || authUser.email : 'Guest / Offline Mode'}
                </span>
                {authUser && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
                    <Globe className="w-2.5 h-2.5" /> Firestore Synced
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {authUser ? `Google ID: ${authUser.email}` : 'Sign in with Google to enable multiplayer trade & cloud saves across devices.'}
              </div>
            </div>
          </div>

          <div>
            {authUser ? (
              <button
                onClick={handleGoogleSignOut}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoggingIn ? 'Connecting...' : 'Sign In with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* User Account Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Active Dealership Profile
            </span>
            <button
              onClick={() => setIsCreatingUser(!isCreatingUser)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Local Profile</span>
            </button>
          </div>

          {isCreatingUser && (
            <form onSubmit={handleCreateAccount} className="mb-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Profile Name (e.g. Speedster Motors)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex-1 text-slate-900 dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  activeAccount?.id === acc.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{acc.username}</span>
                {activeAccount?.id === acc.id && (
                  <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Save Slots for Active Profile */}
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Save Slots ({activeAccount?.username})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((slot) => {
              const meta = slotsMeta[slot];
              return (
                <div
                  key={slot}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Slot {slot}
                      </span>
                      {meta && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Day {meta.day}
                        </span>
                      )}
                    </div>

                    {meta ? (
                      <div className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                        <div>Saved: {meta.dateStr}</div>
                        <div>Cash: <b className="text-slate-800 dark:text-slate-200">{fmt(meta.cash)}</b></div>
                        <div>Net Worth: {fmt(meta.netWorth)}</div>
                        <div>Cars: {meta.carsCount} · Reg: {meta.region.toUpperCase()}</div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic py-4 text-center">
                        Empty Slot
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleSaveToSlot(slot)}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-center transition-colors cursor-pointer text-[11px] flex items-center justify-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>

                    {meta && (
                      <>
                        <button
                          onClick={() => handleLoadFromSlot(slot)}
                          className="flex-1 py-1.5 px-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold rounded text-center transition-colors cursor-pointer text-[11px]"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
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
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Transfer game state across browsers or backup your save file.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer font-medium">
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
