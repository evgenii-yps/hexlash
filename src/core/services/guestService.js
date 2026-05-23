// Guest session service.
//
// Guest mode lets a player enter and play without an account. State lives ONLY
// in localStorage (no DB records, no JWT) and is intentionally lost on cache
// clear / private mode / другое устройство. This service owns: guest-id
// generation, the localStorage read/write, and building a synthetic MasterModel
// so the HUD (which reads master.userData.*) doesn't null-crash for guests.
//
// Guests pick from all six real archetypes (useCreateState.js). "Warden" is a
// legacy 3D visual-model name, not an archetype, so it is intentionally absent.

import { MasterModel } from "@/core/models/masterModel.js";
import UserModel from "@/core/models/userModel.js";

const GUEST_KEY = 'hexlash_guest_session';

// All six real archetype ids (mirrors ARCHETYPES order in useCreateState.js).
export const GUEST_ARCHETYPE_IDS = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];

export function generateGuestId() {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return 'guest_' + window.crypto.randomUUID();
    }
    return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function loadGuestSession() {
    try {
        const raw = localStorage.getItem(GUEST_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function saveGuestSession(session) {
    try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(session));
    } catch (e) {
        // localStorage unavailable (private mode quota etc.) — session stays
        // in-memory only. Acceptable: guest progress is ephemeral by design.
    }
}

export function clearGuestSession() {
    try {
        localStorage.removeItem(GUEST_KEY);
    } catch (e) { /* no-op */ }
}

export function createGuestSession(archetypeId) {
    return {
        guestId: generateGuestId(),
        archetypeId,
        wins: 0,
        streak: 0,
        signupPromptShown: false,
        createdAt: Date.now(),
    };
}

// Synthetic master so HUD components reading master.userData.* render cleanly.
// balance:0 keeps getBalance()/increaseBalance() numeric (UserModel constructor
// has no balance default). NOT a real account — flagged via masterState.isGuest.
export function buildGuestMaster(session) {
    const userData = new UserModel({
        id: session.guestId,
        login: 'Guest',
        name: 'Guest',
        balance: 0,
        skin: 'skin_m_1.png',
    });
    return new MasterModel({ id: session.guestId, userData });
}
