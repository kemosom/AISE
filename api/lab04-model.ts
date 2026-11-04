// Same-origin Gemini gateway. Student-supplied credentials are used only for
// this request. They are never written to Git, local storage, logs or a database.
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const body = typeof req.body === 'string'
    ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
    : req.body || {};
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!key || key.length > 256 || !prompt || prompt.length > 16000) {
    return res.status(400).json({ error: 'Enter a valid Gemini API key and a prompt below 16,000 characters.' });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 26000);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          // Limit invisible reasoning so the model has room to return source code.
          thinkingConfig: { thinkingLevel: 'LOW' },
        },
      }),
      signal: controller.signal,
    });
    const data: any = await response.json();
    if (!response.ok) {
      const retryable = [500, 502, 503, 504].includes(response.status);
      const reason = response.status === 429
        ? 'Gemini request quota reached. Check your classroom API quota.'
        : response.status === 401 || response.status === 403
          ? 'Gemini rejected this API key or project permissions.'
          : response.status === 503
            ? 'Gemini is temporarily unavailable (503).'
            : 'Gemini returned HTTP ' + response.status + '.';
      return res.status(retryable ? 502 : response.status).json({
        error: reason, retryable,
        code: response.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM_' + response.status,
      });
    }
    const candidate = data.candidates?.[0];
    const finishReason: string = candidate?.finishReason || 'UNKNOWN';
    const answer: string = (candidate?.content?.parts || [])
      .filter((part: any) => !part.thought && typeof part.text === 'string')
      .map((part: any) => part.text).join('\n').trim();
    const usage = data.usageMetadata || {};
    const inputTokens = Number(usage.promptTokenCount || 0);
    const outputTokens = Number(usage.candidatesTokenCount || 0);
    const thoughtTokens = Number(usage.thoughtsTokenCount || 0);
    if (!answer) {
      const reason = finishReason === 'MAX_TOKENS'
        ? 'Gemini used its output token budget without returning source code.'
        : 'Gemini returned an empty response (finish reason: ' + finishReason + ').';
      return res.status(502).json({
        error: reason, retryable: finishReason === 'MAX_TOKENS' || finishReason === 'STOP',
        code: 'EMPTY_OUTPUT',
      });
    }
    // Return the candidate finish reason for diagnosis, without exposing any key.
    return res.status(200).json({
      text: answer, model: 'gemini-3.6-flash', finishReason,
      inputTokens, outputTokens, thoughtTokens,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return res.status(502).json({
      error: isTimeout ? 'Gemini did not respond before the request timeout.' :
        'Cannot reach Gemini. Check the network or try again.',
      code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK',
      retryable: true,
    });
  } finally {
    clearTimeout(timeout);
  }
}
