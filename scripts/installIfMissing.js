const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const webDir = path.join(repoRoot, 'web');
  const webNodeModules = path.join(webDir, 'node_modules');

  // If web folder doesn't exist, nothing to do
  if (!fs.existsSync(webDir) || !fs.statSync(webDir).isDirectory()) {
    console.log('No web folder found, skipping web install.');
    return;
  }

  // If node_modules is missing or empty, run install in web
  let needInstall = false;
  if (!fs.existsSync(webNodeModules)) {
    needInstall = true;
  } else {
    try {
      const files = fs.readdirSync(webNodeModules);
      if (!files || files.length === 0) needInstall = true;
    } catch (e) {
      needInstall = true;
    }
  }

  if (needInstall) {
    console.log('Installing dependencies in ./web ...');
    run('npm --prefix web install');
  } else {
    console.log('web/node_modules present — skipping web install.');
  }
}

main();
