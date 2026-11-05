; (async function () {
  const iconSvg = window.iconSvg;

  [...document.querySelectorAll('[data-i18n]')].forEach(element => {
    element.textContent = browser.i18n.getMessage(element.dataset.i18n);
  });

  const ul = document.querySelector('#list');
  const removeButton = document.querySelector('#remove');
  let currentRule = null;
  let currentIndex = 0;
  let renderCount = 0;

  const renderList = async function () {
    const index = ++renderCount;
    removeButton.disabled = true;
    currentRule = null;
    let rules;
    let contexts;
    try {
      rules = await browser.runtime.sendMessage({ method: 'getRuleList' });
      contexts = await browser.contextualIdentities.query({});
    } catch (error) {
      return;
    }
    if (renderCount !== index || !Array.isArray(rules) || !Array.isArray(contexts)) return;

    [...document.querySelectorAll('.theader ~ li')].forEach(li => li.remove());
    const visibleRules = rules.filter(rule => contexts.some(context => context.cookieStoreId === rule.cookieStoreId));
    if (currentIndex >= visibleRules.length) currentIndex = Math.max(0, visibleRules.length - 1);

    if (!visibleRules.length) {
      const li = document.createElement('li');
      li.classList.add('empty-list');
      const div = li.appendChild(document.createElement('div'));
      div.textContent = browser.i18n.getMessage('emptyRuleList');
      ul.appendChild(li);
      return;
    }

    visibleRules.forEach((rule, index) => {
      const containerInfo = contexts.find(context => context.cookieStoreId === rule.cookieStoreId);
      if (!containerInfo) return;
      const li = document.createElement('li');
      li.tabIndex = 0;
      const host = li.appendChild(document.createElement('span'));
      const container = li.appendChild(document.createElement('span'));
      const username = li.appendChild(document.createElement('span'));
      host.textContent = rule.host;
      username.textContent = rule.username;
      container.appendChild(iconSvg(containerInfo));
      const containerName = container.appendChild(document.createElement('i'));
      containerName.textContent = containerInfo.name;
      containerName.style.color = containerInfo.colorCode;
      ul.appendChild(li);

      const chooseItem = function () {
        if (currentRule) currentRule.dom.classList.remove('cur');
        currentRule = { dom: li, rule };
        li.classList.add('cur');
        removeButton.disabled = false;
        currentIndex = index;
      };
      li.addEventListener('click', chooseItem);
      li.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          chooseItem();
        }
      });
      if (index === currentIndex) chooseItem();
    });
  };

  browser.storage.onChanged.addListener(() => { void renderList(); });
  void renderList();

  removeButton.addEventListener('click', async function () {
    if (!currentRule) return;
    removeButton.disabled = true;
    try {
      await browser.runtime.sendMessage({ method: 'removeRule', params: [currentRule.rule] });
    } catch (error) {
      // Re-render the authoritative state; a failed storage write leaves the rule visible.
    } finally {
      currentRule = null;
      await renderList();
    }
  });
}());