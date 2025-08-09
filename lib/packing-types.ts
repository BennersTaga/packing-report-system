export interface PackingItem {
  rowIndex: number;
  timestamp: string;
  manufactureDate: string;
  seasoningType: string;
  fishType: string;
  origin: string;
  quantity: number;
  originalQuantity?: number;
  totalPackedQuantity?: number;
  packingCount?: number;
  manufactureProduct: string;
  status: '未処理' | '完了';
  packingInfo: {
    location: string;
    quantity: string;
    date: string;
    user: string;
  };
  allPackingDetails?: any[];
}

export interface PackingStats {
  total: number;
  pending: number;
  completed: number;
  todayCompleted: number;
}
