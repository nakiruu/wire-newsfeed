FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# API keys are baked into the bundle at build time via Vite's import.meta.env
ARG VITE_CORS_PROXY_URL
ARG VITE_FINNHUB_API_KEY
ARG VITE_ALPACA_API_KEY
ARG VITE_GEMINI_API_KEY
ARG VITE_ARTICLE_EXTRACTOR_URL
ENV VITE_CORS_PROXY_URL=$VITE_CORS_PROXY_URL
ENV VITE_FINNHUB_API_KEY=$VITE_FINNHUB_API_KEY
ENV VITE_ALPACA_API_KEY=$VITE_ALPACA_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_ARTICLE_EXTRACTOR_URL=$VITE_ARTICLE_EXTRACTOR_URL

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
