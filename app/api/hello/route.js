export async function GET() {
  return Response.json({ message: 'Hello World' })
}

export async function POST(request) {
  const data = await request.json()
  return Response.json({ data })
}   