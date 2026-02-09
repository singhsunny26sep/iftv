import React from 'react';
import Navigation from './src/navigation/Navigation';
import { AuthProvider } from './src/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

export default App;