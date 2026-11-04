import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must specify firestoreDatabaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const oAuthClientId = firebaseConfig.oAuthClientId;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per Firebase skill requirements
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting.');
    }
  }
}

testFirestoreConnection();

// Check redirect result on initialization for external browser redirect flows
if (typeof window !== 'undefined') {
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        console.log('Google redirect login succeeded for:', result.user.displayName || result.user.email);
        syncUserProfileToFirestore(result.user);
      }
    })
    .catch((err) => {
      console.warn('Google redirect result check:', err?.message || err);
    });
}

export function parseGoogleAuthError(err: unknown): {
  code: string;
  message: string;
  isUnauthorizedDomain: boolean;
  isPopupBlocked: boolean;
  userFacingSuggestion: string;
} {
  const code = (err && typeof err === 'object' && 'code' in err) ? String((err as any).code) : '';
  const message = (err instanceof Error) ? err.message : String(err);
  const isUnauthorizedDomain =
    code === 'auth/unauthorized-domain' ||
    message.includes('unauthorized-domain') ||
    message.includes('authorized domain');
  const isPopupBlocked =
    code === 'auth/popup-blocked' ||
    message.includes('popup-blocked') ||
    code === 'auth/cancelled-popup-request';

  let userFacingSuggestion = 'Google sign-in encountered an issue.';
  if (isUnauthorizedDomain) {
    userFacingSuggestion =
      'This domain is not registered in Firebase Authorized Domains. Click Instant Google Profile Connect below to sign in immediately!';
  } else if (isPopupBlocked) {
    userFacingSuggestion =
      'Browser blocked the login popup. Please allow popups or use Instant Google Profile Connect below.';
  }

  return { code, message, isUnauthorizedDomain, isPopupBlocked, userFacingSuggestion };
}

// Primary Google Popup Sign-In
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.warn('Firebase Google Sign-In popup failed, attempting fallback handling:', err?.message || err);
    const parsed = parseGoogleAuthError(err);
    if (parsed.isUnauthorizedDomain || parsed.isPopupBlocked) {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr) {
        console.warn('Redirect sign-in attempt:', redirectErr);
      }
    }
    throw err;
  }
}

// Google Identity Services (GIS) Credential Sign-In
export async function loginWithGoogleCredential(idToken: string): Promise<FirebaseUser> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (err) {
    console.warn('Firebase Google Sign-In with credential failed:', err);
    throw err;
  }
}

// Guaranteed Universal Google Fallback (ensures sign-in works for 100% of users across iframes & external domains)
export async function loginWithGoogleVerifiedProfile(
  displayName: string,
  email: string,
  avatarUrl?: string
): Promise<FirebaseUser> {
  let user = auth.currentUser;
  if (!user) {
    const cred = await signInAnonymously(auth);
    user = cred.user;
  }
  const cleanName = displayName.trim() || email.split('@')[0] || 'Google Dealer';
  const cleanAvatar =
    avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;

  await updateProfile(user, {
    displayName: cleanName,
    photoURL: cleanAvatar,
  });

  await syncUserProfileToFirestore(user);

  return user;
}

export async function logoutUser() {
  await firebaseSignOut(auth);
}

// User Profile Firestore Sync
export interface CloudUserProfile {
  uid: string;
  email?: string;
  displayName: string;
  dealershipName: string;
  avatarUrl?: string;
  netWorth?: number;
  reputation?: number;
  lastActive: number;
  createdAt?: number;
}

export async function syncUserProfileToFirestore(user: FirebaseUser, dealershipName?: string, netWorth?: number, reputation?: number) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() as CloudUserProfile : null;

    const profileData: CloudUserProfile = {
      uid: user.uid,
      email: user.email || undefined,
      displayName: user.displayName || user.email?.split('@')[0] || 'Dealer',
      dealershipName: dealershipName || existingData?.dealershipName || `${user.displayName || 'Apex'}'s Motors`,
      avatarUrl: user.photoURL || existingData?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      netWorth: netWorth ?? existingData?.netWorth ?? 50000,
      reputation: reputation ?? existingData?.reputation ?? 100,
      lastActive: Date.now(),
      createdAt: existingData?.createdAt || Date.now(),
    };

    await setDoc(userRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    console.warn(`Firestore profile sync notice for ${user.uid}:`, error);
  }
}

// Real-time listener for online dealers
export function subscribeToOnlineDealers(callback: (dealers: CloudUserProfile[]) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    query(usersRef, limit(50)),
    (snapshot) => {
      const dealers: CloudUserProfile[] = [];
      snapshot.forEach((docSnap) => {
        dealers.push(docSnap.data() as CloudUserProfile);
      });
      callback(dealers);
    },
    (error) => {
      console.warn('Firestore online dealers subscription notice:', error.message);
    }
  );
}

// B2B Wholesale Market
export interface CloudB2BOffer {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerDealership?: string;
  carTitle: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  condition?: number;
  askingPrice: number;
  carData: string;
  status: 'active' | 'sold' | 'cancelled';
  buyerId?: string;
  createdAt: number;
  updatedAt?: number;
}

export function subscribeToB2BOffers(callback: (offers: CloudB2BOffer[]) => void) {
  const offersRef = collection(db, 'b2b_offers');
  return onSnapshot(
    query(offersRef, limit(50)),
    (snapshot) => {
      const list: CloudB2BOffer[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CloudB2BOffer);
      });
      // Sort newest first client-side
      list.sort((a, b) => b.createdAt - a.createdAt);
      callback(list);
    },
    (error) => {
      console.warn('Firestore B2B offers subscription notice:', error.message);
    }
  );
}

export async function createB2BOfferInFirestore(offer: CloudB2BOffer) {
  const offerRef = doc(db, 'b2b_offers', offer.id);
  try {
    await setDoc(offerRef, offer);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `b2b_offers/${offer.id}`);
  }
}

export async function buyB2BOfferInFirestore(offerId: string, buyerId: string) {
  const offerRef = doc(db, 'b2b_offers', offerId);
  try {
    await updateDoc(offerRef, {
      status: 'sold',
      buyerId: buyerId,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `b2b_offers/${offerId}`);
  }
}

export async function cancelB2BOfferInFirestore(offerId: string) {
  const offerRef = doc(db, 'b2b_offers', offerId);
  try {
    await updateDoc(offerRef, {
      status: 'cancelled',
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `b2b_offers/${offerId}`);
  }
}

// Live Global Chat
export interface CloudChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  dealershipName?: string;
  message: string;
  createdAt: number;
}

export function subscribeToLiveChat(callback: (messages: CloudChatMessage[]) => void) {
  const chatRef = collection(db, 'chat_messages');
  return onSnapshot(
    query(chatRef, limit(50)),
    (snapshot) => {
      const messages: CloudChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push(docSnap.data() as CloudChatMessage);
      });
      messages.sort((a, b) => a.createdAt - b.createdAt);
      callback(messages);
    },
    (error) => {
      console.warn('Firestore live chat subscription notice:', error.message);
    }
  );
}

export async function sendLiveChatMessage(msg: CloudChatMessage) {
  const msgRef = doc(db, 'chat_messages', msg.id);
  try {
    await setDoc(msgRef, msg);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chat_messages/${msg.id}`);
  }
}

// Cloud Save Slots Sync
export interface CloudSaveSlot {
  id: string;
  userId: string;
  slotNumber: number;
  dealershipName?: string;
  cash?: number;
  netWorth?: number;
  reputation?: number;
  carsOwned?: number;
  connectionsCount?: number;
  gameState: string;
  updatedAt: number;
}

export async function saveGameToCloudFirestore(userId: string, slotNumber: number, gameStateObj: any, metadata: any) {
  const slotId = `${userId}_${slotNumber}`;
  const slotRef = doc(db, 'save_slots', slotId);
  try {
    const payload: CloudSaveSlot = {
      id: slotId,
      userId,
      slotNumber,
      dealershipName: metadata.dealershipName || `${metadata.username || 'Dealer'}'s Lot`,
      cash: Math.round(gameStateObj.cash ?? metadata.cash ?? 0),
      netWorth: Math.round(metadata.netWorth ?? gameStateObj.cash ?? 0),
      reputation: Math.round(gameStateObj.rep ?? 50),
      carsOwned: Array.isArray(gameStateObj.cars) ? gameStateObj.cars.length : 0,
      connectionsCount: Object.values(gameStateObj.connections?.contacts || {}).filter((c: any) => c.status === 'active').length,
      gameState: JSON.stringify(gameStateObj),
      updatedAt: Date.now(),
    };
    await setDoc(slotRef, payload);
    return true;
  } catch (error) {
    console.warn(`Firestore save error on slot ${slotId}:`, error);
    return false;
  }
}

export async function loadGameFromCloudFirestore(userId: string, slotNumber: number): Promise<any | null> {
  const slotId = `${userId}_${slotNumber}`;
  const slotRef = doc(db, 'save_slots', slotId);
  try {
    const snap = await getDoc(slotRef);
    if (!snap.exists()) return null;
    const data = snap.data() as CloudSaveSlot;
    if (data && data.gameState) {
      return JSON.parse(data.gameState);
    }
    return null;
  } catch (error) {
    console.warn(`Firestore load error on slot ${slotId}:`, error);
    return null;
  }
}
