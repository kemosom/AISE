import {
  decryptInstructorContent,
  instructorAccessConfigured,
  validateInstructorCode,
} from '../server/instructor-access';

export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!instructorAccessConfigured()) {
    return res.status(503).json({
      error:
        'Instructor access is not configured for this deployment.',
    });
  }

  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body || {};

  if (!validateInstructorCode(body.code)) {
    return res.status(401).json({ error: 'Invalid instructor code.' });
  }

  try {
    return res.status(200).json({
      ok: true,
      data: decryptInstructorContent(),
    });
  } catch {
    return res.status(500).json({
      error:
        'Instructor material could not be decrypted. Check the deployment key.',
    });
  }
}
