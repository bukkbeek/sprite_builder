import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the old theme class
    root.classList.remove("light", "dark");
    
    // Add the new theme class
    root.classList.add(theme);
    
    // Update localStorage
    localStorage.setItem(storageKey, theme);
    
    // If Electron API is available, save theme preference to electron-store
    if (window.electronAPI) {
      window.electronAPI.setThemePreference(theme)
        .catch(error => console.error("Failed to save theme to Electron:", error));
    }
  }, [theme, storageKey]);

  // On first load, try to get theme from Electron if available
  useEffect(() => {
    const getElectronTheme = async () => {
      if (window.electronAPI) {
        try {
          const electronTheme = await window.electronAPI.getThemePreference();
          if (electronTheme && (electronTheme === "dark" || electronTheme === "light")) {
            setTheme(electronTheme);
          }
        } catch (error) {
          console.error("Failed to get theme from Electron:", error);
        }
      }
    };
    
    getElectronTheme();
  }, []);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
