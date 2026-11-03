import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateProceduralConnections,
  findPathToContact,
  unlockContact,
  getActivePerks,
} from './connections';

test('procedural connection generation creates valid graph structure', () => {
  const seed = 123456;
  const graph = generateProceduralConnections(seed, 'wrench');

  assert.ok(graph.contacts, 'Contacts dictionary exists');
  assert.ok(graph.links.length > 0, 'Links exist in graph');
  assert.equal(graph.rootId, 'player_root');

  const contactsList = Object.values(graph.contacts);
  assert.ok(contactsList.length >= 10, 'Generates at least 10 contacts');

  // Verify at least one contact is initially active
  const activeContacts = contactsList.filter((c) => c.status === 'active');
  assert.ok(activeContacts.length >= 1, 'At least one contact is active on day 1');

  // Verify at least one contact is revealed
  const revealedContacts = contactsList.filter((c) => c.status === 'revealed');
  assert.ok(revealedContacts.length >= 1, 'At least one contact is revealed through neighbors');

  // Verify quality can be high right away (not locked behind levels)
  const qualities = contactsList.map((c) => c.quality);
  assert.ok(Math.max(...qualities) >= 3, 'Quality can be 3, 4, or 5 stars from the start');
});

test('path finding traces route from player root to target contact', () => {
  const seed = 987654;
  const graph = generateProceduralConnections(seed, 'sales');

  const active = Object.values(graph.contacts).find((c) => c.status === 'active');
  assert.ok(active, 'Active contact found');

  const path = findPathToContact(graph, active.id);
  assert.ok(path.length >= 2, 'Path contains player_root and target');
  assert.equal(path[0], 'player_root');
  assert.equal(path[path.length - 1], active.id);
});

test('unlocking a contact activates it and discovers neighboring contacts', () => {
  const seed = 42;
  const graph = generateProceduralConnections(seed, 'none');

  const revealed = Object.values(graph.contacts).find((c) => c.status === 'revealed');
  assert.ok(revealed, 'Found a revealed contact to unlock');

  const preRumoredCount = Object.values(graph.contacts).filter((c) => c.status === 'rumored').length;

  const result = unlockContact(graph, revealed.id, 5);
  assert.equal(result.success, true);
  assert.equal(graph.contacts[revealed.id].status, 'active');
  assert.equal(graph.contacts[revealed.id].unlockedDay, 5);

  const postRumoredCount = Object.values(graph.contacts).filter((c) => c.status === 'rumored').length;
  assert.ok(postRumoredCount <= preRumoredCount, 'May reveal previously rumored contacts');

  const activePerks = getActivePerks(graph);
  assert.ok(activePerks.length > 0, 'Active perks populated from active contacts');
});
