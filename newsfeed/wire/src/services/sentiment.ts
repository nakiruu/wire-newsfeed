import type { Article } from '../providers/types'
import { useFeedStore } from '../stores/feedStore'
import { useConfigStore } from '../stores/configStore'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// One call per flush, one flush per interval — guaranteed ≤ 15 RPM on the free tier
const BATCH_SIZE = 5
const FLUSH_MS = 4_500

interface ArticleResult {
  index: number
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

function buildSentimentPrompt(articles: QueueEntry[]): string {
  const newsText = articles
    .map((a, i) =>
      `Article ${i + 1}${a.symbol ? ` [${a.symbol}]` : ''}:\n${a.title}\n${a.summary}`
    )
    .join('\n\n')

  return `You are a financial sentiment analyst. Analyze the following ${articles.length} news article(s) and return a JSON array with one object per article in this exact format:

[
  {
    "index": 1,
    "overallSentiment": "bullish",
    "sentimentScore": 0.72,
    "keyFactors": ["factor 1", "factor 2", "factor 3"],
    "confidence": 0.85,
    "summary": "One-sentence summary of the sentiment."
  }
]

Fields:
- "index": matches the Article number above (1-based)
- "overallSentiment": exactly "bullish", "bearish", or "neutral"
- "sentimentScore": number from -1 (very bearish) to +1 (very bullish)
- "keyFactors": array of up to 3 key factors driving the sentiment
- "confidence": number from 0 to 1 indicating your confidence
- "summary": one sentence describing the sentiment

News articles:
${newsText}

Return ONLY a valid JSON array, no other text.`
}

async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<{ results: ArticleResult[]; rateLimited: boolean }> {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    })

    if (res.status === 429) return { results: [], rateLimited: true }
    if (!res.ok) return { results: [], rateLimited: false }

    const data = await res.json() as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return { results: [], rateLimited: false }

    const parsed = JSON.parse(text) as ArticleResult[]
    return { results: Array.isArray(parsed) ? parsed : [], rateLimited: false }
  } catch {
    return { results: [], rateLimited: false }
  }
}

class SentimentAnalyzer {
  private queue: QueueEntry[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private blockedUntil = 0

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

    // Respect 429 backoff
    if (Date.now() < this.blockedUntil) return

    // One Gemini call per flush — guaranteed ≤ 15 RPM
    const batch = this.queue.splice(0, BATCH_SIZE)
    const { results, rateLimited } = await callGemini(
      buildSentimentPrompt(batch),
      geminiApiKey,
    )

    if (rateLimited) {
      // Put articles back and wait 60 s before retrying
      this.queue.unshift(...batch)
      this.blockedUntil = Date.now() + 60_000
      return
    }

    const { updateArticleSentiment } = useFeedStore.getState()
    for (const r of results) {
      const entry = batch[r.index - 1]
      if (!entry) continue
      const sentiment =
        r.overallSentiment === 'bullish' ||
        r.overallSentiment === 'bearish' ||
        r.overallSentiment === 'neutral'
          ? r.overallSentiment
          : undefined
      updateArticleSentiment(entry.id, {
        sentiment,
        sentiment_score: r.sentimentScore,
        sentiment_summary: r.summary,
        sentiment_confidence: r.confidence,
        sentiment_key_factors: r.keyFactors,
      })
    }
  }
}

let _analyzer: SentimentAnalyzer | null = null

export function getSentimentAnalyzer(): SentimentAnalyzer {
  if (!_analyzer) _analyzer = new SentimentAnalyzer()
  return _analyzer
}
