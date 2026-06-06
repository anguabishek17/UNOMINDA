const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const WATCH_PATHS = [
  { path: path.join(__dirname, '../frontend/src'), recursive: true },
  { path: path.join(__dirname, '../backend/src'), recursive: true },
  { path: path.join(__dirname, '..'), recursive: false }
];

const DEBOUNCE_MS = 15000; // Wait 15 seconds of silence before pushing
let timeoutId = null;

console.log('[Auto-Sync] Started watching paths:');
WATCH_PATHS.forEach(wp => {
  if (fs.existsSync(wp.path)) {
    console.log(` - ${wp.path} (recursive: ${wp.recursive})`);
  } else {
    console.log(` - [WARNING] Path does not exist: ${wp.path}`);
  }
});

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function syncChanges() {
  try {
    const status = await runCommand('git status --porcelain');
    if (!status) {
      console.log('[Auto-Sync] No changes detected.');
      return;
    }

    console.log('[Auto-Sync] Changes detected:\n' + status);
    console.log('[Auto-Sync] Staging files...');
    await runCommand('git add -A');

    const timestamp = new Date().toLocaleString();
    const commitMsg = `auto: sync changes (${timestamp})`;
    console.log(`[Auto-Sync] Committing: "${commitMsg}"`);
    await runCommand(`git commit -m "${commitMsg}"`);

    console.log('[Auto-Sync] Pushing to GitHub...');
    const pushOutput = await runCommand('git push origin main');
    console.log('[Auto-Sync] Successfully pushed to GitHub!');
    if (pushOutput) console.log(pushOutput);
  } catch (err) {
    console.error('[Auto-Sync] Error during sync:', err.stderr || err.error || err);
  }
}

function handleChange(eventType, filename) {
  if (filename) {
    // Ignore directories, system files, or node_modules
    if (
      filename.endsWith('~') || 
      filename.startsWith('.') || 
      filename.includes('node_modules') ||
      filename.includes('.git') ||
      filename.includes('.next') ||
      filename.includes('dist') ||
      filename.includes('uploads')
    ) {
      return;
    }
  }

  console.log(`[Auto-Sync] Change detected (${eventType}: ${filename || 'unknown file'}). Debouncing for ${DEBOUNCE_MS / 1000}s...`);

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => {
    timeoutId = null;
    console.log('[Auto-Sync] Silence timeout reached. Triggering sync...');
    syncChanges();
  }, DEBOUNCE_MS);
}

// Start watching
WATCH_PATHS.forEach(wp => {
  if (fs.existsSync(wp.path)) {
    fs.watch(wp.path, { recursive: wp.recursive }, handleChange);
  }
});
