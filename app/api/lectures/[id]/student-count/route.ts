import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getSubscriberCount } from '@/lib/sse-bus'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ count: getSubscriberCount(id) })
}
