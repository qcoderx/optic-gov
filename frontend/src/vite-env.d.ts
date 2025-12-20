/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_NETWORK?: string;
  readonly VITE_SUI_PACKAGE_ID?: string;
  readonly VITE_PROJECT_REGISTRY?: string;
  readonly VITE_MILESTONE_MANAGER?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
