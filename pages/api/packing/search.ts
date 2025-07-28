import type { NextApiRequest, NextApiResponse } from 'next';
import { searchPackingData } from '../../../lib/google-sheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, product, status, quantityMin, quantityMax } = req.query;

    const filters = {
      date: date as string,
      product: product as string,
      status: status as string,
      quantityMin: quantityMin ? parseInt(quantityMin as string) : undefined,
      quantityMax: quantityMax ? parseInt(quantityMax as string) : undefined,
    };

    const result = await searchPackingData(filters);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error || '検索に失敗しました' 
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
