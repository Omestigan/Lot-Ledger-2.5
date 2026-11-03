import { SaveMetadata, UserAccount } from './types';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  syncUserProfileToFirestore,
  saveGameToCloudFirestore,
  loadGameFromCloudFirestore,
} from '../lib/firebase';

const ACCOUNTS_KEY = 'lotledger_accounts_v2';
const ACTIVE_ACCOUNT_KEY = 'lotledger_active_account_v2';
const SAVE_SLOT_PREFIX = 'lotledger_slot_';

export function getAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const defaultAcc: UserAccount = {
    id: 'user_default',
    username: 'Alex Flipper',
    createdAt: Date.now(),
    activeSlot: 1,
  };
  saveAccounts([defaultAcc]);
  return [defaultAcc];
}

export function saveAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {}
}

export function getActiveAccount(): UserAccount {
  const accounts = getAccounts();
  try {
    const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    const found = accounts.find((a) => a.id === activeId);
    if (found) return found;
  } catch (e) {}
  return accounts[0];
}

export function setActiveAccount(accountId: string) {
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  } catch (e) {}
}

export function createAccount(username: string): UserAccount {
  const accounts = getAccounts();
  const newAcc: UserAccount = {
    id: auth.currentUser?.uid || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: username.trim() || 'Rookie Flipper',
    createdAt: Date.now(),
    activeSlot: 1,
  };
  accounts.push(newAcc);
  saveAccounts(accounts);
  setActiveAccount(newAcc.id);

  // Sync with Firestore if authenticated
  if (auth.currentUser) {
    syncUserProfileToFirestore(auth.currentUser, `${newAcc.username}'s Auto Lot`);
  }

  // Also sync with backend Express API
  try {
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newAcc.id,
        username: newAcc.username,
        dealershipName: `${newAcc.username}'s Auto Lot`,
      }),
    }).catch(() => {});
  } catch (e) {}

  return newAcc;
}

export function getSlotStorageKey(userId: string, slot: number): string {
  return `${SAVE_SLOT_PREFIX}${userId}_${slot}`;
}

export function getSlotMetadata(userId: string, slot: number): SaveMetadata | null {
  try {
    const key = getSlotStorageKey(userId, slot);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.meta || null;
  } catch (e) {
    return null;
  }
}

export function linkGoogleAccount(googleUser: any, dealershipName?: string): UserAccount {
  const accounts = getAccounts();
  const uid = googleUser.uid;
  const username = googleUser.displayName || googleUser.email?.split('@')[0] || 'Pro Dealer';

  let found = accounts.find((a) => a.id === uid);
  if (!found) {
    found = accounts.find((a) => a.username.toLowerCase() === username.toLowerCase());
  }

  if (found) {
    found.id = uid;
    found.username = username;
  } else {
    found = {
      id: uid,
      username,
      createdAt: Date.now(),
      activeSlot: 1,
    };
    accounts.push(found);
  }

  saveAccounts(accounts);
  setActiveAccount(found.id);

  syncUserProfileToFirestore(googleUser, dealershipName || `${username}'s Auto Lot`);

  try {
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: found.id,
        username: found.username,
        dealershipName: dealershipName || `${username}'s Auto Lot`,
      }),
    }).catch(() => {});
  } catch (e) {}

  return found;
}

export function saveGameToSlot(userId: string, slot: number, gameState: any, meta: SaveMetadata): boolean {
  try {
    const key = getSlotStorageKey(userId, slot);
    const payload = {
      meta,
      state: gameState,
    };
    localStorage.setItem(key, JSON.stringify(payload));

    // Persist to Cloud Firestore if logged in with authenticated user UID
    if (auth.currentUser) {
      saveGameToCloudFirestore(auth.currentUser.uid, slot, gameState, meta);
    }

    // Also persist to Express API for offline/local server backup
    fetch(`/api/saves/${userId}/${slot}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    return true;
  } catch (e) {
    console.error('Failed to save to slot', e);
    return false;
  }
}

export async function loadGameFromSlotAsync(userId: string, slot: number): Promise<any | null> {
  // Try Cloud Firestore first if online using authenticated UID
  if (auth.currentUser) {
    const cloudData = await loadGameFromCloudFirestore(auth.currentUser.uid, slot);
    if (cloudData) return cloudData;
  }
  // Fallback to LocalStorage
  return loadGameFromSlot(userId, slot);
}

export function loadGameFromSlot(userId: string, slot: number): any | null {
  try {
    const key = getSlotStorageKey(userId, slot);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.state || null;
  } catch (e) {
    console.error('Failed to load from slot', e);
    return null;
  }
}

export function deleteSlot(userId: string, slot: number): boolean {
  try {
    const key = getSlotStorageKey(userId, slot);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

export function exportSaveAsJson(gameState: any, meta: SaveMetadata): string {
  return JSON.stringify({ meta, state: gameState }, null, 2);
}

export function importSaveFromJson(jsonString: string): { state: any; meta: SaveMetadata } | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.state && parsed.meta) {
      return parsed;
    }
  } catch (e) {}
  return null;
}
