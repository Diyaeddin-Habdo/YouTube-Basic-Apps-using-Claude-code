// Spawns Electron with ELECTRON_RUN_AS_NODE removed.
// Some Windows environments set ELECTRON_RUN_AS_NODE=1 globally, which makes
// `electron .` run as plain Node and breaks `require('electron')` in the main
// process. Cross-env can't *unset* a var (only set it to empty string), so we
// do it here in Node where `delete process.env.X` actually works.

const { spawn } = require('node:child_process');
const path = require('node:path');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronBin = require('electron'); // path string when run from plain Node
const args = process.argv.slice(2);
const child = spawn(electronBin, ['.', ...args], {
  env,
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
});

child.on('close', (code) => process.exit(code ?? 0));
