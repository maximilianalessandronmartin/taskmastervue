/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly SSR: boolean;


    // Deine benutzerdefinierten Umgebungsvariablen
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_BASE_URL_SOCKET: string;
    readonly VITE_LOG_LEVEL: string;


    [key: string]: string | boolean | undefined;
  };
}
