; (async function () {
  let writeQueue = Promise.resolve();

  const writeRules = function (items) {
    const snapshot = items.map(rule => ({
      cookieStoreId: rule.cookieStoreId,
      host: rule.host,
      username: rule.username,
    }));
    const pending = writeQueue.catch(() => undefined).then(() => browser.storage.sync.set({ rules: snapshot }));
    writeQueue = pending;
    return pending;
  };

  const normalizeHost = function (value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    const candidate = value.trim().toLowerCase();
    if (/[\s/?#@]/.test(candidate)) return null;
    try {
      const url = new URL('https://' + candidate);
      if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
      if (url.host.toLowerCase() !== candidate) return null;
      return url.host.toLowerCase();
    } catch (error) {
      return null;
    }
  };

  const normalizeRule = function (rule) {
    if (!rule || typeof rule !== 'object') return null;
    const cookieStoreId = typeof rule.cookieStoreId === 'string' ? rule.cookieStoreId.trim() : '';
    const host = normalizeHost(rule.host);
    const username = typeof rule.username === 'string' ? rule.username : null;
    if (!cookieStoreId || !host || username === null || username.length === 0) return null;
    return { cookieStoreId, host, username };
  };

  const loadRules = async function () {
    const stored = (await browser.storage.sync.get({ rules: [] })).rules;
    const unique = new Map();
    if (Array.isArray(stored)) {
      stored.forEach(rule => {
        const normalized = normalizeRule(rule);
        if (normalized) unique.set(normalized.cookieStoreId + '\u0000' + normalized.host, normalized);
      });
    }
    const loaded = Array.from(unique.values());
    if (JSON.stringify(loaded) !== JSON.stringify(stored)) await writeRules(loaded);
    return loaded;
  };

  /** @type {{cookieStoreId: string, host: string, username: string}[]} */
  const rules = [];
  // Start loading immediately, but don't block listener registration on storage I/O.
  const rulesReady = loadRules().then(loaded => {
    rules.splice(0, rules.length, ...loaded);
    return true;
  }).catch(() => false);
  const getRule = function ({ cookieStoreId, host }) {
    return rules.find(rule => rule.cookieStoreId === cookieStoreId && rule.host === host) || null;
  };
  const context = new Map();
  const handlers = {};

  const isContainedTab = async function (tab) {
    if (!tab || typeof tab.cookieStoreId !== 'string' || !tab.cookieStoreId) return false;
    try {
      await browser.contextualIdentities.get(tab.cookieStoreId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getHostFromUrl = function (value) {
    if (typeof value !== 'string' || !value) return null;
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null;
      return url.host.toLowerCase();
    } catch (error) {
      return null;
    }
  };

  const getTabInfo = async function (tab, urlHint) {
    if (!tab || !Number.isInteger(tab.id)) return null;
    const urlValue = typeof urlHint === 'string' ? urlHint : tab.url;
    const host = getHostFromUrl(urlValue);
    if (!host || !(await isContainedTab(tab))) return null;
    const cookieStoreId = tab.cookieStoreId;
    return { cookieStoreId, host, rule: getRule({ cookieStoreId, host }) };
  };

  handlers.isMyselfContained = async function (sender) {
    return isContainedTab(sender && sender.tab);
  };

  handlers.getPreferedUsername = async function (sender) {
    const info = await getTabInfo(sender && sender.tab, sender && sender.url);
    return info && info.rule ? info.rule.username : undefined;
  };

  const enablePageAction = async function (tabId, info) {
    context.set(tabId, info);
    try {
      await browser.pageAction.show(tabId);
    } catch (error) {
      if (context.get(tabId) === info) context.delete(tabId);
    }
  };

  const revokePageAction = async function (tabId) {
    context.delete(tabId);
    try {
      await browser.pageAction.hide(tabId);
    } catch (error) {
      // The tab may have closed between the event and this call.
    }
  };

  handlers.onUsernameChange = async function (sender, username) {
    const tab = sender && sender.tab;
    if (!tab || !Number.isInteger(tab.id)) return false;
    if (username === null) {
      await revokePageAction(tab.id);
      return true;
    }
    if (typeof username !== 'string') {
      await revokePageAction(tab.id);
      return false;
    }
    const info = await getTabInfo(tab, sender.url);
    if (!info) {
      await revokePageAction(tab.id);
      return false;
    }
    info.username = username;
    await enablePageAction(tab.id, info);
    return true;
  };

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo && (changeInfo.discarded || changeInfo.url)) void revokePageAction(tabId);
  });
  browser.tabs.onRemoved.addListener(tabId => {
    void revokePageAction(tabId);
  });

  browser.contextualIdentities.onRemoved.addListener(changeInfo => {
    const identity = changeInfo && changeInfo.contextualIdentity;
    const cookieStoreId = identity && identity.cookieStoreId;
    if (!cookieStoreId) return;
    const retained = rules.filter(rule => rule.cookieStoreId !== cookieStoreId);
    if (retained.length === rules.length) return;
    rules.splice(0, rules.length, ...retained);
    void writeRules(rules).catch(() => undefined);
    for (const [tabId, info] of context) {
      if (info.cookieStoreId === cookieStoreId) void revokePageAction(tabId);
    }
  });

  handlers.getPageContext = async function () {
    let tabs;
    try {
      tabs = await browser.tabs.query({ currentWindow: true, active: true });
    } catch (error) {
      return null;
    }
    const activeTab = Array.isArray(tabs) ? tabs[0] : null;
    if (!activeTab || !Number.isInteger(activeTab.id)) return null;
    const info = context.get(activeTab.id);
    if (!info) return null;
    const currentTabInfo = await getTabInfo(activeTab, activeTab.url);
    if (!currentTabInfo || info.cookieStoreId !== currentTabInfo.cookieStoreId || info.host !== currentTabInfo.host) {
      await revokePageAction(activeTab.id);
      return null;
    }
    return { ...info, rule: getRule(currentTabInfo) };
  };

  handlers.addRule = async function (sender, rule) {
    const normalized = normalizeRule(rule);
    if (!normalized) return false;
    let identities;
    try {
      identities = await browser.contextualIdentities.query({});
    } catch (error) {
      return false;
    }
    if (!Array.isArray(identities) || !identities.some(identity => identity.cookieStoreId === normalized.cookieStoreId)) return false;
    const oldRule = getRule(normalized);
    const previousUsername = oldRule ? oldRule.username : null;
    if (!oldRule) rules.push(normalized);
    else oldRule.username = normalized.username;
    try {
      await writeRules(rules);
      return true;
    } catch (error) {
      if (!oldRule) {
        const index = rules.indexOf(normalized);
        if (index >= 0) rules.splice(index, 1);
      } else {
        oldRule.username = previousUsername;
      }
      throw error;
    }
  };

  handlers.getRuleList = async function () {
    let identities;
    try {
      identities = await browser.contextualIdentities.query({});
    } catch (error) {
      return rules.map(rule => ({ ...rule }));
    }
    if (!Array.isArray(identities)) return rules.map(rule => ({ ...rule }));
    const contextIds = new Set(identities.map(identity => identity.cookieStoreId));
    const retained = rules.filter(rule => contextIds.has(rule.cookieStoreId));
    if (retained.length !== rules.length) {
      const previous = rules.slice();
      rules.splice(0, rules.length, ...retained);
      try {
        await writeRules(rules);
      } catch (error) {
        rules.splice(0, rules.length, ...previous);
        throw error;
      }
    }
    return rules.map(rule => ({ ...rule }));
  };

  handlers.removeRule = async function (sender, rule) {
    if (!rule || typeof rule !== 'object') return false;
    const cookieStoreId = typeof rule.cookieStoreId === 'string' ? rule.cookieStoreId : '';
    const host = normalizeHost(rule.host);
    if (!cookieStoreId || !host) return false;
    const index = rules.findIndex(item => item.cookieStoreId === cookieStoreId && item.host === host);
    if (index < 0) return false;
    const removed = rules.splice(index, 1)[0];
    try {
      await writeRules(rules);
      return true;
    } catch (error) {
      rules.splice(index, 0, removed);
      throw error;
    }
  };

  // Register synchronously so a freshly loaded content script can message us even while
  // storage.sync is still initializing. Each handler waits for the initial snapshot.
  browser.runtime.onMessage.addListener(function (message, sender) {
    if (!message || typeof message.method !== 'string') return undefined;
    const handler = handlers[message.method];
    if (typeof handler !== 'function') return undefined;
    const params = Array.isArray(message.params) ? message.params : [];
    return rulesReady.then(() => handler(sender || {}, ...params));
  });
}());