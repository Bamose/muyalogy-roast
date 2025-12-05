# RoastBot (Telegram)

Playful workplace roast bot built with **Next.js 14 (App Router)**, **TypeScript**, and **Vercel AI SDK**. It roasts teammates when they're inactive, on command, and ships with a coffee-themed morning greeting.

## Features
- Telegram webhook endpoint at `/api/telegram`.
- Activity tracking per chat (Redis via Upstash or in-memory fallback).
- Inactivity roasts (default: 30 minutes), `/roastme`, and `/roast @username` commands.
- Group profile-aware humor (course director, editors, designer, intern) with safety rules.
- Optional scheduled morning greeting endpoint at `/api/telegram/morning`.
- Deploy-ready on Vercel.

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill values:
   ```bash
   cp .env.local.example .env.local
   ```
   Required:
   - `TELEGRAM_BOT_TOKEN`
   - `OPENAI_API_KEY` (falls back to canned roasts if missing)
   - `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for persistence (otherwise in-memory)
   - `DEFAULT_TELEGRAM_CHAT_ID` for the morning greeting endpoint
3. Run locally:
   ```bash
   npm run dev
   ```
4. Set the Telegram webhook (after deploy):
   ```bash
   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-domain.vercel.app/api/telegram
   ```

## Commands & Behavior
- `/roastme` — roast the sender.
- `/roast @username` — roast the mentioned teammate (must have spoken at least once to be tracked; otherwise uses the handle you provide).
- Regular messages trigger an inactivity check; if someone else has been idle for 30+ minutes, they get roasted.
- Morning greeting: call `GET /api/telegram/morning` via Vercel Cron (e.g., `0 9 * * *`) to send the coffee status message to `DEFAULT_TELEGRAM_CHAT_ID`.

## Tech Notes
- AI generation: Vercel AI SDK (`ai`) with OpenAI model (`OPENAI_MODEL` defaults to `gpt-4o-mini`).
- Storage: Upstash Redis REST (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) with in-memory fallback for local dev.
- Runtime: Edge for API routes.

## File Map
- `app/api/telegram/route.ts` — Telegram webhook handler.
- `app/api/telegram/morning/route.ts` — scheduled coffee greeting.
- `lib/storage.ts` — activity persistence.
- `lib/roasts.ts` — roast generation and safety prompt.
- `lib/telegram.ts` — Telegram send helper.

## Deployment
Deploy to Vercel, add the environment variables, and point your bot webhook to `/api/telegram`. That's it.
