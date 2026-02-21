import {MasterModel} from "@/core/models/masterModel.js";

export const MOCK_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.mock';

export const MOCK_USER_DATA = {
    id: '00000000-0000-0000-0000-000000000001',
    login: 'mock_player',
    name: 'Mock Player',
    avatarUrl: '',
    isBlocked: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    balance: 50000000,
    clubId: null,
    walletAddress: null,
    totalFights: 42,
    wins: 25,
    losses: 12,
    draws: 5,
    luckPercentage: 60,
    wonTokens: 1500,
    freeTokens: 500,
    lostTokens: 300,
    invitedUsers: 3,
    daysInClub: 0,
    noSkipDays: 0,
    achievements: [],
    skin: 'skin_m_1.png',
};

export function createMockMaster() {
    return new MasterModel({
        inviteId: 'MOCK01',
        email: 'mock@hexlash.dev',
        emailVerified: true,
        language: null,
        initialVerified: true,
        userData: {...MOCK_USER_DATA},
    });
}

export function isMockMode() {
    try {
        return __MOCK_MODE__ === true || __MOCK_MODE__ === 'true';
    } catch {
        return false;
    }
}
