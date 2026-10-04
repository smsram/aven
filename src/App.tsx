import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/AppShell';

export function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
