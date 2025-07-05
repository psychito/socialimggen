import React, { useState, useEffect } from 'react';

const RATIOS = [
  { label: '9:16 (Vertical)', value: '9:16' },
  { label: '4:5 (Instagram)', value: '4:5' },
  { label: '3:4 (Clásico vertical)', value: '3:4' },
  { label: '1:1 (Cuadrado)', value: '1:1' },
  { label: '16:9 (Horizontal)', value: '16:9' }
];

const QUALITY_OPTIONS = [
  { label: 'Baja (Rápido)', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta (Recomendado)', value: 'high' },
  { label: 'Ultra (Lento)', value: 'ultra' }
];

const BACKGROUND_OPTIONS = [
  { label: 'Fondo Blanco', value: 'white' },
  { label: 'Fondo Azul', value: 'blue' },
  { label: 'Gradiente', value: 'gradient' },
  { label: 'Frame del Video', value: 'video-frame' }
];

export default function App() {
  const [avatars, setAvatars] = useState<{ label: string; value: string }[]>([]);
  const [videos, setVideos] = useState<{ label: string; value: string }[]>([]);
  const [avatar, setAvatar] = useState('/uploads/avatars/lex.jpg');
  const [video, setVideo] = useState('/videos/nature/forest-wind1.mp4');
  const [displayName, setDisplayName] = useState('Alexander Urbina');
  const [username, setUsername] = useState('@lexurbinac');
  const [text, setText] = useState('Ingresa tu texto');
  const [likes, setLikes] = useState(25);
  const [retweets, setRetweets] = useState(40);
  const [comments, setComments] = useState(12);
  const [views, setViews] = useState(1467);
  const [aspectRatio, setAspectRatio] = useState('4:5');
  const [quality, setQuality] = useState('high'); // Alta
  const [backgroundType, setBackgroundType] = useState(BACKGROUND_OPTIONS[1].value); // Default to 'blue'
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/placeholder.png');
  const [resultUrl, setResultUrl] = useState('');
  const [mode, setMode] = useState<'image' | 'video'>('video');
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [avatarsError, setAvatarsError] = useState('');
  const [videosError, setVideosError] = useState('');
  const [overlayBlur, setOverlayBlur] = useState(8);
  const MAX_TEXT_LENGTH = 280;
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [rateLimitActive, setRateLimitActive] = useState(false);

  useEffect(() => {
    setAvatarsLoading(true);
    setAvatarsError('');
    fetch('/api/upload/avatars')
      .then(res => {
        console.log('Respuesta cruda avatars:', res.status, res.statusText, res.url);
        if (!res.ok) {
          return res.text().then(text => {
            console.error('Respuesta de error avatars:', text);
            throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
          });
        }
        return res.text().then(text => {
          console.log('Texto respuesta avatars:', text.substring(0, 200));
          try {
            return JSON.parse(text);
          } catch (parseErr) {
            console.error('Error parsing JSON avatars:', parseErr);
            console.error('Texto completo:', text);
            throw new Error(`Respuesta no es JSON válido: ${text.substring(0, 100)}`);
          }
        });
      })
      .then(data => {
        console.log('Respuesta JSON avatars:', data);
        if (data.success && data.avatars && data.avatars.length > 0) {
          const avatarList = data.avatars.map((a: any) => ({ label: a.name, value: a.url }));
          setAvatars(avatarList);
          // Buscar lex.jpg
          const lex = data.avatars.find((a: any) => a.name === 'lex.jpg');
          if (lex) {
            setAvatar(lex.url);
            setDisplayName('Alexander Urbina');
            setUsername('@lexurbinac');
          } else {
            setAvatar(avatarList[0].value);
            setDisplayName(avatarList[0].label.split('.')[0].replace(/-/g, ' '));
            setUsername('@' + avatarList[0].label.split('.')[0].replace(/-/g, '').toLowerCase());
          }
        } else {
          setAvatars([]);
          setAvatarsError('No hay avatares disponibles');
        }
        setAvatarsLoading(false);
        console.log('Estado final avatars:', avatars);
      })
      .catch((err) => {
        console.error('Error fetch avatars:', err);
        setAvatars([]);
        setAvatarsError(`Error cargando avatares: ${err.message}`);
        setAvatarsLoading(false);
      });
    setVideosLoading(true);
    setVideosError('');
    fetch('/api/video/list')
      .then(res => {
        console.log('Respuesta cruda videos:', res.status, res.statusText, res.url);
        if (!res.ok) {
          return res.text().then(text => {
            console.error('Respuesta de error videos:', text);
            throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
          });
        }
        return res.text().then(text => {
          console.log('Texto respuesta videos:', text.substring(0, 200));
          try {
            return JSON.parse(text);
          } catch (parseErr) {
            console.error('Error parsing JSON videos:', parseErr);
            console.error('Texto completo:', text);
            throw new Error(`Respuesta no es JSON válido: ${text.substring(0, 100)}`);
          }
        });
      })
      .then(data => {
        console.log('Respuesta JSON videos:', data);
        if (data.success && data.videos && data.videos.length > 0) {
          setVideos(data.videos.map((v: any) => ({ label: v.name, value: v.url })));
          setVideo(data.videos[0].url);
        } else {
          setVideos([]);
          setVideosError('No hay videos disponibles');
        }
        setVideosLoading(false);
        console.log('Estado final videos:', videos);
      })
      .catch((err) => {
        console.error('Error fetch videos:', err);
        setVideos([]);
        setVideosError(`Error cargando videos: ${err.message}`);
        setVideosLoading(false);
      });
  }, []);

  useEffect(() => {
    if (rateLimitSeconds > 0) {
      setRateLimitActive(true);
      const interval = setInterval(() => {
        setRateLimitSeconds(s => {
          if (s <= 1) {
            clearInterval(interval);
            setRateLimitActive(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRateLimitActive(false);
    }
  }, [rateLimitSeconds]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatar || !video) {
      alert('Selecciona un avatar y un video antes de generar.');
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      alert('El texto no puede superar los 280 caracteres.');
      return;
    }
    setLoading(true);
    setResultUrl('');
    setPreviewUrl('');
    const endpoint = mode === 'video' ? '/api/video' : '/api/image/generate';
    const payload = mode === 'video' ? {
      name: displayName,
      username,
      avatarUrl: avatar,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      text,
      likes,
      comments,
      retweets,
      views,
      backgroundVideo: video,
      options: { aspectRatio, quality, overlayBlur }
    } : {
      tweetData: {
        displayName,
        username,
        avatar: avatar,
        timestamp: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        text,
        likes,
        retweets,
        replies: comments,
        views
      },
      options: { 
        aspectRatio, 
        quality, 
        backgroundType,
        backgroundVideo: backgroundType === 'video-frame' ? video : undefined,
        enableOverlay,
        overlayBlur
      }
    };
    console.log('Enviando a backend:', { endpoint, payload });
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 429) {
        // Manejo especial de rate limit
        let retryAfter = 60;
        try {
          const data = await res.json();
          retryAfter = Number(data.retryAfter) || 60;
        } catch {}
        setRateLimitSeconds(retryAfter);
        setRateLimitActive(true);
        return;
      }
      if (!res.ok) throw new Error('Error generando');
      // Esperar JSON con la URL del archivo generado
      const data = await res.json();
      const fileUrl = mode === 'video' ? data.videoUrl : data.imageUrl;
      if (!fileUrl) throw new Error('No se recibió la URL del archivo generado');
      setResultUrl(fileUrl);
      setPreviewUrl(fileUrl);
    } catch (err: any) {
      if (!rateLimitActive) alert('Error generando: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const fileRes = await fetch(resultUrl);
      const blob = await fileRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resultUrl.split('/').pop() || (mode === 'video' ? 'resultado.mp4' : 'resultado.png');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error descargando el archivo');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', fontFamily: 'Inter, Arial, sans-serif', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <form onSubmit={handleGenerate} style={{ background: '#181818', borderRadius: 16, padding: 32, boxShadow: '0 2px 24px #0004', minWidth: 340, maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rateLimitActive && (
          <div style={{ background: '#ffeded', color: '#b71c1c', borderRadius: 8, padding: 12, marginBottom: 12, textAlign: 'center', fontWeight: 600, fontSize: 15, border: '1px solid #ff5252' }}>
            Has realizado demasiadas solicitudes en poco tiempo.<br />
            Debes esperar <span style={{ fontWeight: 700 }}>{rateLimitSeconds}</span> segundo{rateLimitSeconds === 1 ? '' : 's'} antes de volver a intentar.
          </div>
        )}
        <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Generador Social Minimal</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setMode('image')} style={{ flex: 1, background: mode === 'image' ? '#fff' : '#222', color: mode === 'image' ? '#111' : '#fff', border: 'none', borderRadius: 8, padding: 8, fontWeight: 600, cursor: 'pointer' }}>Imagen</button>
          <button type="button" onClick={() => setMode('video')} style={{ flex: 1, background: mode === 'video' ? '#fff' : '#222', color: mode === 'video' ? '#111' : '#fff', border: 'none', borderRadius: 8, padding: 8, fontWeight: 600, cursor: 'pointer' }}>Video</button>
        </div>
        <label>Avatar
          <select value={avatar} onChange={e => {
            setAvatar(e.target.value);
            const selected = avatars.find(a => a.value === e.target.value);
            if (selected && selected.label === 'lex.jpg') {
              setDisplayName('Alexander Urbina');
              setUsername('@lexurbinac');
            } else if (selected && selected.label === 'bra.jpeg') {
              setDisplayName('Bra Urbina');
              setUsername('@bra.cuantico');
            } else if (selected && selected.label === 'giova.jpeg') {
              setDisplayName('Giova Urbina');
              setUsername('@giova.viajando');
            } else if (selected) {
              setDisplayName(selected.label.split('.')[0].replace(/-/g, ' '));
              setUsername('@' + selected.label.split('.')[0].replace(/-/g, '').toLowerCase());
            }
          }} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} disabled={avatarsLoading || avatars.length === 0}>
            {avatarsLoading ? <option>Cargando...</option> : avatarsError ? <option>{avatarsError}</option> : avatars.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </label>
        <label>Video de fondo
          <select value={video} onChange={e => setVideo(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} disabled={videosLoading || videos.length === 0}>
            {videosLoading ? <option>Cargando...</option> : videosError ? <option>{videosError}</option> : videos.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </label>
        <label>Nombre
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} />
        </label>
        <label>Handle
          <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} />
        </label>
        <label>Texto
          <textarea value={text} onChange={e => {
            if (e.target.value.length <= MAX_TEXT_LENGTH) {
              setText(e.target.value);
            } else {
              setText(e.target.value.slice(0, MAX_TEXT_LENGTH));
            }
          }} rows={4} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4, resize: 'vertical' }} maxLength={MAX_TEXT_LENGTH} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 13, color: text.length >= MAX_TEXT_LENGTH ? '#ff5252' : '#aaa' }}>{text.length}/{MAX_TEXT_LENGTH}</span>
            {text.length >= MAX_TEXT_LENGTH && (
              <span style={{ color: '#ff5252', fontSize: 13, marginLeft: 8 }}>Máximo 280 caracteres</span>
            )}
          </div>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>Likes
            <input type="number" value={likes} onChange={e => setLikes(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} />
          </label>
          <label style={{ flex: 1 }}>Retweets
            <input type="number" value={retweets} onChange={e => setRetweets(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{ flex: 1 }}>Comments
            <input type="number" value={comments} onChange={e => setComments(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} />
          </label>
          <label style={{ flex: 1 }}>Views
            <input type="number" value={views} onChange={e => setViews(Number(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>Proporción
            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }}>
              {RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label style={{ flex: 1 }}>Calidad de Video
            <select value={quality} onChange={e => setQuality(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }}>
              {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </label>
        </div>
        {mode === 'image' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ flex: 1 }}>Tipo de Fondo
              <select value={backgroundType} onChange={e => setBackgroundType(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', marginTop: 4 }}>
                {BACKGROUND_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                checked={enableOverlay} 
                onChange={e => setEnableOverlay(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Overlay
            </label>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', width: '100%' }}>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            Blur
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={overlayBlur}
              onChange={e => setOverlayBlur(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 24, textAlign: 'right' }}>{overlayBlur}</span>
          </label>
        </div>
        <button type="submit" disabled={loading || !avatar || !video || rateLimitActive} style={{ marginTop: 16, background: '#fff', color: '#111', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, fontSize: 16, cursor: loading || !avatar || !video || rateLimitActive ? 'not-allowed' : 'pointer', opacity: loading || !avatar || !video || rateLimitActive ? 0.6 : 1 }}>Generar {mode === 'video' ? 'Video' : 'Imagen'}</button>
        {loading && <div style={{ textAlign: 'center', marginTop: 12 }}><span className="loader" style={{ display: 'inline-block', width: 32, height: 32, border: '4px solid #fff', borderTop: '4px solid #222', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Generando...</div>}
      </form>
      <div style={{ marginLeft: 32, minWidth: 320, maxWidth: 400, width: '100%', background: '#181818', borderRadius: 16, padding: 24, boxShadow: '0 2px 24px #0004', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {resultUrl ? (
          <>
            <a href={resultUrl} download style={{ color: '#fff', textDecoration: 'underline', marginBottom: 12 }}>Descargar resultado</a>
            {mode === 'video' ? (
              <video src={resultUrl} controls style={{ width: '100%', maxWidth: 340, borderRadius: 12 }} />
            ) : (
              <img src={resultUrl} alt="preview" style={{ width: '100%', maxWidth: 340, borderRadius: 12 }} />
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={previewUrl} 
              alt="Vista previa - completa el formulario y presiona Generar" 
              style={{ 
                width: '100%', 
                maxWidth: 340, 
                borderRadius: 12, 
                opacity: previewUrl === '/placeholder.png' ? 0.8 : 1 
              }} 
            />
            <div style={{ color: '#888', marginTop: 12, fontSize: 14 }}>
              Vista previa - completa el formulario y presiona "Generar"
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
