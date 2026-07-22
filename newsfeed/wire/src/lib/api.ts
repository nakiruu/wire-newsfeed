import { useConfigStore } from '../stores/configStore'

export function buildProxiedUrl(url: string, proxyBase: string): string {
  if (!proxyBase) return url
  return `${proxyBase.replace(/\/$/, '')}/${url}`
}

export async function proxyFetch(url: string, options?: RequestInit): Promise<Response> {
  const proxyBase = useConfigStore.getState().corsProxyUrl
  return fetch(buildProxiedUrl(url, proxyBase), options)
}
