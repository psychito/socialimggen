// /api/tweet-image.tsx
import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge'
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)

  const texto = searchParams.get('texto') || 'Este es un tweet de ejemplo generado con Vercel.'
  const usuario = searchParams.get('usuario') || '@lexurbina'
  const nombre = searchParams.get('nombre') || 'Lex Urbina'
  const avatar = searchParams.get('avatar') || 'https://upload.wikimedia.org/wikipedia/commons/7/70/User_icon_BLACK-01.svg'

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1e1e',
          color: '#fff',
          width: '100%',
          height: '100%',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          fontSize: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <img
            src={avatar}
            width="80"
            height="80"
            style={{ borderRadius: '50%' }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{nombre}</div>
            <div style={{ fontSize: 24, color: '#ccc' }}>{usuario}</div>
          </div>
        </div>
        <div style={{ marginTop: 40, lineHeight: 1.4 }}>{texto}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}
