// src/App.tsx
import { useState, useEffect } from 'react';
import AppRouter from './router/AppRouter';
import { loadingManager } from './utils/loadingManager';
import { LoadingScreen } from './components/shared/LoadingScreen';

function App() {
  // State now holds both loading status and the message
  const [loadingState, setLoadingState] = useState({ 
    isLoading: false, 
    message: '' 
  });

  useEffect(() => {
    const unsubscribe = loadingManager.subscribe((state) => {
      setLoadingState(state);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Pass the dynamic message to the component */}
      {loadingState.isLoading && <LoadingScreen message={loadingState.message} />}
      
      <AppRouter />
    </>
  );
}

export default App;