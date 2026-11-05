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
assert.equal(manifest.manifest_version, 2, 'Manifest V2 was intentionally retained');
assert.notEqual(manifest.browser_specific_settings.gecko.id, '{bb1b34f2-0bfd-4bf5-a2b0-dd9d0a2faf01}', 'Fork must not reuse upstream ID');
assert.deepEqual(Object.keys(english).sort(), Object.keys(chinese).sort(), 'Locales must contain the same message keys');
assert.ok(manifest.content_scripts[0].matches.includes('http://*/*'), 'HTTP login pages should be matched');
assert.ok(manifest.content_scripts[0].matches.includes('https://*/*'), 'HTTPS login pages should be matched');
assert.ok(!manifest.permissions.includes('cookies'), 'Unused cookies permission should not be requested');
assert.ok(!manifest.permissions.includes('tabs'), 'Broad host permissions already expose required tab URL metadata');
assert.ok(manifest.browser_specific_settings.gecko.data_collection_permissions.required.includes('authenticationInfo'), 'Synced usernames must be declared');
assert.ok(manifest.browser_specific_settings.gecko.data_collection_permissions.required.includes('browsingActivity'), 'Synced website hosts must be declared');
assert.ok(Number.parseInt(manifest.browser_specific_settings.gecko.strict_min_version, 10) >= 140, 'Built-in data consent requires Firefox 140+ unless a custom fallback is implemented');
process.stdout.write('Manifest and locale policy checks OK\n');
