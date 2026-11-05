'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'extension', 'background.js'), 'utf8');
const plain = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

function makeEvent() {
  let listener = null;
  return {
    addListener(callback) { listener = callback; },
    fire(...args) { return listener ? listener(...args) : undefined; },
  };
}

async function createHarness(store = {}, options = {}) {
  const identities = options.identities || [
    { cookieStoreId: 'firefox-container-1', name: 'Personal', colorCode: '#00aaff' },
  ];
  const activeTab = Object.prototype.hasOwnProperty.call(options, 'activeTab')
    ? options.activeTab
    : { id: 1, url: 'https://example.com/login', cookieStoreId: 'firefox-container-1' };
  const messageEvent = makeEvent();
  const identityRemovedEvent = makeEvent();
  const tabUpdatedEvent = makeEvent();
  const tabRemovedEvent = makeEvent();
  const shownTabs = new Set();
  const hiddenTabs = new Set();
  let releaseStorage = null;
  const storageGet = async defaults => {
    if (options.deferStorageInitialization) {
      return new Promise(resolve => {
        releaseStorage = () => resolve({ ...defaults, ...store });
      });
    }
    return { ...defaults, ...store };
  };
  const browser = {
    storage: {
      sync: {
        get: storageGet,
        set: async values => {
          if (options.failStorageWrites) throw new Error('simulated storage failure');
          Object.assign(store, plain(values));
        },
      },
    },
    runtime: { onMessage: messageEvent },
    contextualIdentities: {
      get: async id => {
        const found = identities.find(identity => identity.cookieStoreId === id);
        if (!found) throw new Error('Unknown container');
        return found;
      },
      query: async () => identities,
      onRemoved: identityRemovedEvent,
    },
    tabs: {
      query: async () => activeTab ? [activeTab] : [],
      onUpdated: tabUpdatedEvent,
      onRemoved: tabRemovedEvent,
    },
    pageAction: {
      show: async id => { shownTabs.add(id); hiddenTabs.delete(id); },
      hide: async id => { hiddenTabs.add(id); shownTabs.delete(id); },
    },
  };

  vm.runInNewContext(source, {
    browser,
    URL,
    console,
    Promise,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    JSON,
  }, { filename: 'extension/background.js' });

  await new Promise(resolve => setImmediate(resolve));
  return {
    store,
    shownTabs,
    hiddenTabs,
    send: (message, sender = {}) => messageEvent.fire(message, sender),
    removeIdentity: identity => identityRemovedEvent.fire({ contextualIdentity: identity }),
    updateTab: (id, changeInfo) => tabUpdatedEvent.fire(id, changeInfo),
    removeTab: id => tabRemovedEvent.fire(id),
    releaseStorage: () => { if (releaseStorage) releaseStorage(); },
  };
}

const savedRule = {
  cookieStoreId: 'firefox-container-1',
  host: 'example.com',
  username: 'alice',
};

test('removing a rule persists it so it stays removed after background restart', async () => {
  const store = { rules: [savedRule] };
  const first = await createHarness(store);
  assert.equal(await first.send({ method: 'removeRule', params: [savedRule] }), true);
  assert.deepEqual(plain(store.rules), []);
  const restarted = await createHarness(store);
  assert.deepEqual(plain(await restarted.send({ method: 'getRuleList' })), []);
});

test('invalid and opaque URLs do not create page context or throw', async () => {
  const harness = await createHarness({ rules: [savedRule] });
  const result = await harness.send(
    { method: 'onUsernameChange', params: ['alice'] },
    { tab: { id: 7, url: 'about:blank', cookieStoreId: 'firefox-container-1' }, url: 'about:blank' },
  );
  assert.equal(result, false);
  assert.equal(harness.shownTabs.has(7), false);
  assert.equal(await harness.send({ method: 'getPageContext' }), null);
});

test('missing active tab and missing message context return safely', async () => {
  const noTab = await createHarness({}, { activeTab: null });
  assert.equal(await noTab.send({ method: 'getPageContext' }), null);
  assert.equal(await noTab.send({ method: 'onUsernameChange', params: ['alice'] }, {}), false);
  assert.equal(await noTab.send({ method: 'method-that-does-not-exist' }, {}), undefined);
});

test('preferred username is returned only for the matching container and host', async () => {
  const harness = await createHarness({ rules: [savedRule] });
  const sender = {
    url: 'https://example.com/login',
    tab: { id: 1, url: 'https://example.com/login', cookieStoreId: 'firefox-container-1' },
  };
  assert.equal(await harness.send({ method: 'getPreferedUsername' }, sender), 'alice');
  assert.equal(await harness.send({ method: 'onUsernameChange', params: ['alice'] }, sender), true);
  const context = plain(await harness.send({ method: 'getPageContext' }));
  assert.equal(context.host, 'example.com');
  assert.equal(context.username, 'alice');
  assert.equal(context.rule.username, 'alice');
});

test('adding and updating rules persists normalized host names', async () => {
  const store = { rules: [] };
  const harness = await createHarness(store);
  assert.equal(await harness.send({ method: 'addRule', params: [{ ...savedRule, host: 'EXAMPLE.COM' }] }), true);
  assert.deepEqual(plain(store.rules), [savedRule]);
  assert.equal(await harness.send({ method: 'addRule', params: [{ ...savedRule, username: 'bob' }] }), true);
  assert.deepEqual(plain(store.rules), [{ ...savedRule, username: 'bob' }]);
});

test('malformed stored rules are discarded rather than converted to literal undefined values', async () => {
  const store = { rules: [
    { cookieStoreId: 'firefox-container-1', host: 'example.com' },
    { cookieStoreId: 'firefox-container-1', host: 'not a host', username: 'alice' },
    null,
  ] };
  const harness = await createHarness(store);
  assert.deepEqual(plain(store.rules), []);
  assert.deepEqual(plain(await harness.send({ method: 'getRuleList' })), []);
});

test('deleting a container removes its persisted rules', async () => {
  const store = { rules: [savedRule] };
  const harness = await createHarness(store);
  harness.removeIdentity({ cookieStoreId: 'firefox-container-1' });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(plain(store.rules), []);
});

test('message listener is available while initial storage read is pending', async () => {
  const harness = await createHarness({}, { deferStorageInitialization: true });
  const pending = harness.send({ method: 'getRuleList' });
  assert.equal(typeof pending.then, 'function');
  harness.releaseStorage();
  assert.deepEqual(plain(await pending), []);
});

test('failed removal write restores the in-memory rule', async () => {
  const harness = await createHarness({ rules: [savedRule] }, { failStorageWrites: true });
  await assert.rejects(harness.send({ method: 'removeRule', params: [savedRule] }), /simulated storage failure/);
  assert.deepEqual(plain(await harness.send({ method: 'getRuleList' })), [savedRule]);
});

test('failed add write does not leave a ghost in-memory rule', async () => {
  const harness = await createHarness({ rules: [] }, { failStorageWrites: true });
  await assert.rejects(harness.send({ method: 'addRule', params: [savedRule] }), /simulated storage failure/);
  assert.deepEqual(plain(await harness.send({ method: 'getRuleList' })), []);
});
