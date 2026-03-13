export default async function handler(_req: any, res: any) {
  return res.status(200).json({ ok: true, message: 'sync disabled in serverless mode', updatedAt: new Date().toISOString() });
}
