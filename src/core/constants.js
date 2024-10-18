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

// LISTING
export const LISTING = 1751760000;


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