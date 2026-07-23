import type { Article } from '../providers/types'
import { useFeedStore } from '../stores/feedStore'
import { useConfigStore } from '../stores/configStore'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const BATCH_SIZE = 5      // articles per Gemini call
const FLUSH_MS = 4_000    // 4 s → stays under 15 RPM free tier

interface GeminiResult {
  overallSentiment: 'bullish' | 'bearish' | 'neutral'
  sentimentScore: number
  keyFactors: string[]
  confidence: number
  summary: string
}

interface QueueEntry {
  id: string
  title: string
  summary: string
  symbol?: string
}

function buildSentimentPrompt(articles: QueueEntry[], symbol?: string): string {
  const newsText = articles
    .map((a, i) => `Article ${i + 1}:\n${a.title}\n${a.summary}`)
    .join('\n\n')
  const context = symbol ? `about ${symbol}` : 'about the financial markets'
  return `You are a financial sentiment analyst. Analyze the following news articles ${context} and return a JSON response with:

1. "overallSentiment": "bullish", "bearish", or "neutral"
2. "sentimentScore": a number from -1 (very bearish) to +1 (very bullish)
3. "keyFactors": array of the 3 most important factors driving the sentiment
4. "confidence": number from 0 to 1 indicating your confidence
5. "summary": one-sentence summary of the sentiment

News articles:
${newsText}

Return ONLY valid JSON, no other text.`
}

async function callGemini(prompt: string, apiKey: string): Promise<GeminiResult | null> {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    return JSON.parse(text) as GeminiResult
  } catch {
    return null
  }
}

class SentimentAnalyzer {
  private queue: QueueEntry[] = []
  private timer: ReturnType<typeof setInterval> | null = null

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => void this.flush(), FLUSH_MS)
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  enqueue(article: Article): void {
    this.queue.push({
      id: article.id,
      title: article.title,
      summary: article.summary,
      symbol: article.symbols[0],
    })
  }

  private async flush(): Promise<void> {
    const { geminiApiKey } = useConfigStore.getState()
    if (!geminiApiKey || this.queue.length === 0) return

    const batch = this.queue.splice(0, BATCH_SIZE * 4)

    // Group by primary symbol so each prompt is contextually coherent
    const bySymbol = new Map<string, QueueEntry[]>()
    for (const entry of batch) {
      const key = entry.symbol ?? '__general__'
      const group = bySymbol.get(key) ?? []
      group.push(entry)
      bySymbol.set(key, group)
    }

    for (const [symbol, entries] of bySymbol) {
      const sym = symbol === '__general__' ? undefined : symbol
      const prompt = buildSentimentPrompt(entries.slice(0, BATCH_SIZE), sym)
      const result = await callGemini(prompt, geminiApiKey)
      if (!result) continue

      const sentiment =
        result.overallSentiment === 'bullish' ||
        result.overallSentiment === 'bearish' ||
        result.overallSentiment === 'neutral'
          ? result.overallSentiment
          : undefined

      for (const entry of entries) {
        useFeedStore.getState().updateArticleSentiment(entry.id, {
          sentiment,
          sentiment_score: result.sentimentScore,
          sentiment_summary: result.summary,
          sentiment_confidence: result.confidence,
          sentiment_key_factors: result.keyFactors,
        })
      }
    }
  }
}

let _analyzer: SentimentAnalyzer | null = null

export function getSentimentAnalyzer(): SentimentAnalyzer {
  if (!_analyzer) _analyzer = new SentimentAnalyzer()
  return _analyzer
}
