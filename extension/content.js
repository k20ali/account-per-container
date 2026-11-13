; (async function () {
  const sendMessage = function (method, params) {
    return browser.runtime.sendMessage({ method, params });
  };

  let contained;
  try {
    contained = await browser.runtime.sendMessage({ method: 'isMyselfContained' });
  } catch (error) {
    return;
  }
  if (!contained) return;

  const getPreferedUsername = function () {
    return browser.runtime.sendMessage({ method: 'getPreferedUsername' });
  };
  const onUsernameChange = function (username) {
    return sendMessage('onUsernameChange', [username]).catch(() => undefined);
  };

  let lastLogin = null;
  let userEditedAnyLogin = false;
  let autofillAttempted = false;
  let detectionScheduled = false;
  const loginStates = new WeakMap();

  const isUsernameCandidate = function (element) {
    return element instanceof HTMLInputElement &&
      ['text', 'email', 'tel'].includes(element.type) &&
      !element.disabled && !element.readOnly && !element.hidden &&
      element.getAttribute('aria-hidden') !== 'true';
  };

  const setInputValue = function (input, value) {
    if (!(input instanceof HTMLInputElement) || !input.isConnected || input.disabled || input.readOnly) return false;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (!descriptor || typeof descriptor.set !== 'function') return false;
    const state = loginStates.get(input);
    if (!state) return false;

    state.filling = true;
    try {
      descriptor.set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } finally {
      state.filling = false;
    }

    // Keep the upstream password-manager workaround, but don't reinsert a detached node.
    const form = input.form;
    if (form && form.isConnected && input.form === form) {
      Array.from(form.elements).forEach(element => {
        if (!(element instanceof HTMLInputElement) || element.type !== 'password' || !element.parentNode) return;
        const parent = element.parentNode;
        const placeholder = document.createElement('x-apc-password-placeholder');
        try {
          parent.replaceChild(placeholder, element);
          if (placeholder.parentNode === parent) parent.replaceChild(element, placeholder);
        } catch (error) {
          if (placeholder.parentNode === parent && !element.parentNode) parent.replaceChild(element, placeholder);
        }
      });
    }
    return true;
  };

  const attachLogin = function (input) {
    const state = { filling: false, listener: null };
    state.listener = function () {
      if (!state.filling) userEditedAnyLogin = true;
      void onUsernameChange(input.value);
    };
    loginStates.set(input, state);
    input.addEventListener('input', state.listener);
    void onUsernameChange(input.value);

    if (input.value !== '' || userEditedAnyLogin || autofillAttempted) return;
    void (async function () {
      let username;
      try {
        username = await getPreferedUsername();
      } catch (error) {
        return;
      }
      if (!username || lastLogin !== input || !input.isConnected || input.value !== '' ||
          userEditedAnyLogin || autofillAttempted) return;
      autofillAttempted = true;
      if (setInputValue(input, username)) void onUsernameChange(input.value);
    }());
  };

  const detachLogin = function (input) {
    const state = loginStates.get(input);
    if (state && state.listener) input.removeEventListener('input', state.listener);
    loginStates.delete(input);
  };

  const hasUsernameSignal = function (input) {
    const autocomplete = (input.getAttribute('autocomplete') || '').trim().toLowerCase();
    if (autocomplete.split(/\s+/).includes('username')) return true;

    const attributes = [
      input.getAttribute('name'),
      input.getAttribute('id'),
      input.getAttribute('placeholder'),
      input.getAttribute('aria-label'),
    ].filter(Boolean).join(' ').toLowerCase();

    // Prefer explicit identity hints; avoid treating arbitrary text/email fields as logins.
    const compact = attributes.replace(/[^a-z0-9]/g, '');
    if (/(search|newsletter|subscribe)/.test(compact)) return false;
    return /(username|userid|user|email|login|identifier|account)/.test(compact);
  };

  const findLogin = function () {
    for (const form of Array.from(document.forms)) {
      let lastText = null;
      let lastTextLike = null;
      let passwordCount = 0;
      let username = null;
      const candidates = [];

      for (const element of Array.from(form.elements)) {
        if (element instanceof HTMLInputElement && element.type === 'password') {
          passwordCount += 1;
          if (passwordCount > 3) {
            username = null;
            break;
          }
          if (passwordCount === 1) username = lastText || lastTextLike;
        } else if (isUsernameCandidate(element)) {
          candidates.push(element);
          if (passwordCount === 0) {
            if (element.type === 'text') lastText = element;
            else lastTextLike = element;
          }
        }
      }

      // Preserve the reliable classic-form heuristic when a password is present.
      if (username && username.isConnected) return username;

      // Multi-step login pages often show only the identifier field initially.
      // Accept only fields with explicit username/email/login semantics to reduce
      // false positives from search boxes, newsletter forms, and unrelated inputs.
      const explicitCandidate = candidates.find(input => hasUsernameSignal(input));
      if (explicitCandidate && explicitCandidate.isConnected) return explicitCandidate;
    }
    return null;
  };

  const detectLogin = function () {
    const login = findLogin();
    if (login === lastLogin) return;
    const previous = lastLogin;
    lastLogin = login;
    if (previous) detachLogin(previous);
    if (login) attachLogin(login);
    else if (previous) void onUsernameChange(null);
  };

  const scheduleDetection = function () {
    if (detectionScheduled) return;
    detectionScheduled = true;
    Promise.resolve().then(() => {
      detectionScheduled = false;
      detectLogin();
    });
  };

  if (!document.documentElement) return;
  const observer = new MutationObserver(scheduleDetection);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['type', 'name', 'autocomplete', 'disabled', 'readonly', 'hidden', 'aria-hidden'],
  });
  detectLogin();
}());