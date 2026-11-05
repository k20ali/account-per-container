'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'extension', 'content.js'), 'utf8');

class FakeEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
    this.target = null;
  }
}

class FakeInput {
  constructor(type, form, value = '') {
    this.type = type;
    this.form = form;
    this._value = value;
    this.disabled = false;
    this.readOnly = false;
    this.hidden = false;
    this.isConnected = true;
    this.parentNode = null;
    this.attributes = {};
    this.listeners = new Map();
    if (form && type === 'password') this.setParent(form.parent);
  }

  get value() { return this._value; }
  set value(value) { this._value = String(value); }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) {
    if (this.listeners.has(type)) this.listeners.get(type).delete(callback);
  }
  dispatchEvent(event) {
    event.target = this;
    for (const callback of this.listeners.get(event.type) || []) callback(event);
    return true;
  }
  setParent(parent) {
    this.parentNode = parent;
    if (parent && !parent.children.includes(this)) parent.children.push(this);
  }
}

async function runContentScript(options = {}) {
  let observerCallback = null;
  const records = { preferredLookups: 0, usernameChanges: [], inputEvents: [] };
  const form = { isConnected: true, elements: [], parent: null };
  const parent = {
    children: [],
    replaceChild(replacement, oldNode) {
      const index = this.children.indexOf(oldNode);
      if (index < 0) throw new Error('old node is not a child');
      this.children[index] = replacement;
      oldNode.parentNode = null;
      replacement.parentNode = this;
      return oldNode;
    },
  };
  form.parent = parent;
  const username = options.username || new FakeInput('text', form, options.initialValue || '');
  const password = options.password === false ? null : new FakeInput('password', form);
  if (password) password.setParent(parent);
  username.form = form;
  form.elements = password ? [username, password] : [username];
  const document = {
    forms: options.withForm === false ? [] : [form],
    documentElement: {},
    createElement: tagName => ({ tagName, parentNode: null }),
  };
  class FakeMutationObserver {
    constructor(callback) { observerCallback = callback; }
    observe() {}
    disconnect() {}
  }
  const browser = {
    runtime: {
      sendMessage: async message => {
        if (message.method === 'isMyselfContained') return true;
        if (message.method === 'getPreferedUsername') {
          records.preferredLookups += 1;
          return typeof options.preferredUsername === 'function'
            ? options.preferredUsername(records.preferredLookups)
            : options.preferredUsername;
        }
        if (message.method === 'onUsernameChange') {
          records.usernameChanges.push(message.params[0]);
          return true;
        }
        return undefined;
      },
    },
  };

  vm.runInNewContext(source, {
    browser,
    document,
    HTMLInputElement: FakeInput,
    Event: FakeEvent,
    MutationObserver: FakeMutationObserver,
    Promise,
    Array,
    Object,
    String,
    Map,
    WeakMap,
  }, { filename: 'extension/content.js' });
  await new Promise(resolve => setImmediate(resolve));
  await Promise.resolve();
  return {
    records,
    form,
    username,
    password,
    replaceUsername(value = '') {
      const replacement = new FakeInput('text', form, value);
      replacement.setParent(parent);
      const old = form.elements[0];
      old.isConnected = false;
      old.form = null;
      form.elements[0] = replacement;
      username.isConnected = false;
      username.parentNode = null;
      observerCallback();
      return replacement;
    },
  };
}

test('non-empty username is never overwritten by the saved username', async () => {
  const page = await runContentScript({ initialValue: 'already-entered', preferredUsername: 'saved-user' });
  assert.equal(page.username.value, 'already-entered');
  assert.equal(page.records.preferredLookups, 0);
});

test('autofill uses the native value setter and dispatches a bubbling input event', async () => {
  const page = await runContentScript({ preferredUsername: 'saved-user' });
  assert.equal(page.username.value, 'saved-user');
  assert.ok(page.records.usernameChanges.includes('saved-user'));
  assert.equal(page.password.parentNode, page.form.parent);
  assert.equal(page.username.listeners.get('input').size, 1);
});

test('a real user edit suppresses a later autofill after input replacement', async () => {
  const page = await runContentScript({ preferredUsername: count => count === 1 ? null : 'saved-user' });
  page.username.value = 'typed-by-user';
  page.username.dispatchEvent(new FakeEvent('input', { bubbles: true }));
  const replacement = page.replaceUsername('');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(replacement.value, '');
  assert.equal(page.records.preferredLookups, 1);
  assert.equal(page.username.listeners.get('input').size, 0);
});

test('absence of a login form does not dereference a null input', async () => {
  const page = await runContentScript({ withForm: false, preferredUsername: 'saved-user' });
  assert.equal(page.records.preferredLookups, 0);
  assert.equal(page.records.usernameChanges.length, 0);
});

test('a replacement input is detected and can receive autofill when no user edit occurred', async () => {
  const page = await runContentScript({ preferredUsername: count => count === 1 ? null : 'new-saved-user' });
  const replacement = page.replaceUsername('');
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(replacement.value, 'new-saved-user');
  assert.equal(page.records.preferredLookups, 2);
  assert.equal(page.username.listeners.get('input').size, 0);
});
