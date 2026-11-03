import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

// Auth Helpers
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
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
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
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
      handleFirestoreError(error, OperationType.GET, 'users');
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
      handleFirestoreError(error, OperationType.GET, 'b2b_offers');
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
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
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
      dealershipName: metadata.dealershipName || 'My Dealership',
      cash: gameStateObj.player?.cash || 0,
      netWorth: metadata.netWorth || 0,
      reputation: gameStateObj.player?.reputation || 0,
      carsOwned: gameStateObj.player?.garage?.length || 0,
      connectionsCount: gameStateObj.connections?.unlockedConnections?.length || 0,
      gameState: JSON.stringify(gameStateObj),
      updatedAt: Date.now(),
    };
    await setDoc(slotRef, payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `save_slots/${slotId}`);
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
    handleFirestoreError(error, OperationType.GET, `save_slots/${slotId}`);
    return null;
  }
}
