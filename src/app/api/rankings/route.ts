import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json({ rankings: [] });
  }

  try {
    const res = await fetch(`${scriptUrl}?action=getTop3`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return NextResponse.json({ rankings: data });
      }
      if (data && Array.isArray(data.rankings)) {
        return NextResponse.json({ rankings: data.rankings });
      }
    } catch {
      // JSON 파싱 실패 시
    }

    return NextResponse.json({ rankings: [] });
  } catch (error) {
    console.error('랭킹 조회 실패:', error);
    return NextResponse.json({ rankings: [] }, { status: 500 });
  }
}
