// lib/gas-sheets.ts（Google Apps Script連携版）

// Google Apps Script WebアプリのURL（環境変数から取得）
const GAS_WEBAPP_URL = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL;

export interface PackingItem {
  rowIndex: number;
  timestamp: string;
  manufactureDate: string;
  seasoningType: string;
  fishType: string;
  origin: string;
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

// データ取得（完全無料）
export async function getPackingData(): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    if (!GAS_WEBAPP_URL) {
      throw new Error('GAS_WEBAPP_URL が設定されていません');
    }

    const response = await fetch(GAS_WEBAPP_URL, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'データ取得に失敗しました');
    }

    const items = result.data || [];

    // 統計情報を計算
    const today = new Date().toDateString();
    const stats: PackingStats = {
      total: items.length,
      pending: items.filter((item: PackingItem) => item.status === '未処理').length,
      completed: items.filter((item: PackingItem) => item.status === '完了').length,
      todayCompleted: items.filter((item: PackingItem) => {
        if (item.status !== '完了' || !item.packingInfo.date) return false;
        const itemDate = new Date(item.packingInfo.date).toDateString();
        return today === itemDate;
      }).length,
    };

    return {
      success: true,
      data: items,
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

// 梱包情報を更新（完全無料）
export async function updatePackingInfo(
  rowIndex: number,
  packingData: {
    location: string;
    quantity: string;
    user?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!GAS_WEBAPP_URL) {
      throw new Error('GAS_WEBAPP_URL が設定されていません');
    }

    const response = await fetch(GAS_WEBAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rowIndex,
        location: packingData.location,
        quantity: packingData.quantity,
        user: packingData.user || 'システム',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: '梱包情報を正常に更新しました',
      };
    } else {
      throw new Error(result.error || '更新に失敗しました');
    }
  } catch (error) {
    console.error('更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新に失敗しました',
    };
  }
}

// 検索機能（完全無料）
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
    // まず全データを取得
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
        item.seasoningType.includes(filters.product!)
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
