import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Derives "active view name" from current route and syncs it to <body class="is-{name}">.
 *
 * View names are lowercase kebab-case, derived from route.name.
 * Writes to <body> so scoped styles in any view can target via :global(body.is-pit) pattern.
 */

const ROUTE_TO_VIEW = {
  // Arena / Club Mode
  ArenaFightClub: 'pit',
  ArenaPit: 'pit',
  ArenaFight: 'preparation',
  ArenaFightV2: 'preparation',
  Fight: 'fight',
  AgentDetail: 'detail',
  AgentDetailV2: 'detail',
  CreateAgent: 'create',
  CreateAgentV2: 'create',

  // Profile (all sub-routes → same view name)
  Profile: 'profile',
  ProfileV2: 'profile',
  Balance: 'profile',
  Wallet: 'profile',
  Account: 'profile',
  Skins: 'profile',
  UserProfile: 'profile',

  // Core screens
  Training: 'training',
  TrainingV2: 'training',
  Matchmaking: 'mm',
  MatchmakingV2: 'mm',
  Ratings: 'ratings',
  RatingsV2: 'ratings',
  Clan: 'clan',
  ClanV2: 'clan',
  Friends: 'friends',
  Spectate: 'spectate',

  // Auth / static
  Home: 'home',
  Login: 'auth',
  Signup: 'auth',
  Reset: 'auth',
  TelegramLogin: 'auth',
};

const ALL_VIEW_CLASSES = [
  'pit', 'preparation', 'fight', 'detail', 'create',
  'profile', 'training', 'mm', 'ratings', 'clan',
  'friends', 'spectate', 'home', 'auth', 'default',
];

export function useActiveView() {
  const route = useRoute();

  const activeView = computed(() => {
    if (!route.name) return 'default';
    return ROUTE_TO_VIEW[route.name] || 'default';
  });

  // Sync to body class
  watchEffect(() => {
    const view = activeView.value;
    ALL_VIEW_CLASSES.forEach(v => document.body.classList.remove(`is-${v}`));
    document.body.classList.add(`is-${view}`);
  });

  return { activeView };
}
