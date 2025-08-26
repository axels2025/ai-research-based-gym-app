// Configuration management for different environments
// This file handles both local development and production deployment

interface Config {
    firebase: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      measurementId?: string;
    };
    anthropic: {
      apiKey: string;
    };
    environment: 'development' | 'production';
  }
  
  // Production configuration (safe to commit to git)
  const productionConfig: Omit<Config, 'anthropic'> = {
    firebase: {
      apiKey: "AIzaSyC4U3RQY8nsLjwoqRuVPrA2-pZiw9Sl4qI", // Your actual Firebase API key
      authDomain: "ai-research-based-gym-app.firebaseapp.com",
      projectId: "ai-research-based-gym-app",
      storageBucket: "ai-research-based-gym-app.firebasestorage.app",
      messagingSenderId: "203936492478",
      appId: "1:203936492478:web:767baf35996c4bc96227ef"
    },
    environment: 'production'
  };
  
  // Development configuration fallback
  const developmentConfig: Omit<Config, 'anthropic'> = {
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || productionConfig.firebase.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || productionConfig.firebase.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || productionConfig.firebase.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || productionConfig.firebase.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || productionConfig.firebase.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || productionConfig.firebase.appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    },
    environment: 'development'
  };
  
  // Determine which config to use
  const isDevelopment = import.meta.env.DEV;
  const baseConfig = isDevelopment ? developmentConfig : productionConfig;
  
  // Handle Anthropic API key (still needs to be provided somehow)
  function getAnthropicApiKey(): string {
    // Try environment variable first (for local development)
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (envKey) {
      return envKey;
    }
  
    // For production, you could:
    // 1. Use Firebase Functions with Secret Manager
    // 2. Use a backend API endpoint
    // 3. Prompt user to enter it in the UI
    // 4. Use Firebase Remote Config (less secure)
    
    throw new Error('Anthropic API key not found. Please provide it via environment variable or implement alternative solution.');
  }
  
  // Export the final configuration
  export const config: Config = {
    ...baseConfig,
    anthropic: {
      apiKey: getAnthropicApiKey()
    }
  };
  
  // Validation function
  export function validateConfig(): boolean {
    const required = [
      config.firebase.apiKey,
      config.firebase.authDomain,
      config.firebase.projectId,
      config.firebase.storageBucket,
      config.firebase.messagingSenderId,
      config.firebase.appId
    ];
  
    const missing = required.filter(value => !value);
    
    if (missing.length > 0) {
      console.error('❌ Missing required configuration values');
      return false;
    }
  
    console.log(`✅ Configuration loaded for ${config.environment} environment`);
    return true;
  }