import { S3Client } from '@aws-sdk/client-s3';

// Configuração do cliente Cloudflare R2
// IMPORTANTE: Configure essas variáveis de ambiente no seu .env.local
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.warn('Configurações do R2 não encontradas. Configure as variáveis de ambiente.');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export const R2_CONFIG = {
  bucketName: R2_BUCKET_NAME || '',
  accountId: R2_ACCOUNT_ID || '',
  publicUrl: R2_PUBLIC_URL || '',
};

// Função para gerar chave única para o arquivo
export const generateFileKey = (userId: string, fileName: string): string => {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/media/${timestamp}_${sanitizedFileName}`;
};

// Função para obter URL pública do arquivo
export const getPublicUrl = (fileKey: string): string => {
  return `${R2_PUBLIC_URL}/${fileKey}`;
};
