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
export const MAX_ROUNDS = 10;
export const EXTRA_ROUNDS = 2;
export const EXTRA_ROUND_DAMAGE_MULTIPLIER = 2;
export const TOTAL_ROUNDS = MAX_ROUNDS + EXTRA_ROUNDS; // 12
export const ROUND_ANIMATION_MS = 1500;

// MODULE COMBAT
export const BASE_DAMAGE = 15;
export const POSITION_BONUS = 5;
export const DICE_COOLDOWN_ROUNDS = 3;
export const EMERGENCY_HP_THRESHOLD = 30;

// COACH ADVICE
export const COACH_MIN_ROUND = 6;
export const COACH_TRIGGER_CHANCE = 1.0;
export const COACH_BOOST_ROUNDS = 4;

// AUTO FIGHT
export const AUTO_FIGHT_MIN_INTERVAL = 60 * 60 * 1000;  // 60 minutes
export const AUTO_FIGHT_MAX_INTERVAL = 60 * 60 * 1000;  // 60 minutes
export const AUTO_FIGHT_MAX_PER_DAY = 24;
export const AUTO_FIGHT_MAX_PER_SESSION = 48;

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