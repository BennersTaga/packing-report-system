import { google } from 'googleapis';
import { COLUMN_MAPPING } from './constants';

// Google Sheets認証設定（APIキー使用）
const sheets = google.sheets({ 
  version: 'v4',
  auth: process.env.GOOGLE_API_KEY
});

// スプレッドシート設定
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || '修正用シート';

// 型定義
export interface PackingItem {
  rowIndex: number;
  timestamp: string;
  manufactureDate: string;
  productName: string;
  quantity: number;
  location: string;
  column52: string;
  status: '未処理' | '完了';
  packingInfo: {
    location: string;
    quantity: string;
    date: string;
    user: string;
  };
}

export interface PackingStats {
  total: number;
  pending: number;
  completed: number;
  todayCompleted: number;
}

// ヘルパー関数：列文字を列番号に変換
function columnLetterToIndex(letter: string): number {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column = column * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return column;
}

// ヘルパー関数：日付フォーマット
function formatDate(date: any): string {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
}

// データ取得
export async function getPackingData(): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    // スプレッドシートのデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:CJ`, // A列からCJ列まで取得
    });

    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return { success: true, data: [], stats: { total: 0, pending: 0, completed: 0, todayCompleted: 0 } };
    }

    // ヘッダー行を除いてデータを処理
    const packingItems: PackingItem[] = [];
    const headers = rows[0];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // タイムスタンプがない行はスキップ
      if (!row[0]) continue;

      // 梱包ステータスを確認
      const statusColIndex = columnLetterToIndex(COLUMN_MAPPING.PACKING_STATUS) - 1;
      const isCompleted = row[statusColIndex] === '完了';

      const item: PackingItem = {
        rowIndex: i + 1, // スプレッドシートの行番号（1始まり）
        timestamp: row[0] ? formatDate(row[0]) : '',
        manufactureDate: row[1] ? formatDate(row[1]) : '',
        productName: row[4] || '', // E列
        quantity: parseInt(row[7]) || 0, // H列
        location: row[9] || '', // J列
        column52: row[51] || '', // AZ列
        status: isCompleted ? '完了' : '未処理',
        packingInfo: {
          location: row[columnLetterToIndex(COLUMN_MAPPING.PACKING_LOCATION) - 1] || '',
          quantity: row[columnLetterToIndex(COLUMN_MAPPING.PACKING_QUANTITY) - 1] || '',
          date: row[columnLetterToIndex(COLUMN_MAPPING.PACKING_DATE) - 1] || '',
          user: row[columnLetterToIndex(COLUMN_MAPPING.PACKING_USER) - 1] || '',
        },
      };

      packingItems.push(item);
    }

    // 統計情報を計算
    const today = new Date().toDateString();
    const stats: PackingStats = {
      total: packingItems.length,
      pending: packingItems.filter(item => item.status === '未処理').length,
      completed: packingItems.filter(item => item.status === '完了').length,
      todayCompleted: packingItems.filter(item => {
        if (item.status !== '完了' || !item.packingInfo.date) return false;
        const itemDate = new Date(item.packingInfo.date).toDateString();
        return today === itemDate;
      }).length,
    };

    return {
      success: true,
      data: packingItems,
      stats,
    };
  } catch (error) {
    console.error('データ取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'データの取得に失敗しました',
    };
  }
}

// 梱包情報を更新
export async function updatePackingInfo(
  rowIndex: number,
  packingData: {
    location: string;
    quantity: string;
    user?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const now = new Date();
    const updates = [
      {
        range: `${SHEET_NAME}!${COLUMN_MAPPING.PACKING_STATUS}${rowIndex}`,
        values: [['完了']],
      },
      {
        range: `${SHEET_NAME}!${COLUMN_MAPPING.PACKING_LOCATION}${rowIndex}`,
        values: [[packingData.location]],
      },
      {
        range: `${SHEET_NAME}!${COLUMN_MAPPING.PACKING_QUANTITY}${rowIndex}`,
        values: [[packingData.quantity]],
      },
      {
        range: `${SHEET_NAME}!${COLUMN_MAPPING.PACKING_DATE}${rowIndex}`,
        values: [[now.toISOString()]],
      },
      {
        range: `${SHEET_NAME}!${COLUMN_MAPPING.PACKING_USER}${rowIndex}`,
        values: [[packingData.user || 'システム']],
      },
    ];

    // バッチ更新
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        data: updates,
        valueInputOption: 'USER_ENTERED',
      },
    });

    return {
      success: true,
      message: '梱包情報を更新しました',
    };
  } catch (error) {
    console.error('更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新に失敗しました',
    };
  }
}

// 検索機能
export async function searchPackingData(filters: {
  date?: string;
  product?: string;
  status?: string;
  quantityMin?: number;
  quantityMax?: number;
}): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    const result = await getPackingData();
    
    if (!result.success || !result.data) {
      return result;
    }

    let filteredData = result.data;

    // フィルター適用
    if (filters.date) {
      const filterDate = new Date(filters.date).toDateString();
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.manufactureDate).toDateString();
        return itemDate === filterDate;
      });
    }

    if (filters.product) {
      filteredData = filteredData.filter(item =>
        item.productName.includes(filters.product!)
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(item => 
        item.status === filters.status
      );
    }

    if (filters.quantityMin !== undefined || filters.quantityMax !== undefined) {
      filteredData = filteredData.filter(item => {
        const quantity = item.quantity;
        const min = filters.quantityMin || 0;
        const max = filters.quantityMax || Infinity;
        return quantity >= min && quantity <= max;
      });
    }

    // フィルター後の統計を再計算
    const today = new Date().toDateString();
    const stats: PackingStats = {
      total: filteredData.length,
      pending: filteredData.filter(item => item.status === '未処理').length,
      completed: filteredData.filter(item => item.status === '完了').length,
      todayCompleted: filteredData.filter(item => {
        if (item.status !== '完了' || !item.packingInfo.date) return false;
        const itemDate = new Date(item.packingInfo.date).toDateString();
        return today === itemDate;
      }).length,
    };

    return {
      success: true,
      data: filteredData,
      stats,
    };
  } catch (error) {
    console.error('検索エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '検索に失敗しました',
    };
  }
}
