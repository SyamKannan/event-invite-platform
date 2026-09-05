// CONFIG CONTEXT — replaces the old static `import { config } from
// './config/wedding.config.js'` used throughout every section.
//
// Every section still calls `useConfig()` to get the same config-shaped
// object; the only thing that changed is where that object comes from: it's
// now fetched per-slug from the Laravel API instead of hardcoded in a file.

import { createContext, useContext } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ config, children }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error('useConfig() must be used within a <ConfigProvider>.');
  }
  return config;
}
