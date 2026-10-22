import { Label } from '@/components/ui/label';
import { PlaylistPlatform, platformLabels } from '@/lib/playlist-platform';
export default function PlaylistPlatformField({value,onChange}:{value:PlaylistPlatform;onChange:(v:PlaylistPlatform)=>void}){
 return <div className="space-y-2"><Label htmlFor="playlist-platform">Plataforma de destino</Label><select id="playlist-platform" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={e=>onChange(e.target.value as PlaylistPlatform)}>{Object.entries(platformLabels).map(([key,label])=><option key={key} value={key}>{label}{key==='android'||key==='android_tv'?' — integração futura':''}</option>)}</select><p className="text-xs text-muted-foreground">Você pode alterar esta escolha depois. O tamanho e a orientação da reprodução são definidos no player. A reprodução está validada no Windows; os players Android ainda serão desenvolvidos.</p></div>;
}
