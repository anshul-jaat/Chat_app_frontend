const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- Starting Chat App Frontend Build ---');

// Check if we are at the repo root or inside the frontend directory
if (fs.existsSync(path.join(__dirname, 'frontend', 'package.json'))) {
  console.log('Executing build from repository root...');
  execSync('npm run build --prefix frontend', { stdio: 'inherit' });

  // Mirror the build output to ./dist so both ./dist and ./frontend/dist exist
  const srcDist = path.join(__dirname, 'frontend', 'dist');
  const destDist = path.join(__dirname, 'dist');
  if (fs.existsSync(srcDist)) {
    fs.cpSync(srcDist, destDist, { recursive: true });
    console.log('Mirrored build output to ./dist');
  }
} else {
  console.log('Executing build inside frontend directory...');
  execSync('npx vite build', { stdio: 'inherit' });
}

console.log('--- Build Finished Successfully ---');
