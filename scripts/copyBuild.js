const fs = require('fs').promises;
const path = require('path');

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const buildDir = path.join(repoRoot, 'web', 'build');
    const outDir = path.join(repoRoot, 'html');

    // Ensure build exists
    const stat = await fs.stat(buildDir).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      console.error('Build directory not found:', buildDir);
      process.exit(2);
    }

    // Ensure destination exists
    await fs.mkdir(outDir, { recursive: true });

    // Clean destination but PRESERVE any `sound` directory at any level
    async function cleanDirPreserveSound(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'sound') {
            console.log('Preserving sound folder:', entryPath);
            continue; // do not delete this folder or its children
          }
          // Recurse into directory to clean its children but preserve any 'sound' subfolders
          await cleanDirPreserveSound(entryPath);
          // After cleaning children, try to remove the directory if it's empty
          const remaining = await fs.readdir(entryPath).catch(() => []);
          if (remaining.length === 0) {
            await fs.rmdir(entryPath).catch(() => {});
          }
        } else {
          // file -> remove
          await fs.unlink(entryPath).catch(() => {});
        }
      }
    }

    await cleanDirPreserveSound(outDir);

    console.log('Copying files from', buildDir, 'to', outDir, '(sound preserved)');
    await copyDir(buildDir, outDir);
    console.log('Copy complete.');
  } catch (err) {
    console.error('Error copying build files:', err);
    process.exit(1);
  }
}

main();
