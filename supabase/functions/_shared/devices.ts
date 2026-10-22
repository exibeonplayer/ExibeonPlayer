import { createClient } from 'npm:@supabase/supabase-js@2.75.0';

export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
export function reply(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export function check(condition: unknown, message: string, status = 400): asserts condition { if (!condition) throw new HttpError(status, message); }
export async function body(req: Request) {
  check(req.method === 'POST', 'Método não permitido', 405);
  const text = await req.text(); check(new TextEncoder().encode(text).length < 512000, 'Mensagem muito grande', 413);
  try { const value = JSON.parse(text); check(value && typeof value === 'object' && !Array.isArray(value), 'JSON inválido'); return value; } catch { throw new HttpError(400, 'JSON inválido'); }
}
export const sha = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
export const secret = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2,'0')).join('');
// PostgreSQL também aceita IDs legados que não codificam versão/variante RFC.
// A autorização continua sendo feita pela conta proprietária no banco.
export const uuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export function unwrap<T>(r: { data: T; error: { message: string } | null }): T { if (r.error) throw new HttpError(400,r.error.message); return r.data; }
export function licenseAllowed(identity: any) {
  const l=identity.license, p=identity.player, now=Date.now();
  return !!l && l.status==='active' && !p.revoked_at && (!l.start_date || Date.parse(l.start_date)<=now) && (!l.end_date || Date.parse(l.end_date)>now);
}

const encode = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const decode = (s: string) => Uint8Array.from(atob(s),c=>c.charCodeAt(0));
let signing: Promise<{ key: CryptoKey; publicKey: string }> | undefined;
async function keyPair(db: ReturnType<typeof admin>) {
  // O segredo fica em schema não exposto pela API; somente service_role pode acessá-lo.
  const keys = await crypto.subtle.generateKey({ name:'Ed25519' },true,['sign','verify']) as CryptoKeyPair;
  const privateKey = encode(await crypto.subtle.exportKey('pkcs8',keys.privateKey));
  const publicKey = encode(await crypto.subtle.exportKey('spki',keys.publicKey));
  const stored = unwrap<any>(await db.rpc('exb_signing_key',{p_private:privateKey,p_public:publicKey}));
  return { key: await crypto.subtle.importKey('pkcs8',decode(stored.private_key),{name:'Ed25519'},false,['sign']), publicKey:stored.public_key };
}
export async function lease(db: ReturnType<typeof admin>, identity: any) {
  const keys=await (signing ??= keyPair(db).catch(e=>{ signing=undefined; throw e; }));
  const allowed=licenseAllowed(identity);
  const data={ version:1, player_id:identity.player.id, device_id:identity.player.device_id,
    user_id:identity.player.user_id, issued_at:new Date().toISOString(),
    expires_at:identity.license?.end_date ?? null, allowed,
    reason:allowed ? null : 'Licença expirada, suspensa ou player revogado' };
  const payload=encode(new TextEncoder().encode(JSON.stringify(data)).buffer as ArrayBuffer);
  const signature=encode(await crypto.subtle.sign('Ed25519',keys.key,new TextEncoder().encode(payload)));
  return {payload,signature,public_key:keys.publicKey};
}
export async function identity(db: ReturnType<typeof admin>, token: string, refresh=false) {
  check(typeof token==='string' && /^exb_[a-f0-9]{64}$/.test(token),'Credencial inválida',401);
  const result=unwrap<any>(await db.rpc('exb_device_identity',{p_hash:await sha(token),p_refresh:refresh}));
  check(result,'Equipamento não autorizado',401); return result;
}
export async function audit(db: ReturnType<typeof admin>, playerId: string, message: string) {
  unwrap(await db.from('player_logs').insert({player_id:playerId,log_type:'SYSTEM',message,event_id:crypto.randomUUID()}));
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return reply({success:false,error:error.message},error.status);
  console.error('Falha na API de equipamentos');
  return reply({success:false,error:'Falha interna no servidor'},500);
}
