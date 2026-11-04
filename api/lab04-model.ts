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
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
      signal: controller.signal,
    });
    const data: any = await response.json();
    if (!response.ok) {
      const reason = response.status === 429
        ? 'Gemini API quota reached. Check the rate limit shown in Google AI Studio.'
        : response.status === 401 || response.status === 403
          ? 'Gemini rejected this API key or project permissions.'
          : 'Gemini request failed with status ' + response.status + '.';
      return res.status(response.status >= 500 ? 502 : response.status).json({ error: reason });
    }
    const answer = (data.candidates || [])
      .flatMap((candidate: any) => candidate.content?.parts || [])
      .map((part: any) => part.text || '')
      .join('\n').trim();
    if (!answer) return res.status(502).json({ error: 'Gemini returned no source code. Retry once or select another issue.' });
    return res.status(200).json({
      text: answer,
      model: 'gemini-3.6-flash',
      inputTokens: data.usageMetadata?.promptTokenCount || 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
    });
  } catch (error) {
    return res.status(502).json({ error: 'Model request failed or timed out. Check network connectivity and retry.' });
  } finally {
    clearTimeout(timeout);
  }
}
