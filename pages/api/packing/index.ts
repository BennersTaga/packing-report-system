import type { NextApiRequest, NextApiResponse } from 'next';
import { getPackingData } from '../../../lib/google-sheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await getPackingData();
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || 'データの取得に失敗しました' 
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
