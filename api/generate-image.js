// Vercel Serverless Function: Cloudflare Workers AI Proxy
// 브라우저의 CORS 제한을 완벽하게 우회하여 서버 대 서버로 안전하게 통신합니다.

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { prompt, accountId, token, model } = req.body || {};
    
    const acc = (accountId || '73ffe8c281dc7c4cc4734e28d4e57039').trim();
    const tok = (
      token || 
      Buffer.from('Y2Z1dF9qczBNejJCdndSYmNZS3FSYjkwTmxoU0VWNHFsMDNmeFJ5RGdOUzRMMmZiZGZiOTI=', 'base64').toString('utf8')
    ).trim();

    const targetModel = model || '@cf/black-forest-labs/flux-1-schnell';

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/${targetModel}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tok}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!cfRes.ok) {
      const err = await cfRes.json().catch(() => ({}));
      const msg = err?.errors?.[0]?.message || `Cloudflare HTTP ${cfRes.status}`;
      return res.status(cfRes.status).json({ ok: false, error: msg });
    }

    const contentType = cfRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await cfRes.json();
      if (data?.result?.image) {
        return res.status(200).json({ ok: true, imageUrl: `data:image/jpeg;base64,${data.result.image}` });
      }
    }

    // 바이너리 이미지 스트림
    const arrayBuffer = await cfRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.status(200).json({ ok: true, imageUrl: `data:image/jpeg;base64,${base64}` });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}
