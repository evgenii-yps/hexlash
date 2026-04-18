const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/**
 * captainService depends on Prisma — full integration tests require DB.
 * These tests verify the logic patterns and invariants at the unit level.
 * Integration tests (setCaptain, getCaptain, canDeleteAgent) require
 * a running PostgreSQL instance and are run via manual smoke test.
 */

// ── Captain swap logic (pure pattern tests) ─────────────────────

describe('captain swap invariants', () => {
  // Simulate the swap logic without Prisma
  function simulateSwap(agents, newCaptainId) {
    const result = agents.map(a => ({ ...a }));
    const oldCaptain = result.find(a => a.isCaptain);
    const newCaptain = result.find(a => a.id === newCaptainId);

    if (!newCaptain) throw new Error('NOT_IN_CLUB');
    if (newCaptain.status === 'fighting') throw new Error('AGENT_FIGHTING');
    if (oldCaptain?.id === newCaptainId) return { agents: result, noop: true };

    if (oldCaptain) oldCaptain.isCaptain = false;
    newCaptain.isCaptain = true;
    return { agents: result, noop: false };
  }

  it('swaps captain correctly', () => {
    const agents = [
      { id: 'a1', isCaptain: true, status: 'idle' },
      { id: 'a2', isCaptain: false, status: 'idle' },
    ];
    const { agents: after, noop } = simulateSwap(agents, 'a2');
    assert.equal(noop, false);
    assert.equal(after.find(a => a.id === 'a1').isCaptain, false);
    assert.equal(after.find(a => a.id === 'a2').isCaptain, true);
  });

  it('no-op when setting current captain', () => {
    const agents = [
      { id: 'a1', isCaptain: true, status: 'idle' },
      { id: 'a2', isCaptain: false, status: 'idle' },
    ];
    const { noop } = simulateSwap(agents, 'a1');
    assert.equal(noop, true);
  });

  it('throws when agent not in club', () => {
    const agents = [{ id: 'a1', isCaptain: true, status: 'idle' }];
    assert.throws(() => simulateSwap(agents, 'a999'), /NOT_IN_CLUB/);
  });

  it('throws when agent is fighting', () => {
    const agents = [
      { id: 'a1', isCaptain: true, status: 'idle' },
      { id: 'a2', isCaptain: false, status: 'fighting' },
    ];
    assert.throws(() => simulateSwap(agents, 'a2'), /AGENT_FIGHTING/);
  });

  it('sets first captain when none exists', () => {
    const agents = [
      { id: 'a1', isCaptain: false, status: 'idle' },
      { id: 'a2', isCaptain: false, status: 'idle' },
    ];
    const { agents: after, noop } = simulateSwap(agents, 'a1');
    assert.equal(noop, false);
    assert.equal(after.find(a => a.id === 'a1').isCaptain, true);
    assert.equal(after.find(a => a.id === 'a2').isCaptain, false);
  });

  it('exactly one captain after swap', () => {
    const agents = [
      { id: 'a1', isCaptain: true, status: 'idle' },
      { id: 'a2', isCaptain: false, status: 'idle' },
      { id: 'a3', isCaptain: false, status: 'idle' },
    ];
    const { agents: after } = simulateSwap(agents, 'a3');
    const captains = after.filter(a => a.isCaptain);
    assert.equal(captains.length, 1);
    assert.equal(captains[0].id, 'a3');
  });
});

// ── canDeleteAgent logic (pure pattern tests) ───────────────────

describe('canDeleteAgent invariants', () => {
  function simulateCanDelete(agent, othersCount) {
    if (!agent) return { canDelete: false, reason: 'not_found' };
    if (!agent.isCaptain) return { canDelete: true };
    if (othersCount > 0) return { canDelete: false, reason: 'captain_protected' };
    return { canDelete: true };
  }

  it('non-captain can always be deleted', () => {
    assert.deepEqual(simulateCanDelete({ isCaptain: false }, 2), { canDelete: true });
  });

  it('captain with others → protected', () => {
    assert.deepEqual(simulateCanDelete({ isCaptain: true }, 2), { canDelete: false, reason: 'captain_protected' });
  });

  it('captain alone → can delete', () => {
    assert.deepEqual(simulateCanDelete({ isCaptain: true }, 0), { canDelete: true });
  });

  it('null agent → not found', () => {
    assert.deepEqual(simulateCanDelete(null, 0), { canDelete: false, reason: 'not_found' });
  });
});
