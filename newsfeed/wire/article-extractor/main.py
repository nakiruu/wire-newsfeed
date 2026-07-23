import os
import httpx
import trafilatura
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Wire Article Extractor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

BROWSERLESS_URL = os.getenv("BROWSERLESS_URL", "").rstrip("/")
MIN_TEXT_LEN = 200


class ExtractRequest(BaseModel):
    url: str


class ExtractResponse(BaseModel):
    title: str | None = None
    text: str | None = None
    via_browser: bool = False


def _parse(raw: bytes | str | None) -> tuple[str | None, str | None]:
    if not raw:
        return None, None
    text = trafilatura.extract(raw, include_comments=False, include_tables=True)
    meta = trafilatura.extract_metadata(raw)
    return (meta.title if meta else None), text


@app.post("/extract", response_model=ExtractResponse)
async def extract(req: ExtractRequest):
    downloaded = trafilatura.fetch_url(req.url)
    title, text = _parse(downloaded)

    via_browser = False
    if BROWSERLESS_URL and (not text or len(text) < MIN_TEXT_LEN):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{BROWSERLESS_URL}/content",
                    json={"url": req.url},
                )
            if resp.status_code == 200:
                b_title, b_text = _parse(resp.text)
                if b_text and len(b_text) > len(text or ""):
                    title = b_title or title
                    text = b_text
                    via_browser = True
        except Exception:
            pass

    return ExtractResponse(title=title, text=text, via_browser=via_browser)


@app.get("/health")
async def health():
    return {"ok": True}
