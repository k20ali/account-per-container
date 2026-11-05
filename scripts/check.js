'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jsonFiles = [
  'package.json',
  'extension/manifest.json',
  'extension/_locales/en/messages.json',
  'extension/_locales/zh_CN/messages.json',
];
const jsFiles = [
  'extension/background.js',
  'extension/content.js',
  'extension/options.js',
  'extension/pageaction.js',
  'tests/background.test.js',
  'tests/content.test.js',
  'scripts/check.js',
];

for (const file of jsonFiles) {
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  process.stdout.write('JSON OK: ' + file + '\n');
}

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    process.exitCode = result.status || 1;
    throw new Error('Syntax check failed: ' + file);
  }
  process.stdout.write('Syntax OK: ' + file + '\n');
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8'));
const english = JSON.parse(fs.readFileSync(path.join(root, 'extension/_locales/en/messages.json'), 'utf8'));
const chinese = JSON.parse(fs.readFileSync(path.join(root, 'extension/_locales/zh_CN/messages.json'), 'utf8'));
assert.equal(manifest.manifest_version, 2, 'Manifest V2 is intentionally retained for this maintenance release');
assert.equal(manifest.name, '__MSG_extensionName__');
assert.notEqual(manifest.browser_specific_settings.gecko.id, '{bb1b34f2-0bfd-4bf5-a2b0-dd9d0a2faf01}', 'Fork must not reuse upstream ID');
assert.deepEqual(Object.keys(english).sort(), Object.keys(chinese).sort(), 'Locales must contain the same message keys');
assert.ok(manifest.content_scripts[0].matches.includes('http://*/*'), 'HTTP login pages should be matched');
assert.ok(manifest.content_scripts[0].matches.includes('https://*/*'), 'HTTPS login pages should be matched');
assert.ok(manifest.permissions.includes('cookies'), 'Firefox contextualIdentities API requires cookies permission');
assert.ok(manifest.permissions.includes('contextualIdentities'), 'Container identity access must be declared');
assert.ok(!manifest.permissions.includes('tabs'), 'Broad HTTP(S) host permissions are used instead of the separate tabs permission');
assert.ok(!manifest.browser_specific_settings.gecko_android, 'This release is not advertised as supporting Firefox Android');
assert.ok(manifest.browser_specific_settings.gecko.data_collection_permissions.required.includes('authenticationInfo'), 'Saved usernames must be declared');
assert.ok(manifest.browser_specific_settings.gecko.data_collection_permissions.required.includes('browsingActivity'), 'Saved website hosts must be declared');
assert.ok(Number.parseInt(manifest.browser_specific_settings.gecko.strict_min_version, 10) >= 142, 'This desktop-only AMO release requires Firefox 142+ to avoid the Android data-consent minimum-version warning');
assert.equal(english.extensionName.message, 'Container Username Assistant', 'Fork display name must remain distinct from upstream');
process.stdout.write('Manifest, privacy and locale policy checks OK\n');
