/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FORGEPATH_SOURCE_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
