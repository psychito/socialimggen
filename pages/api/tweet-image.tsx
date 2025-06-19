import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)

  const texto = searchParams.get('texto') || 'texto'
  const usuario = searchParams.get('usuario') || '@usuario'
  const nombre = searchParams.get('nombre') || 'Nombre Apellido'
  const avatar = searchParams.get('avatar') || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
  const hashtags = searchParams.get('hashtags')?.split(',') || ['#salud', '#prevención']
  const fecha = searchParams.get('fecha') || '11/03/24'
  const hora = searchParams.get('hora') || '10:30'

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: 'white',
          width: '1200px',
          height: '630px',
          padding: '60px',
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              backgroundImage: `url(${avatar})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 30 }}>{nombre}</div>
            <div style={{ fontSize: 24, color: '#aaa' }}>{usuario}</div>
          </div>
        </div>

        {/* Texto */}
        <div style={{ fontSize: 36, lineHeight: 1.4, marginTop: 40 }}>
          {texto}
        </div>

        {/* Hashtags */}
        <div style={{ marginTop: 40, fontSize: 22, color: '#1da1f2' }}>
          {hashtags.map((tag, i) => (
            <span key={i} style={{ marginRight: 15 }}>{tag}</span>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: '#888', marginTop: 30 }}>
          <span>{hora} · {fecha}</span>
          <span>💬 132 ♻️ 432 ❤️ 787</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}
