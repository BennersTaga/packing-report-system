import type { NextApiRequest, NextApiResponse } from 'next';
import { updatePackingInfo } from '../../../lib/google-sheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rowIndex, packingData } = req.body;

    // バリデーション
    if (!rowIndex || !packingData) {
      return res.status(400).json({ 
        success: false, 
        error: '必須パラメータが不足しています' 
      });
    }

    if (!packingData.location || !packingData.quantity) {
      return res.status(400).json({ 
        success: false, 
        error: '保管場所と数量は必須です' 
      });
    }

    const result = await updatePackingInfo(rowIndex, packingData);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || '更新に失敗しました' 
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
