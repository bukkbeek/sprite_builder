const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Add debugging
console.log('Preload script is running');

// Define the APIs we want to expose
const electronAPI = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // Theme preferences
  getThemePreference: () => ipcRenderer.invoke('get-theme-preference'),
  setThemePreference: (theme) => ipcRenderer.invoke('set-theme-preference', theme),
  
  // Add our new functions here as well for compatibility
  selectDirectory: async () => {
    console.log('electronAPI.selectDirectory function called');
    try {
      const result = await ipcRenderer.invoke('dialog:openDirectory');
      console.log('electronAPI.selectDirectory result:', result);
      return result || null;
    } catch (error) {
      console.error('Error selecting directory:', error);
      return null;
    }
  },
  createDirectory: async (dirPath) => {
    console.log('electronAPI.createDirectory function called', dirPath);
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  },
  saveImageFile: async (filePath, base64Data) => {
    console.log('electronAPI.saveImageFile function called', filePath);
    try {
      // Convert base64 to buffer
      const base64Content = base64Data.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Content, 'base64');
      
      // Ensure the directory exists
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }
};

const electron = {
  // Select a directory using the native dialog
  selectDirectory: async () => {
    console.log('electron.selectDirectory function called');
    try {
      const result = await ipcRenderer.invoke('dialog:openDirectory');
      console.log('electron.selectDirectory result:', result);
      return result || null;
    } catch (error) {
      console.error('Error selecting directory:', error);
      return null;
    }
  },

  // Save a file to the specified path
  saveFile: async (filePath, base64Data) => {
    console.log('electron.saveFile function called', filePath);
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Ensure the directory exists
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  },

  // Create a directory
  createDirectory: async (dirPath) => {
    console.log('electron.createDirectory function called', dirPath);
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  }
};

// Expose the APIs
try {
  console.log('Exposing electronAPI to window');
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  console.log('Exposing electron to window');
  contextBridge.exposeInMainWorld('electron', electron);
  console.log('APIs exposed successfully');
} catch (error) {
  console.error('Error exposing APIs:', error);
}

// Log that preload script has completed
console.log('Preload script completed, APIs should be exposed now');
