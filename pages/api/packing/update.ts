import type { NextApiRequest, NextApiResponse } from 'next';

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

    // Google Apps Script WebApp URLを取得
    const GAS_ENDPOINT = process.env.NEXT_PUBLIC_GAS_ENDPOINT;

    console.log('GAS_ENDPOINT:', GAS_ENDPOINT); // デバッグ用

    if (!GAS_ENDPOINT) {
      return res.status(500).json({
        success: false,
        error: 'GAS WebApp URLが設定されていません'
      });
    }

    // GASに送信するデータを準備
    const gasPayload = {
      action: 'updatePacking',
      rowIndex: rowIndex,
      packingData: {
        location: packingData.location,
        quantity: packingData.quantity,
        user: packingData.user || 'システム',
        date: new Date().toISOString()
      }
    };

    console.log('GASに送信するデータ:', gasPayload); // デバッグ用

    // GASに更新リクエストを送信
    const gasResponse = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gasPayload)
    });

    console.log('GAS レスポンス ステータス:', gasResponse.status); // デバッグ用

    const gasResult = await gasResponse.json();
    console.log('GAS レスポンス データ:', gasResult); // デバッグ用

    if (gasResult.success) {
      res.status(200).json({
        success: true,
        message: '梱包情報を更新しました',
        data: gasResult
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: gasResult.error || '更新に失敗しました',
        details: gasResult
      });
    }
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
