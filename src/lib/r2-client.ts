// Somente utilitários públicos. Assinaturas de upload são emitidas pelo servidor.
export const generateFileKey=(userId:string,fileName:string)=>'users/'+userId+'/media/'+crypto.randomUUID()+'_'+fileName.replace(/[^a-zA-Z0-9._-]/g,'_');
