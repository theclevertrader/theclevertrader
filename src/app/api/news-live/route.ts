import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    channels: {
      aljazeera: 'gCNeDWCI0vo',
      skynews: 'xDWQ3LkccY8',
      cna: 'XWq5kBlakcQ',
      trtworld: '9CucucyxECM',
      bbcnews: 'sc21UUjyLaw',
    },
  });
}
