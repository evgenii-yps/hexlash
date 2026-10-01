// Привязка ролика к коммиту игры и к цифрам боя.
//
// Каждый прогон записывает: с какого коммита `main` снят ролик, что за коммит ветки,
// есть ли в ветке правки игры (должно быть 0 — всё снаружи), и «отпечаток цифр боя».
// Отпечаток — хэш файлов, которые определяют, как считается бой. Если он изменился
// относительно plan/fights.lock.json, бои ролика пересобираются от нового журнала
// событий, а зёрна подбираются заново — одной командой (`cli.mjs build` делает это сама).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { REPO } from './server.mjs';

const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// Всё, от чего зависит расчёт боя и решения легенды. Защищённые файлы бойца и арены — тоже.
export const COMBAT_FILES = [
  'src/data/combatBalance.js', 'src/data/buffBalance.js', 'src/data/commandBalance.js', 'src/data/klichBalance.js',
  'src/data/lashBalance.js', 'src/data/behavior.js', 'src/data/intentions.js', 'src/data/intentionMotion.js',
  'src/data/upgradeData.js', 'src/data/coreFacets.js', 'src/data/upgradeTree.js', 'src/data/foeCompose.js',
  'src/scene/buildFighter.js', 'src/scene/ArenaScene.vue', 'src/scene/battleField.js', 'src/scene/boutCore.js',
  'src/scene/hpStagger.js', 'src/scene/instantBout.js',
  'src/services/command.js', 'src/services/commandBrain.js', 'src/services/buffs.js', 'src/services/buffStrike.js',
  'src/services/klich.js', 'src/services/lash.js', 'src/services/fightResult.js', 'src/services/fighterSelect.js',
].filter((f) => existsSync(`${REPO}/${f}`));

export function combatFingerprint() {
  const h = createHash('sha256');
  for (const f of COMBAT_FILES) { h.update(f + '\0'); h.update(readFileSync(`${REPO}/${f}`)); }
  return h.digest('hex').slice(0, 16);
}

export function provenance({ fetch = true } = {}) {
  if (fetch) { try { execFileSync('git', ['-C', REPO, 'fetch', '-q', 'origin', 'main'], { stdio: 'ignore' }); } catch (_) {} }
  const p = { head: git('rev-parse', 'HEAD'), headSubject: git('log', '-1', '--format=%s') };
  try { p.main = git('rev-parse', 'origin/main'); p.mainSubject = git('log', '-1', '--format=%s', 'origin/main'); } catch (_) { p.main = null; }
  try {
    p.mergeBase = p.main ? git('merge-base', 'HEAD', 'origin/main') : null;
    p.mainContainedInBranch = p.main ? (git('merge-base', '--is-ancestor', 'origin/main', 'HEAD') === '' ) : false;
  } catch (_) { p.mainContainedInBranch = false; }
  try { p.behindMain = p.main ? Number(git('rev-list', '--count', 'HEAD..origin/main')) : null; } catch (_) {}
  // правки игры в ветке: всё, что вне tools/ и docs/
  try { p.gameFilesChangedVsMain = p.main ? git('diff', '--name-only', 'origin/main', 'HEAD', '--', '.', ':!tools', ':!docs').split('\n').filter(Boolean).length : null; } catch (_) {}
  // «ролик снят с коммита main X» = общий предок ветки и origin/main (main мог уйти вперёд после слияния): правок игры относительно него должно быть 0
  try { p.gameFilesChangedVsMergeBase = p.mergeBase ? git('diff', '--name-only', p.mergeBase, 'HEAD', '--', '.', ':!tools', ':!docs').split('\n').filter(Boolean).length : null; } catch (_) {}
  p.combatFingerprint = combatFingerprint();
  p.combatFiles = COMBAT_FILES.length;
  p.date = new Date().toISOString();
  return p;
}
