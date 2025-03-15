const fs = require('fs');
const path = require('path');

// Create dist-electron directory if it doesn't exist
const distElectronDir = path.join(__dirname, 'dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
}

// Copy main.js to dist-electron
const mainJsSource = path.join(__dirname, 'electron', 'main.js');
const mainJsTarget = path.join(distElectronDir, 'main.js');
fs.copyFileSync(mainJsSource, mainJsTarget);
console.log(`Copied ${mainJsSource} to ${mainJsTarget}`);

// Copy preload.js to dist-electron
const preloadJsSource = path.join(__dirname, 'electron', 'preload.js');
const preloadJsTarget = path.join(distElectronDir, 'preload.js');
fs.copyFileSync(preloadJsSource, preloadJsTarget);
console.log(`Copied ${preloadJsSource} to ${preloadJsTarget}`);

// Ensure public assets are copied to dist
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(publicDir)) {
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Copy all files from public to dist
  const copyFiles = (srcDir, destDir) => {
    const files = fs.readdirSync(srcDir);
    
    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyFiles(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${srcPath} to ${destPath}`);
      }
    }
  };
  
  copyFiles(publicDir, distDir);
}

console.log('Electron files copied successfully!');
