/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_STORAGE_BUCKET: string;
  readonly VITE_TABLE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
