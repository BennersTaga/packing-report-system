import { COLUMN_MAPPING } from './constants';

// スプレッドシート設定
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || '修正用シート';
const API_KEY = process.env.GOOGLE_API_KEY;

// 型定義
export interface PackingItem {
  rowIndex: number;
  timestamp: string;
  manufactureDate: string;
  seasoningType: string;
  fishType: string;
  origin: string;              // 産地（新規追加）
  quantity: number;
  manufactureProduct: string;
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

// データ取得（APIキーを使用）
export async function getPackingData(): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    // Google Sheets API v4のREST APIを直接呼び出す
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:CJ?key=${API_KEY}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'APIエラー');
    }

    const rows = result.values || [];
    
    if (rows.length <= 1) {
      return { success: true, data: [], stats: { total: 0, pending: 0, completed: 0, todayCompleted: 0 } };
    }

    // 🔥 フィルター基準日を設定
    const filterStartDate = new Date('2025-08-08');

    // ヘッダー行を除いてデータを処理
    const packingItems: PackingItem[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // タイムスタンプがない行はスキップ
      if (!row[0]) continue;

      // 🔥 製造日フィルタリング（2025年8月8日より前はスキップ）
      const manufactureDate = row[1];
      if (manufactureDate) {
        const itemDate = new Date(manufactureDate);
        if (itemDate < filterStartDate) continue;
      }

      // 梱包ステータスを確認
      const statusColIndex = columnLetterToIndex(COLUMN_MAPPING.PACKING_STATUS) - 1;
      const isCompleted = row[statusColIndex] === '完了';

      const item: PackingItem = {
        rowIndex: i + 1,
        timestamp: row[0] ? formatDate(row[0]) : '',
        manufactureDate: row[1] ? formatDate(row[1]) : '',
        seasoningType: row[6] || '',
        fishType: row[9] || '',
        origin: row[7] || '',          // H列: 産地（新規追加）
        quantity: parseInt(row[8]) || 0,
        manufactureProduct: row[48] || '',
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

// 梱包情報を更新（読み取り専用のため、この関数は動作しません）
export async function updatePackingInfo(
  rowIndex: number,
  packingData: {
    location: string;
    quantity: string;
    user?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  // APIキーでは書き込みができないため、エラーを返す
  return {
    success: false,
    error: 'APIキーでは書き込み操作はできません。Service Accountが必要です。',
  };
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
        item.seasoningType.includes(filters.product!)  // productNameからseasoningTypeに変更
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
