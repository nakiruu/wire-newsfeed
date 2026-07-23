/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CORS_PROXY_URL: string
  readonly VITE_FINNHUB_API_KEY: string
  readonly VITE_ALPACA_API_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_ARTICLE_EXTRACTOR_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
