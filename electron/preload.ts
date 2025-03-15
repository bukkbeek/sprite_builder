import { contextBridge, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Select a directory using the native dialog
  selectDirectory: async (): Promise<string | null> => {
    try {
      const result = await ipcRenderer.invoke('dialog:openDirectory');
      return result || null;
    } catch (error) {
      console.error('Error selecting directory:', error);
      return null;
    }
  },

  // Save a file to the specified path
  saveFile: async (filePath: string, base64Data: string): Promise<boolean> => {
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
  createDirectory: async (dirPath: string): Promise<boolean> => {
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
});