import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
    const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || '修正用シート';
    const API_KEY = process.env.GOOGLE_API_KEY;

    // Google Sheets APIを直接呼び出す
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:CJ?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google Sheets API Error:', data);
      return res.status(400).json({ 
        success: false, 
        error: data.error?.message || 'スプレッドシートの読み取りに失敗しました' 
      });
    }

    // データ処理（簡略版）
    const rows = data.values || [];
    
    if (rows.length <= 1) {
      return res.status(200).json({
        success: true,
        data: [],
        stats: { total: 0, pending: 0, completed: 0, todayCompleted: 0 }
      });
    }

    // 2025年8月8日のフィルター基準日を設定
    const filterStartDate = new Date('2025-08-08');

    // 簡易的なデータ変換
    const items = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      // 🔥 新規追加: 製造日フィルタリング
      const manufactureDate = row[1];
      if (manufactureDate) {
        const itemDate = new Date(manufactureDate);
        // 2025年8月8日より前のデータはスキップ
        if (itemDate < filterStartDate) continue;
      }

items.push({
  rowIndex: i + 1,
  timestamp: row[0] || '',
  manufactureDate: row[1] || '',
  seasoningType: row[6] || '',
  fishType: row[9] || '',
  origin: row[7] || '',           // H列: 産地（追加）
  quantity: parseInt(row[8]) || 0,
  manufactureProduct: row[48] || '',
  status: row[83] === '完了' ? '完了' : '未処理',
  packingInfo: {
    location: row[84] || '',
    quantity: row[85] || '',
    date: row[86] || '',
    user: row[87] || ''
  }
});
    }

    const stats = {
      total: items.length,
      pending: items.filter(item => item.status === '未処理').length,
      completed: items.filter(item => item.status === '完了').length,
      todayCompleted: 0
    };

    res.status(200).json({
      success: true,
      data: items,
      stats
    });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'サーバーエラーが発生しました' 
    });
  }
}
