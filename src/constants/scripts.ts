import { ScriptDefinition } from '../types';

export const SCRIPTS: Record<string, ScriptDefinition> = {
  'tb': {
    id: 'tb',
    name: '暗流涌动 (Trouble Brewing)',
    roles: [
      'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin', 'slayer', 'soldier', 'mayor',
      'butler', 'drunk', 'recluse', 'saint',
      'poisoner', 'spy', 'scarlet_woman', 'baron',
      'imp'
    ]
  },
  'bmr': {
    id: 'bmr',
    name: '血月升起 (Bad Moon Rising)',
    roles: [
      'grandmother', 'sailor', 'chambermaid', 'exorcist', 'innkeeper', 'gambler', 'gossip', 'courtier', 'professor', 'minstrel', 'tea_lady', 'pacifist', 'fool',
      'goon', 'lunatic', 'tinker', 'moonchild',
      'godfather', 'devil_advocate', 'assassin', 'mastermind',
      'zombuul', 'pukka', 'shabaloth', 'po'
    ]
  },
  'sv': {
    id: 'sv',
    name: '紫罗兰教派 (Sects & Violets)',
    roles: [
      'clockmaker', 'dreamer', 'snake_charmer', 'mathematician', 'flowergirl', 'town_crier', 'oracle', 'savant', 'seamstress', 'philosopher', 'artist', 'juggler', 'sage',
      'mutant', 'sweetheart', 'barber', 'klutz',
      'witch', 'cerenovus', 'pit_hag', 'evil_twin',
      'fang_gu', 'vigormortis', 'no_dashii', 'vortox'
    ]
  }
};
