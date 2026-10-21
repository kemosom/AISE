import { createHmac, timingSafeEqual } from 'node:crypto';

// Vercel server-side only. Never use VITE_ for HF_TOKEN or encryption keys.
// To allow public student requests in a future released lab, an instructor
// must explicitly set LAB02_AI_PUBLIC_ENABLED=true in Vercel.
const LAB_ID = 'lab02-requirement-prioritization';
const HF_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_MODEL = 'Qwen/Qwen3-14B:cheapest';

// These per-instance limits reduce accidental overload, but are NOT globally
// enforced across Vercel serverless instances. Set a provider-side spend cap
// or implement durable distributed limits before enabling public access.
const usage = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const PER_INSTANCE_LIMIT = 12;

function signedInstructorAccess(token: unknown): boolean {
  if (typeof token !== 'string' || token.length > 1000) return false;
  const secret = process.env.INSTRUCTOR_CONTENT_KEY;
  if (!secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, providedSignature] = parts;
  try {
    const record = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (record.lab !== LAB_ID || !Number.isFinite(record.exp) ||
        record.exp < Date.now() || record.exp > Date.now() + 2 * WINDOW_MS) {
      return false;
    }
    const expected = createHmac('sha256', Buffer.from(secret, 'base64url'))
      .update('aise-lab02-chat-v1:' + payload)
      .digest('base64url');
    const gotBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expected);
    return gotBuffer.length === expectedBuffer.length &&
      timingSafeEqual(gotBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

const GROUNDED_CASE = `You are an AI assistant for MAI5124, a master's software engineering
laboratory on requirements prioritization. You support analysis, not final
software release decisions. Never pretend that the supplied scenario metrics
are genuine Spotify operational data, or that you fetched a URL yourself.

AUTHORITATIVE SOURCE EXCERPTS (provided by the course, not retrieved live):
D1 https://developer.spotify.com/documentation/web-api/concepts/playlists
- Setting playlist "public" to true publishes it on the owner's profile and
  makes it visible in search. This is NOT an access-control mechanism.
- The public and collaborative attributes cannot BOTH be true on a playlist.
- A collaborative playlist allows users with the link to add/remove tracks;
  individual collaborator administration is not offered by the Web API.
- Playlist changes create snapshot versions which can help with concurrency.
D2 https://developer.spotify.com/documentation/web-api/reference/change-playlist-details
- Updating a playlist's details requires its owner and the proper OAuth scopes.
- "collaborative" may be true only on a non-public playlist.
D3 https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
D4 https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist
D3/D4 describe API actions for adding/removing playlist items. Do not invent
additional constraints not present in these supplied excerpts.

HYPOTHETICAL CLASSROOM FEATURE BACKLOG (not an internal Spotify SRS):
FR-01 edit playlist title/description, 2 days; listener=3 product=4 engineering=5.
FR-02 publish playlist on owner's profile, 2 days; listener=4 product=5 engineering=4.
FR-03 private collaborative playlist, 4 days; listener=5 product=4 engineering=3.
FR-04 add playlist item, 2 days; listener=5 product=4 engineering=5.
FR-05 remove playlist item with snapshot awareness, 4 days; listener=3
product=3 engineering=4. Course scenario requires FR-04 with/before FR-05.
FR-06 allow BOTH public and collaborative status for ONE playlist, 2 days;
listener=5 product=5 engineering=5. This conflicts with source D1.

ENGINEERING ASSUMPTIONS:
Budget: 8 engineer-days. Stakeholder weights listener 0.50,
product 0.30, engineering 0.20. Requirement utility is weighted sum.
Release selection maximizes total utility subject to effort, dependencies
and documented technical feasibility. Rating and effort are fictional.
Supporting both a public playlist feature and collaborative playlist feature
is permitted in the same app; ONLY the same playlist having both true is invalid.

TEACHING BEHAVIOR:
- Explain reasoning concisely, state source IDs for documented facts and
  call out fabricated or unsupported claims.
- If asked for prioritized IDs, give ranked_ids, infeasible_ids, release_ids,
  total_engineer_days, evidence and uncertainties. Prefer JSON when requested.
- Do not claim you executed code, contacted Spotify's API or independently
  browsed its website. Invite human review of uncertain claims.
- Help students critically test AI results; do not fabricate stakeholder data.
- Do not ask students for any personal data, accounts, passwords or tokens.`;

function withinLimit(key: string): boolean {
  const now = Date.now();
  if (usage.size > 2000) {
    for (const [k, v] of usage) if (v.resetAt < now) usage.delete(k);
  }
  const item = usage.get(key);
  if (!item || now >= item.resetAt) {
    usage.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (item.count >= PER_INSTANCE_LIMIT) return false;
  item.count += 1;
  return true;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const token = process.env.HF_TOKEN?.trim();
  const model = process.env.HF_MODEL?.trim() || DEFAULT_MODEL;
  const studentEnabled = process.env.LAB02_AI_PUBLIC_ENABLED === 'true';

  if (req.method === 'GET') {
    return res.status(200).json({
      configured: Boolean(token),
      studentEnabled,
      model: token ? model : null,
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  // Keep provider access gated while Lab 02 is unreleased.
  const isInstructor = signedInstructorAccess(req.headers['x-aise-instructor-chat']);
  if (!studentEnabled && !isInstructor) {
    return res.status(403).json({
      error: 'The AI assistant is instructor-only while Lab 02 is locked.',
    });
  }
  if (!token) {
    return res.status(503).json({
      error: 'The AI assistant needs an HF_TOKEN in Vercel before it can run.',
    });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  if (!withinLimit((isInstructor ? 'instructor:' : 'student:') + ip)) {
    return res.status(429).json({ error: 'Usage limit reached. Try later.' });
  }

  const body = typeof req.body === 'string'
    ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
    : (req.body || {});
  if (!Array.isArray(body.messages) || body.messages.length < 1 ||
      body.messages.length > 10 || body.messages.some((m: any) =>
        !m || !['user', 'assistant'].includes(m.role) ||
        typeof m.content !== 'string' || !m.content.trim() ||
        m.content.length > 1600
      ) ||
      body.messages.reduce((sum: number, m: any) => sum + m.content.length, 0) > 6500 ||
      body.messages[body.messages.length - 1].role !== 'user') {
    return res.status(400).json({
      error: 'Send up to 10 short conversation messages, ending in a question.',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 24000);
    let response: Response;
    try {
      response = await fetch(HF_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0.25,
          max_tokens: 650,
          messages: [
            { role: 'system', content: GROUNDED_CASE },
            ...body.messages.map((m: any) => ({
              role: m.role, content: m.content.trim(),
            })),
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // Preserve provider error categories instead of collapsing everything into
      // a generic 502 that misleadingly suggests an invalid token or model.
      // Do not expose the provider's raw response: it may contain sensitive data.
      if (response.status === 402) {
        return res.status(402).json({
          code: 'HF_BILLING_REQUIRED',
          error: 'Hugging Face returned HTTP 402 (Payment Required). Check the inference credits and billing settings of the account that created HF_TOKEN. No model response was generated.',
          helpUrl: 'https://huggingface.co/settings/billing',
        });
      }
      if (response.status === 401 || response.status === 403) {
        return res.status(response.status).json({
          code: 'HF_AUTHORIZATION_FAILED',
          error: 'Hugging Face rejected the API credentials or permission. Check the HF_TOKEN secret and Inference Providers permission in Vercel.',
        });
      }
      if (response.status === 429) {
        return res.status(429).json({
          code: 'HF_RATE_LIMIT',
          error: 'The Hugging Face inference provider is rate-limiting requests. Wait and retry, or check account quota.',
        });
      }
      if (response.status === 400 || response.status === 404 || response.status === 422) {
        return res.status(502).json({
          code: 'HF_MODEL_REQUEST_ERROR',
          error: 'Hugging Face rejected the model request (HTTP ' + response.status +
            '). Check that HF_MODEL is available for chat-completions on Inference Providers.',
        });
      }
      return res.status(502).json({
        code: 'HF_UPSTREAM_ERROR',
        error: 'The Hugging Face inference provider returned HTTP ' + response.status +
          '. This is an upstream service error, not a successful AI response.',
      });
    }

    const result: any = await response.json();
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(502).json({ error: 'The model returned an empty response.' });
    }
    return res.status(200).json({
      answer: answer.slice(0, 6500),
      model: result.model || model,
      sourceStatus: 'Provided case excerpts only; no live Spotify browsing.',
    });
  } catch (err: any) {
    return res.status(504).json({
      error: err?.name === 'AbortError'
        ? 'The model request timed out. Try again.'
        : 'Unable to reach the Hugging Face model. Try again later.',
    });
  }
}
