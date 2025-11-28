import React from 'react';

// Props interface with enhanced options
interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  variant?: 'default' | 'fullscreen' | 'minimal';
  showProgress?: boolean;
  progress?: number;
}

export const LoadingScreen = ({ 
  message = "Processing Request...",
  submessage = "Please wait...",
  variant = 'default',
  showProgress = false,
  progress = 0
}: LoadingScreenProps) => {
  
  // Simple animated loader using CSS variables for theme support
  const Spinner = () => (
    <div className="relative w-32 h-32">
      {/* Track ring: using border-muted */}
      <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
      {/* Primary Spinner: using border-primary */}
      <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
      {/* Inner accent spinner: using border-primary with opacity */}
      <div className="absolute inset-2 border-4 border-primary/60 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
    </div>
  );

  const ProgressBar = () => (
    <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mt-4">
      <div 
        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-foreground font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-300">
      
      <div className="relative flex flex-col items-center p-8 rounded-2xl">
        
        {/* Animated Spinner */}
        <div className="flex items-center justify-center">
          <Spinner />
        </div>

        {/* Dynamic Message */}
        <h2 className="mt-6 text-2xl font-bold text-foreground tracking-tight animate-pulse text-center max-w-md">
          {message}
        </h2>
        
        {/* Submessage */}
        <p className="text-base text-muted-foreground mt-2 font-medium">
          {submessage}
        </p>

        {/* Optional Progress Bar */}
        {showProgress && <ProgressBar />}{/* Animated Dots using Primary Color */}
        <div className="flex space-x-2 mt-4">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
};

// Demo component showing different variants with theme support
export default function LoadingScreenDemo() {
  const [variant, setVariant] = React.useState<'default' | 'minimal'>('default');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">Loading Screen Variants</h1>
        
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setVariant('default')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                variant === 'default' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setVariant('minimal')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                variant === 'minimal' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Minimal
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Usage Examples</h2>
          <div className="space-y-4 text-sm">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <code className="text-primary">
                {`<LoadingScreen message="Loading data..." />`}
              </code>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <code className="text-primary">
                {`<LoadingScreen 
  message="Uploading files..." 
  submessage="This may take a moment"
  variant="minimal"
/>`}
              </code>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <code className="text-primary">
                {`<LoadingScreen 
  message="Processing..." 
  showProgress={true}
  progress={progress}
/>`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <LoadingScreen 
        message="Processing Your Request..." 
        submessage="Analyzing logistics data"
        variant={variant}
        showProgress={variant === 'default'}
        progress={progress}
      />
    </div>
  );
}