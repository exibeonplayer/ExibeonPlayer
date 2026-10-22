export type PlaylistPlatform='all'|'windows'|'android'|'android_tv';
export const platformLabels:Record<PlaylistPlatform,string>={all:'Todas as plataformas',windows:'Windows',android:'Android',android_tv:'Android TV'};
export const platformValue=(value?:string):PlaylistPlatform=>value&&Object.prototype.hasOwnProperty.call(platformLabels,value)?value as PlaylistPlatform:'all';
