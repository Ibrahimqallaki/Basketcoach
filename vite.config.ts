import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Ladda miljövariabler baserat på mode (development/production)
  // Den tredje parametern '' gör att den laddar ALLA env-vars, inte bara de som börjar med VITE_
  // Detta är nödvändigt för att fånga API_KEY om den inte heter VITE_API_KEY.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // 'define' ersätter globala variabler i koden vid byggtiden.
    // Här ser vi till att process.env.API_KEY faktiskt innehåller värdet från miljön.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Vi exponerar även Firebase-variablerna om de används via process.env i koden
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      // För säkerhets skull, definiera ett tomt process.env objekt för att undvika kraschar i bibliotek som förväntar sig det
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-genai': ['@google/genai'],
            'vendor-icons': ['lucide-react']
          }
        }
      }
    }
  };
});