import { S3Client, PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3.908.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.908.0';
import { check, HttpError } from './devices.ts';

function storage() {
  const account=Deno.env.get('R2_ACCOUNT_ID'),bucket=Deno.env.get('R2_BUCKET_NAME');
  const accessKeyId=Deno.env.get('R2_ACCESS_KEY_ID'),secretAccessKey=Deno.env.get('R2_SECRET_ACCESS_KEY');
  if(!account||!bucket||!accessKeyId||!secretAccessKey)throw new HttpError(503,'Configure os segredos R2 no Supabase para habilitar as mídias.');
  const endpoint=`https://${account}.r2.cloudflarestorage.com`;
  return {bucket,endpoint,client:new S3Client({region:'auto',endpoint,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',credentials:{accessKeyId,secretAccessKey}})};
}

// Aceita somente os hosts do bucket configurado. URLs externas continuam externas.
export function objectKey(value:string,owner:string):string|null {
  const account=Deno.env.get('R2_ACCOUNT_ID'),bucket=Deno.env.get('R2_BUCKET_NAME');
  if(!account||!bucket)return null;
  let url:URL;try{url=new URL(value);}catch{return null;}
  const endpoint=`https://${account}.r2.cloudflarestorage.com`;
  const alias=Deno.env.get('R2_PUBLIC_URL');
  let key:string;
  if(url.origin===endpoint){
    check(url.pathname.startsWith(`/${bucket}/`),'Bucket não autorizado',403);
    key=decodeURIComponent(url.pathname.slice(bucket.length+2));
  }else if(alias&&url.origin===new URL(alias).origin){
    const prefix=new URL(alias).pathname.replace(/\/$/,'')+'/';
    check(url.pathname.startsWith(prefix),'Caminho inválido',403);
    key=decodeURIComponent(url.pathname.slice(prefix.length));
  }else return null;
  check(url.protocol==='https:'&&!url.username&&!url.password&&!key.split('/').some(part=>part==='..'||part==='.')&&!key.includes('\\')&&!key.includes('\0')&&key.startsWith(`users/${owner}/`),'Arquivo não pertence à conta',403);
  return key;
}

export async function downloadUrl(value:string,owner:string) {
  const key=objectKey(value,owner);if(key===null)return value;
  const {client,bucket}=storage();
  return getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:3600});
}

export async function uploadUrl(userId: string, input: any) {
  const accountId=Deno.env.get('R2_ACCOUNT_ID'), accessKeyId=Deno.env.get('R2_ACCESS_KEY_ID'), secretAccessKey=Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucket=Deno.env.get('R2_BUCKET_NAME');
  if(!accountId||!accessKeyId||!secretAccessKey||!bucket)throw new HttpError(503,'Configure os segredos R2 no Supabase para habilitar uploads.');
  check(typeof input.name==='string'&&input.name.length<=255,'Nome de arquivo inválido');
  check(Number.isSafeInteger(input.size)&&input.size>0&&input.size<=100*1024*1024,'Arquivo deve ter até 100 MB');
  check(typeof input.type==='string'&&/^(video\/[a-z0-9.+-]+|image\/(jpeg|png|gif|webp))$/i.test(input.type),'Tipo de arquivo não permitido');
  const file=input.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const key=`users/${userId}/media/${crypto.randomUUID()}_${file}`;
  const client=new S3Client({region:'auto',endpoint:`https://${accountId}.r2.cloudflarestorage.com`,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',credentials:{accessKeyId,secretAccessKey}});
  const signedUrl=await getSignedUrl(client,new PutObjectCommand({Bucket:bucket,Key:key,ContentType:input.type,ContentLength:input.size}),{expiresIn:600});
  // Persiste referência estável HTTPS privada; a autorização de leitura é separada.
  return {signed_url:signedUrl,public_url:`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`};
}
