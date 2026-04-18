const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

for (const key of required) {
  if (!import.meta.env[key]) {
    // Warn in runtime but don't crash to allow UI scaffolding without env loaded.
    console.warn(`Missing env variable: ${key}`);
  }
}

export const env = {
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID as string
};
