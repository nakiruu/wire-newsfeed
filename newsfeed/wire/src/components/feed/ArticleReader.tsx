import { useState, useEffect } from 'react'
import { X, ExternalLink, Loader } from 'lucide-react'
import { useConfigStore } from '../../stores/configStore'
import type { Article } from '../../providers/types'

type State = 'idle' | 'loading' | 'done' | 'error' | 'not-configured'

export function ArticleReader({ article, onClose }: { article: Article | null; onClose(): void }) {
  const articleExtractorUrl = useConfigStore(s => s.articleExtractorUrl)
  const [state, setState] = useState<State>('idle')
  const [text, setText] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!article) return
    if (!articleExtractorUrl) { setState('not-configured'); return }

    setState('loading')
    setText(null)
    setTitle(null)

    fetch(`${articleExtractorUrl.replace(/\/$/, '')}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: article.url }),
    })
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || null)
        setText(data.text || null)
        setState(data.text ? 'done' : 'error')
      })
      .catch(() => setState('error'))
  }, [article, articleExtractorUrl])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!article) return null

  return (
    <div
      role="dialog"
      aria-label="Article reader"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm px-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[720px] bg-[#111111] border border-[#1F1F1F] rounded-[12px] my-8">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-[#111111] border-b border-[#1F1F1F] rounded-t-[12px] z-10">
          <span className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em]">Reader</span>
          <div className="flex items-center gap-3">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[0.75rem] text-[#555555] hover:text-[#EDEDED] transition-colors duration-[150ms]"
            >
              <ExternalLink size={12} aria-hidden="true" />
              Original
            </a>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#555555] hover:text-[#EDEDED] transition-colors duration-[150ms]"
              aria-label="Close reader"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 min-h-[200px]">
          {state === 'loading' && (
            <div className="flex items-center justify-center py-16 text-[#555555]">
              <Loader size={18} className="animate-spin mr-2" aria-hidden="true" />
              <span className="text-[0.875rem]">Extracting article…</span>
            </div>
          )}

          {state === 'not-configured' && (
            <div className="py-12 text-center space-y-2">
              <p className="text-[#888888] text-[0.9375rem]">Article extractor not configured.</p>
              <p className="text-[0.8125rem] text-[#555555]">
                Set the <span className="font-mono text-[#EDEDED]">VITE_ARTICLE_EXTRACTOR_URL</span> in your{' '}
                <code className="text-[#EDEDED]">.env</code> or add it in Settings → Article Extractor.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="py-12 text-center space-y-2">
              <p className="text-[#FF4444] text-[0.9375rem]">Could not extract article content.</p>
              <p className="text-[0.8125rem] text-[#555555]">
                The site may block scraping or require JavaScript rendering.{' '}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0070F3] hover:underline"
                >
                  Open original
                </a>
              </p>
            </div>
          )}

          {state === 'done' && text && (
            <>
              <h1 className="text-[1.375rem] font-semibold text-[#EDEDED] leading-[1.35] tracking-[-0.02em] mb-1">
                {title || article.title}
              </h1>
              <p className="text-[0.75rem] text-[#555555] mb-6">
                {article.provider_label}
                {article.published_at && (
                  <> · {new Date(article.published_at).toLocaleString()}</>
                )}
              </p>
              <div className="prose-reader">
                {text.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para.replace(/\n/g, ' ')}</p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
