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

  const USERNAME_WORDS = /(?:^|[\s_.\-[\]])(?:user(?:name)?|login|logon|email|e-mail|identifier|account|member|customer|phone|mobile)(?:$|[\s_.\-[\]])/i;
  const USERNAME_TEXT = /user\s*name|e-?mail|log\s*in|sign\s*in|account|identifier|phone|mobile|\b(?:tel|telephone)\b|\b(?:ورود|وارد|نام\s*کاربری|ایمیل|شماره|موبایل|تلفن|شناسه|حساب|گذرواژه|رمز)\b/i;
  const LOGIN_CONTEXT = /log\s*in|sign\s*in|login|signin|username|password|account|credential|ورود|وارد|نام\s*کاربری|رمز|گذرواژه|حساب/i;
  const NEGATIVE_WORDS = /search|newsletter|subscribe|subscription|filter|query|coupon|promo|invite|referral|comment|message|chat/i;
  const NON_USERNAME_AUTOCOMPLETE = new Set(['current-password', 'new-password', 'one-time-code', 'cc-number']);

  const getFieldText = function (input) {
    const values = [
      input.getAttribute('name'),
      input.getAttribute('id'),
      input.getAttribute('autocomplete'),
      input.getAttribute('placeholder'),
      input.getAttribute('aria-label'),
      input.getAttribute('title'),
    ];
    if (input.labels) {
      for (const label of Array.from(input.labels)) values.push(label.textContent || '');
    }
    return values.filter(Boolean).join(' ').toLowerCase();
  };

  const isUsernameCandidate = function (input) {
    if (!(input instanceof HTMLInputElement)) return false;
    const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
    const fieldIdentity = [input.getAttribute('name'), input.getAttribute('id')].filter(Boolean).join(' ').toLowerCase();
    const strongNumberSignal = autocomplete === 'username' ||
      /(?:^|[\s_.-])(?:phone(?:number)?|mobile(?:number)?|tel(?:ephone)?|user(?:name)?|login)(?:$|[\s_.-])/i.test(fieldIdentity);
    if (!['text', 'email', 'tel'].includes(input.type) &&
        !(input.type === 'number' && strongNumberSignal)) return false;
    if (input.disabled || input.readOnly || input.hidden || input.getAttribute('aria-hidden') === 'true') return false;
    if (NON_USERNAME_AUTOCOMPLETE.has(autocomplete)) return false;
    return true;
  };

  const scoreUsername = function (input) {
    const name = [input.getAttribute('name'), input.getAttribute('id')].filter(Boolean).join(' ').toLowerCase();
    const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
    const descriptiveText = ['placeholder', 'aria-label', 'title']
      .map(attribute => input.getAttribute(attribute)).filter(Boolean).join(' ').toLowerCase();
    const allText = getFieldText(input);
    const formText = input.form ? (input.form.textContent || '').toLowerCase().slice(0, 4000) : '';

    if (NEGATIVE_WORDS.test(name) || NEGATIVE_WORDS.test(descriptiveText)) return -100;
    let score = 0;
    if (autocomplete === 'username') score += 12;
    else if (autocomplete === 'email') score += 5;
    else if (['tel', 'tel-national', 'tel-local'].includes(autocomplete)) score += 5;
    if (USERNAME_WORDS.test(name)) score += 6;
    if (USERNAME_TEXT.test(descriptiveText)) score += 5;
    if (input.type === 'email') score += 2;
    if (USERNAME_TEXT.test(allText) && !USERNAME_TEXT.test(descriptiveText)) score += 2;
    if (formText && LOGIN_CONTEXT.test(formText)) score += 3;
    return score;
  };

  const findLogin = function () {
    const forms = Array.from(document.forms || []);
    // Prefer a document-wide scan so custom login widgets outside <form> are also supported.
    const inputs = typeof document.querySelectorAll === 'function'
      ? Array.from(document.querySelectorAll('input'))
      : forms.flatMap(form => Array.from(form.elements || []));
    const formSet = new Set(forms);
    const candidates = [];
    const passwords = [];

    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index];
      if (!(input instanceof HTMLInputElement) || !input.isConnected) continue;
      const form = input.form && formSet.has(input.form) ? input.form : null;
      if (input.type === 'password' && !input.disabled && !input.hidden) {
        passwords.push({ input, index, form });
      }
      if (isUsernameCandidate(input)) {
        const score = scoreUsername(input);
        if (score > -50) candidates.push({ input, index, form, score });
      }
    }

    // Prefer candidates before a password field, weighting same-form and nearby fields.
    let best = null;
    let bestScore = -Infinity;
    for (const password of passwords) {
      for (const candidate of candidates) {
        if (candidate.index >= password.index) continue;
        if (password.form && candidate.form && candidate.form !== password.form) continue;
        const sameForm = Boolean(password.form && candidate.form === password.form);
        const distance = password.index - candidate.index;
        if (!sameForm && password.form && !candidate.form && distance > 3) continue;
        if (!sameForm && !password.form && candidate.form && distance > 3) continue;
        if (!sameForm && candidate.score < 4 && distance > 4) continue;
        let score = candidate.score + (sameForm ? 10 : 0) + (distance <= 2 ? 3 : distance <= 5 ? 1 : 0);
        if (candidate.input.type === 'email') score += 1;
        if (score > bestScore) {
          best = candidate.input;
          bestScore = score;
        }
      }
    }
    if (best) return best;

    // Do not guess across unrelated fields when a password is present but cannot be paired.
    if (passwords.length) return null;

    let explicitBest = null;
    let explicitScore = 4;
    for (const candidate of candidates) {
      if (candidate.score > explicitScore) {
        explicitBest = candidate.input;
        explicitScore = candidate.score;
      }
    }
    // Some phone/email first steps have only one credential-like control and non-English labels.
    if (!explicitBest && candidates.length === 1) {
      const only = candidates[0].input;
      const autocomplete = (only.getAttribute('autocomplete') || '').toLowerCase();
      if (only.type === 'email' || only.type === 'tel' || autocomplete === 'username' ||
          autocomplete === 'email' || ['tel', 'tel-national', 'tel-local'].includes(autocomplete)) {
        explicitBest = only;
      }
    }
    return explicitBest;
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

  const isRelevantMutation = function (record) {
    if (!record) return false;
    if (record.type === 'childList') return true;

    const target = record.target;
    if (target instanceof HTMLInputElement ||
        (typeof HTMLFormElement !== 'undefined' && target instanceof HTMLFormElement)) return true;

    // Some login dialogs (including Soft98) keep their form in the DOM while
    // hidden, then reveal it by changing an ancestor's class or style.
    // Re-check only when that changed ancestor contains a likely credential field.
    if (target && typeof target.matches === 'function' &&
        ['class', 'style', 'hidden', 'aria-hidden'].includes(record.attributeName)) {
      const credentialSelector =
        'input[type="password"], input[autocomplete="username"], ' +
        'input[name*="login" i], input[id*="login" i], ' +
        'input[name*="user" i], input[id*="user" i], ' +
        'input[name*="email" i], input[id*="email" i]';
      return target.matches(credentialSelector) ||
        (typeof target.querySelector === 'function' && Boolean(target.querySelector(credentialSelector)));
    }
    return false;
  };

  if (!document.documentElement) return;
  const observer = new MutationObserver(function (records) {
    if (Array.isArray(records) && records.some(isRelevantMutation)) scheduleDetection();
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['type', 'name', 'autocomplete', 'disabled', 'readonly', 'hidden', 'aria-hidden', 'class', 'style'],
  });
  detectLogin();
}());