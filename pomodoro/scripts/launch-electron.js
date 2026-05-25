#!/usr/bin/env node
// Launches Electron after explicitly deleting ELECTRON_RUN_AS_NODE so the
// binary boots into main-process mode (not Node-only mode). This is needed
// in dev environments where that env var is pre-set globally.

const { spawn } = require('node:child_process');
const path = require('node:path');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
delete env.ELECTRON_NO_ATTACH_CONSOLE; // optional: ensure normal console attach

// Resolve the electron executable from node_modules
const electronPath = require('electron'); // when run via plain node, returns string path

const args = process.argv.slice(2);
if (args.length === 0) args.push('.');

const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env,
  windowsHide: false
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('[launch-electron] failed:', err);
  process.exit(1);
});
