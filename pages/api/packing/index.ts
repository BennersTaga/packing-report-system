import type { NextApiRequest, NextApiResponse } from 'next';
import { getPackingData } from '../../../lib/gas-sheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GAS_ENDPOINT = process.env.GAS_ENDPOINT;
  if (!GAS_ENDPOINT) {
    return res.status(500).json({
      success: false,
      error: 'GAS endpoint is not configured'
    });
  }

  try {
    const result = await getPackingData();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'データ取得に失敗しました'
      });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました'
    });
  }
}
