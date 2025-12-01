// Night orders are usually dynamic based on script. 
// For simplicity in this demo, we merge them or check presence.
// In a real app, define night order per script.
// NOTE: Only include roles that are defined in ROLES object above.
export const NIGHT_ORDER_FIRST = [
  'philosopher', 'poisoner', 'snake_charmer', 'evil_twin', 'witch', 'cerenovus',
  'minstrel', 'godfather', 'devil_advocate', 'lunatic', 'exorcist', 'innkeeper', 'gambler', 'chambermaid', 'sailor', 'courtier',
  'grandmother', 'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'butler', 'spy',
  'clockmaker', 'dreamer', 'seamstress', 'mathematician'
];

export const NIGHT_ORDER_OTHER = [
  'philosopher', 'poisoner', 'snake_charmer', 'witch', 'cerenovus', 'pit_hag',
  'monk', 'exorcist', 'innkeeper', 'gambler', 'chambermaid', 'sailor', 'courtier',
  'godfather', 'devil_advocate', 'assassin',
  'imp', 'zombuul', 'pukka', 'shabaloth', 'po', 'fang_gu', 'vigormortis', 'no_dashii', 'vortox',
  'scarlet_woman', 'ravenkeeper', 'undertaker', 'empath', 'fortune_teller', 'butler', 'spy',
  'dreamer', 'flowergirl', 'town_crier', 'oracle', 'seamstress', 'mathematician', 'juggler', 'artist', 'savant', 'barber', 'sweetheart', 'sage', 'mutant'
];
