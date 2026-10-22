/** Extract a real frame locally. No video bytes are sent to a third-party service. */
export function videoThumbnail(source: File | string): Promise<{ file: File; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const local = typeof source !== 'string';
    const url = local ? URL.createObjectURL(source) : source;
    let finished = false;
    let seekingEnd = false;
    let knownDuration = 0;
    const timer = setTimeout(() => finish(new Error('O navegador não conseguiu gerar a miniatura em 20 segundos.')), 20000);
    function finish(error?: Error, result?: { file: File; duration: number }) {
      if (finished) return;
      finished = true; clearTimeout(timer);
      video.onloadedmetadata = video.onseeked = video.onerror = null;
      video.removeAttribute('src'); video.load();
      if (local) URL.revokeObjectURL(url);
      if (error) reject(error); else resolve(result!);
    }
    video.crossOrigin = 'anonymous'; video.preload = 'auto'; video.muted = true;
    video.onloadedmetadata = () => {
      // WebM recordings can expose Infinity until the browser seeks to the end.
      if (video.duration === Infinity) { seekingEnd = true; video.currentTime = 1e10; return; }
      if (!Number.isFinite(video.duration) || video.duration <= 0) return finish(new Error('Duração do vídeo indisponível.'));
      knownDuration = video.duration;
      video.currentTime = Math.min(3, knownDuration * 0.15);
    };
    video.onseeked = () => {
      try {
        if (seekingEnd) {
          seekingEnd = false;
          knownDuration = Number.isFinite(video.duration) ? video.duration : video.currentTime;
          if (!Number.isFinite(knownDuration) || knownDuration <= 0) throw new Error('Duração indisponível.');
          video.currentTime = Math.min(3, knownDuration * 0.15); return;
        }
        if (!video.videoWidth || !video.videoHeight) throw new Error('Quadro de vídeo indisponível.');
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 640 / video.videoWidth, 360 / video.videoHeight);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        const duration = Math.max(1, Math.round(knownDuration));
        canvas.toBlob(blob => blob ? finish(undefined, { file: new File([blob], `miniatura-${crypto.randomUUID()}.jpg`, {type:'image/jpeg'}), duration }) : finish(new Error('Miniatura indisponível.')), 'image/jpeg', 0.82);
      } catch { finish(new Error('Não foi possível ler o quadro deste vídeo.')); }
    };
    video.onerror = () => finish(new Error('Formato de vídeo incompatível com a geração de miniaturas neste navegador.'));
    video.src = url;
  });
}
