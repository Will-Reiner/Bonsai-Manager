import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
  // Desativa checksum automático do SDK v3 — sem isso o R2 rejeita com 403
  // pois o header x-amz-checksum-crc32 fica na URL assinada mas não é enviado pelo cliente
  requestChecksumCalculation: 'when_required',
  responseChecksumValidation: 'when_required',
});

export const R2_BUCKET = process.env.R2_BUCKET ?? '';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';
