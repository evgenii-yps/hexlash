export const COST_CREATE_CLUB = 10000;

// PUNCH
export const COST_PER_CLICK = 2;
export const MULTIPLAYER_EXACT_CLICK = 3;
export const SPEED_MOVE_PUNCH_MS = 1500;
export const BATCH_SEND_INTERVAL_MS = 11000;

// FC TOKEN
export const DECIMALS = 6;

// FIGHT
export const COUNTDOWN = 3; // Количество секунд перед началом боя

// CARD COMBAT (legacy)
export const MAX_HP = 100;
export const MAX_DECK_SIZE = 8;
export const MIN_DECK_SIZE = 4;
export const MAX_ROUNDS = 12;
export const ROUND_ANIMATION_MS = 1500;

// MODULE COMBAT
export const BASE_DAMAGE = 15;
export const POSITION_BONUS = 5;
export const DICE_MIN_INTERVAL = 5;
export const DICE_MAX_INTERVAL = 8;
export const EMERGENCY_HP_THRESHOLD = 30;

// LISTING
export const LISTING = 1783306800;


export const formatNumber = (num) => {
    if (num >= 1e6) {
        // Если число больше или равно 1 миллиону, сократить до "m"
        return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1e3) {
        // Если число больше или равно 1 тысяче, сократить до "k"
        return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
        // В остальных случаях возвращаем число как есть
        return num.toString();
    }
};