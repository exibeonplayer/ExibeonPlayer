import {check, HttpError, unwrap, uuid} from './devices.ts';

// Called only after getUser and a database lookup of platform_roles.
export async function createAccount(db: any, actor: string, role: string, input: any) {
  check(role === 'admin', 'Somente a Master pode criar usuários', 403);
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  check(email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Informe um e-mail válido');
  check(typeof input.password === 'string' && input.password.length >= 8 && new TextEncoder().encode(input.password).length <= 72, 'A senha deve ter ao menos 8 caracteres e no máximo 72 bytes');
  check(name.length <= 100, 'O nome deve ter até 100 caracteres');
  check(unwrap(await db.rpc('exb_rate_limit', {p_bucket:`create-user:${actor}`, p_limit:20})), 'Muitas tentativas. Aguarde alguns minutos.', 429);
  const {data, error} = await db.auth.admin.createUser({
    email, password:input.password, email_confirm:true,
    user_metadata:{name:name || email},
    app_metadata:{exb_provisioned_by:actor},
  });
  if (error) {
    if (['email_exists','user_already_exists'].includes(error.code)) throw new HttpError(409, 'Este e-mail já está cadastrado');
    if (error.code === 'weak_password') throw new HttpError(400, 'A senha não atende aos requisitos de segurança');
    throw new HttpError(400, 'Não foi possível criar a conta. Verifique os dados e tente novamente.');
  }
  check(data?.user?.id, 'Não foi possível confirmar a criação da conta', 500);
  // handle_new_user creates profile, customer role and license in the Auth transaction.
  // Never return credentials, Auth metadata or a session to the caller.
  return {success:true, user:{id:data.user.id, email:data.user.email}};
}

export async function deleteAccount(db: any, actor: string, role: string, input: any) {
  check(role === 'admin', 'Somente a Master pode excluir usuários', 403);
  check(uuid(input.user_id), 'Usuário inválido');
  check(input.user_id !== actor, 'A conta Master não pode excluir a si mesma', 403);
  const profile=unwrap<any>(await db.from('user_profiles').select('id,email,is_master').eq('id',input.user_id).maybeSingle());
  check(profile, 'Usuário não encontrado', 404);
  const targetRole=unwrap<any>(await db.from('platform_roles').select('role').eq('user_id',input.user_id).maybeSingle());
  check(!profile.is_master && targetRole?.role !== 'admin', 'A conta Master não pode ser excluída', 403);
  check(typeof input.confirm_email === 'string' && input.confirm_email.trim().toLowerCase() === profile.email?.toLowerCase(), 'Digite o e-mail do usuário para confirmar a exclusão');
  check(unwrap(await db.rpc('exb_rate_limit',{p_bucket:`delete-user:${actor}`,p_limit:10})), 'Muitas tentativas. Aguarde alguns minutos.',429);
  const {error}=await db.auth.admin.deleteUser(input.user_id, false);
  if(error) throw new HttpError(400,'Não foi possível excluir a conta. Nenhuma exclusão parcial foi confirmada.');
  return {success:true};
}
