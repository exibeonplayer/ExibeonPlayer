const key='exibeon:playlists-changed';
export function notifyPlaylistsChanged(userId: string) {
  const value={userId,at:Date.now(),nonce:Math.random()};
  window.dispatchEvent(new CustomEvent(key,{detail:value}));
  try {window.localStorage.setItem(key,JSON.stringify(value));} catch { /* Same-tab refresh remains available. */ }
}
export function subscribePlaylistsChanged(userId: string,refresh:()=>void) {
  const local=(event:Event)=>{if((event as CustomEvent).detail?.userId===userId)refresh();};
  const storage=(event:StorageEvent)=>{if(event.key!==key||!event.newValue)return;try{if(JSON.parse(event.newValue).userId===userId)refresh();}catch{}};
  const focus=()=>refresh();
  window.addEventListener(key,local);window.addEventListener('storage',storage);window.addEventListener('focus',focus);
  return ()=>{window.removeEventListener(key,local);window.removeEventListener('storage',storage);window.removeEventListener('focus',focus);};
}
