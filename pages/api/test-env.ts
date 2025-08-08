import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 環境変数の存在確認（値は隠す）
  const envCheck = {
    NEXT_PUBLIC_GAS_ENDPOINT: process.env.NEXT_PUBLIC_GAS_ENDPOINT ? '設定済み' : '未設定',
    NEXT_PUBLIC_SHEET_ID: process.env.NEXT_PUBLIC_SHEET_ID ? '設定済み' : '未設定',
    NEXT_PUBLIC_SHEET_NAME: process.env.NEXT_PUBLIC_SHEET_NAME || '未設定'
  };

  res.status(200).json(envCheck);
}
