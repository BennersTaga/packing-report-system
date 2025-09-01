import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    GAS_ENDPOINT: process.env.GAS_ENDPOINT ? '設定済み' : '未設定',
  });
}
