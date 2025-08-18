// pages/api/packing/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST のみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { rowIndex, packingData } = req.body as {
      rowIndex?: number;
      packingData?: { location?: string; quantity?: string; user?: string };
    };

    // バリデーション
    if (!rowIndex || !packingData) {
      return res.status(400).json({
        success: false,
        error: '必須パラメータが不足しています',
      });
    }
    if (!packingData.location || !packingData.quantity) {
      return res.status(400).json({
        success: false,
        error: '保管場所と数量は必須です',
      });
    }

    // GAS Web App のエンドポイント
    const GAS_ENDPOINT = process.env.GAS_ENDPOINT;
    if (!GAS_ENDPOINT) {
      return res.status(500).json({
        success: false,
        error: 'GAS endpoint is not configured',
      });
    }

    // GAS に更新リクエストを転送
    const gasRes = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updatePacking',
        rowIndex,
        packingData,
      }),
    });

    if (!gasRes.ok) {
      return res.status(gasRes.status).json({
        success: false,
        error: `HTTP Error: ${gasRes.status}`,
      });
    }

    const data = await gasRes.json();
    if (!data?.success) {
      return res.status(500).json({
        success: false,
        error: data?.error || 'GASからのエラー',
      });
    }

    return res.status(200).json({
      success: true,
      message: data.message ?? '更新しました',
    });
  } catch (err) {
    console.error('update API error:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : '更新に失敗しました',
    });
  }
}
