; (async function () {
  const iconSvg = window.iconSvg;
  let currentInfo = null;
  let renderCount = 0;

  const renderTemplate = async function (info, template, renderId) {
    const contexts = await browser.contextualIdentities.query({});
    if (renderId !== renderCount) return false;
    const containerInfo = contexts.find(context => context.cookieStoreId === info.cookieStoreId);
    if (!containerInfo) return false;
    const text = document.querySelector('#text');
    text.textContent = '';
    template.replace(/[^{}]+|\{[^{}]+\}/g, part => {
      if (part === '{username}') {
        const username = document.createElement('strong');
        username.textContent = info.username;
        text.appendChild(username);
      } else if (part === '{host}') {
        const host = document.createElement('strong');
        host.textContent = info.host;
        text.appendChild(host);
      } else if (part === '{container}') {
        const icon = iconSvg(containerInfo);
        icon.style.width = '16px';
        text.appendChild(icon);
        const container = document.createElement('span');
        container.textContent = containerInfo.name;
        container.style.color = containerInfo.colorCode;
        text.appendChild(container);
      } else {
        text.appendChild(document.createTextNode(part));
      }
    });
    return true;
  };

  const renderInfo = async function (info, renderId) {
    currentInfo = info && typeof info === 'object' ? info : null;
    const text = document.querySelector('#text');
    const confirm = document.querySelector('#confirm');
    confirm.style.display = 'none';
    confirm.disabled = true;

    if (!currentInfo || !currentInfo.cookieStoreId || !currentInfo.host) {
      text.textContent = browser.i18n.getMessage('noPageContextNotice');
      return;
    }
    if (!currentInfo.username) {
      text.textContent = browser.i18n.getMessage('inputUsernameNotice');
      return;
    }
    if (currentInfo.username === (currentInfo.rule || {}).username) {
      const rendered = await renderTemplate(currentInfo, browser.i18n.getMessage('addedRuleNotice'), renderId);
      if (renderId !== renderCount) return;
      if (!rendered) text.textContent = browser.i18n.getMessage('noPageContextNotice');
    } else {
      const rendered = await renderTemplate(currentInfo, browser.i18n.getMessage('addRuleNotice'), renderId);
      if (renderId !== renderCount) return;
      if (!rendered) {
        text.textContent = browser.i18n.getMessage('noPageContextNotice');
        return;
      }
      confirm.textContent = browser.i18n.getMessage(currentInfo.rule ? 'updateRuleConfirm' : 'addRuleConfirm');
      confirm.style.display = 'inline';
      confirm.disabled = false;
    }
  };

  const renderPage = async function () {
    const renderId = ++renderCount;
    let info = null;
    try {
      info = await browser.runtime.sendMessage({ method: 'getPageContext' });
    } catch (error) {
      info = null;
    }
    if (renderId !== renderCount) return;
    try {
      await renderInfo(info, renderId);
    } catch (error) {
      if (renderId !== renderCount) return;
      currentInfo = null;
      document.querySelector('#confirm').disabled = true;
      document.querySelector('#confirm').style.display = 'none';
      document.querySelector('#text').textContent = browser.i18n.getMessage('noPageContextNotice');
    }
  };

  const confirm = document.querySelector('#confirm');
  confirm.addEventListener('click', async function () {
    if (!currentInfo || !currentInfo.username || confirm.disabled) return;
    confirm.disabled = true;
    try {
      await browser.runtime.sendMessage({ method: 'addRule', params: [currentInfo] });
    } catch (error) {
      // Rendering the latest context below allows the user to retry safely.
    } finally {
      await renderPage();
    }
  });

  await renderPage();
}());