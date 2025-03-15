interface ElectronAPI {
  openFileDialog: () => Promise<string | null>;
  saveFileDialog: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  saveFile: (data: { filePath: string; data: string }) => Promise<{ success: boolean; error?: string }>;
  getThemePreference: () => Promise<string>;
  setThemePreference: (theme: string) => Promise<string>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
