// src/utils/loadingManager.ts

// Define the shape of our loading state
type LoadingState = {
  isLoading: boolean;
  message: string;
};

type Listener = (state: LoadingState) => void;

let activeRequests = 0;
// Default message
let currentMessage = "Loading...";
let listeners: Listener[] = [];

export const loadingManager = {
  // Now accepts an optional message string
  show: (message: string = "Processing...") => {
    if (activeRequests === 0) {
      currentMessage = message;
      // Notify with TRUE and the specific message
      notifyListeners(true, currentMessage);
    }
    activeRequests++;
  },

  hide: () => {
    activeRequests--;
    // Prevent negative counter
    if (activeRequests < 0) activeRequests = 0;
    
    if (activeRequests === 0) {
      // Notify with FALSE (message doesn't matter here)
      notifyListeners(false, "");
    }
  },

  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

const notifyListeners = (isLoading: boolean, message: string) => {
  listeners.forEach((listener) => listener({ isLoading, message }));
};