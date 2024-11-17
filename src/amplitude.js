import amplitude from 'amplitude-js';

const AMPLITUDE_API_KEY = 'b8821737459f00f1058fd8ede71459fe';

amplitude.getInstance().init(AMPLITUDE_API_KEY);

export const ampli = amplitude.getInstance();