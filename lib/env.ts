interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_PROJECT_ID: string;
  BACKEND_URL?: string;
  PUBLIC_APP_URL?: string;
}

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  config?: EnvConfig;
}

function validateEnvVariables(): EnvValidationResult {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID'
  ];

  const errors: string[] = [];
  const config: Partial<EnvConfig> = {};

  for (const varName of requiredVars) {
    const value = import.meta.env[varName];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    if (varName === 'VITE_SUPABASE_URL') {
      try {
        new URL(value);
      } catch {
        errors.push(`Invalid URL format for ${varName}`);
        continue;
      }
    }

    const key = varName.replace('VITE_', '') as keyof EnvConfig;
    config[key] = value as string;
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { 
    isValid: true, 
    errors: [],
    config: config as EnvConfig 
  };
}

function getEnvOrThrow(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const envConfig = {
  validate: validateEnvVariables,
  getOrThrow: getEnvOrThrow,
  
  get supabaseUrl(): string {
    return getEnvOrThrow('VITE_SUPABASE_URL');
  },
  
  get supabaseKey(): string {
    return getEnvOrThrow('VITE_SUPABASE_PUBLISHABLE_KEY');
  },
  
  get projectId(): string {
    return getEnvOrThrow('VITE_SUPABASE_PROJECT_ID');
  },

  get backendUrl(): string | undefined {
    return import.meta.env.VITE_BACKEND_URL;
  },

  get publicAppUrl(): string | undefined {
    return import.meta.env.VITE_PUBLIC_APP_URL;
  }
};

if (import.meta.env.DEV) {
  const result = envConfig.validate();
  if (!result.isValid) {
    console.error('Environment validation failed:', result.errors);
  }
}
