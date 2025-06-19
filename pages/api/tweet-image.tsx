import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge'
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const texto = searchParams.get('texto') || 'Texto de prueba'
  const usuario = searchParams.get('usuario') || '@usuario'

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 48,
          fontFamily: 'sans-serif',
          padding: 60
        }}
      >
        <div>{usuario}</div>
        <div style={{ marginTop: 20 }}>{texto}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}
