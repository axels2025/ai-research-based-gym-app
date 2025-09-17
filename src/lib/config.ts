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
    aiProxy: {
      endpoint: string;
    };
    environment: 'development' | 'production';
  }
  
  // Production configuration (safe to commit to git)
  const productionConfig: Config = {
    firebase: {
      apiKey: "AIzaSyC4U3RQY8nsLjwoqRuVPrA2-pZiw9Sl4qI", // Your actual Firebase API key
      authDomain: "ai-research-based-gym-app.firebaseapp.com",
      projectId: "ai-research-based-gym-app",
      storageBucket: "ai-research-based-gym-app.firebasestorage.app",
      messagingSenderId: "203936492478",
      appId: "1:203936492478:web:767baf35996c4bc96227ef"
    },
    aiProxy: {
      endpoint: "https://ai-muscle-coach-proxy.axel-schneider.workers.dev"
    },
    environment: 'production'
  };
  
  // Development configuration fallback
  const developmentConfig: Config = {
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || productionConfig.firebase.apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || productionConfig.firebase.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || productionConfig.firebase.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || productionConfig.firebase.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || productionConfig.firebase.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || productionConfig.firebase.appId,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    },
    aiProxy: {
      endpoint: import.meta.env.VITE_AI_PROXY_ENDPOINT || productionConfig.aiProxy.endpoint
    },
    environment: 'development'
  };
  
  // Determine which config to use
  const isDevelopment = import.meta.env.DEV;
  const baseConfig = isDevelopment ? developmentConfig : productionConfig;
  
  // Export the final configuration
  export const config: Config = baseConfig;
  
  // Validation function
  export function validateConfig(): boolean {
    const required = [
      config.firebase.apiKey,
      config.firebase.authDomain,
      config.firebase.projectId,
      config.firebase.storageBucket,
      config.firebase.messagingSenderId,
      config.firebase.appId,
      config.aiProxy.endpoint
    ];
  
    const missing = required.filter(value => !value);
    
    if (missing.length > 0) {
      console.error('❌ Missing required configuration values');
      return false;
    }
  
    console.log(`✅ Configuration loaded for ${config.environment} environment with AI proxy: ${config.aiProxy.endpoint}`);
    return true;
  }