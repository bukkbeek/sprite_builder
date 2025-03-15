const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize store for app settings
const store = new Store();

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Determine the correct icon path based on the platform and environment
  let iconPath;
  if (app.isPackaged) {
    // In production, use the path relative to the resources directory
    // electron-builder places resources in the resources directory
    iconPath = path.join(process.resourcesPath, process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  } else {
    // In development, use the path relative to the current directory
    iconPath = path.join(__dirname, '../public', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a1a', // Dark background color
    title: 'Sprite Builder',
    show: false, // Hide window initially
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false // Disable sandbox to allow file system access
    },
    icon: iconPath,
    autoHideMenuBar: true // Disable the menu bar
  });

  // Log the icon path to verify it's correct
  console.log('Using icon path:', iconPath);
  console.log('Icon exists:', fs.existsSync(iconPath));

  // Log the preload path to verify it's correct
  console.log('Preload script path:', path.join(__dirname, 'preload.js'));
  console.log('Preload script exists:', fs.existsSync(path.join(__dirname, 'preload.js')));

  // Load the app
  const indexPath = path.join(__dirname, '../dist/index.html');
  console.log('Loading main app:', indexPath);
  mainWindow.loadFile(indexPath);
  
  // Maximize and show the window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  
  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS applications keep their menu bar active until the user quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked and no other windows open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle file open dialog
ipcMain.handle('open-file-dialog', () => {
  const { canceled, filePaths } = dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'GLB Models', extensions: ['glb'] }
    ]
  });
  
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  return null;
});

// Handle file save dialog
ipcMain.handle('save-file-dialog', (event, options) => {
  const { defaultPath, filters } = options;
  
  const { canceled, filePath } = dialog.showSaveDialog({
    defaultPath,
    filters
  });
  
  if (!canceled && filePath) {
    return filePath;
  }
  return null;
});

// Handle file save
ipcMain.handle('save-file', (event, { filePath, data }) => {
  try {
    // Convert base64 data to buffer if it's an image
    if (data.startsWith('data:image')) {
      const base64Data = data.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else {
      // Regular text data
      fs.writeFileSync(filePath, data);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle theme preference
ipcMain.handle('get-theme-preference', () => {
  return store.get('theme', 'dark'); // Default to dark theme
});

ipcMain.handle('set-theme-preference', (event, theme) => {
  store.set('theme', theme);
  return theme;
});

// Handle directory selection dialog
ipcMain.handle('dialog:openDirectory', async () => {
  console.log('dialog:openDirectory handler called');
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    console.log('dialog:openDirectory result:', result);
    
    if (result.canceled) {
      return null;
    } else {
      return result.filePaths[0];
    }
  } catch (error) {
    console.error('dialog:openDirectory error:', error);
    return null;
  }
});
