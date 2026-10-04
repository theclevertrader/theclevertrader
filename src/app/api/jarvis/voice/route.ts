import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * JARVIS Neural Male Urdu Voice Engine
 * Uses Microsoft Azure's ultra-crisp 'ur-PK-AsadNeural' studio-grade male voice
 * with a customized deep baritone pitch (-4Hz) for an authoritative Iron-Man style voice.
 * Fallback to Google Urdu TTS if neural stream is unavailable.
 */

function cleanTextForUrduSpeech(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Expand institutional and trading brackets into spoken Roman Urdu
    .replace(/\[FACT\]:?/gi, 'Haqeeqat yeh hai: ')
    .replace(/\[SIGNAL\]:?/gi, 'Signal yeh hai: ')
    .replace(/\[ASSUMPTION\]:?/gi, 'Tajziya yeh hai: ')
    .replace(/\[OPINION\]:?/gi, 'Mera mashwara yeh hai: ')
    // Common trading symbol & term expansions for natural male phonetics
    .replace(/\bXAUUSD\b/gi, 'Gold')
    .replace(/\bBTCUSD\b/gi, 'Bitcoin')
    .replace(/\bEURUSD\b/gi, 'Euro USD')
    .replace(/\bGBPUSD\b/gi, 'Pound USD')
    .replace(/\bUSDJPY\b/gi, 'Dollar Yen')
    .replace(/\bNAS100\b/gi, 'Nasdaq')
    .replace(/\bSL\b/g, 'Stop Loss')
    .replace(/\bTP\b/g, 'Take Profit')
    .replace(/\bRR\b/g, 'Risk Reward')
    .replace(/\bBOS\b/g, 'Break of Structure')
    .replace(/\bCHoCH\b/g, 'Change of Character')
    .replace(/\bFVG\b/g, 'Fair Value Gap')
    .replace(/\bMSS\b/g, 'Market Structure Shift')
    .replace(/\bNFP\b/g, 'Non Farm Payroll')
    .replace(/\bCPI\b/g, 'Inflation CPI')
    .replace(/\bDXY\b/g, 'Dollar Index')
    // Remove markdown symbols, quotes, bullets
    .replace(/[*#_`~|]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

// 1. Primary: Microsoft Neural Deep Male Voice (ur-PK-AsadNeural)
async function generateNeuralMaleVoice(text: string): Promise<Buffer | null> {
  try {
    const tts = new MsEdgeTTS();
    // 'ur-PK-AsadNeural' is Microsoft's ultra-realistic studio-grade male Pakistani voice
    await tts.setMetadata('ur-PK-AsadNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, {
      pitch: '-4Hz', // Deep authoritative male baritone
      rate: '+4%',   // Crisp confident AI speaking pace
    });

    const chunks: Buffer[] = [];
    return new Promise<Buffer | null>((resolve) => {
      let isDone = false;

      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      audioStream.on('end', () => {
        if (!isDone) {
          isDone = true;
          const combined = Buffer.concat(chunks);
          resolve(combined.length > 0 ? combined : null);
        }
      });

      audioStream.on('error', (err) => {
        console.warn('MsEdgeTTS stream error:', err);
        if (!isDone) {
          isDone = true;
          resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
        }
      });

      // 6 second timeout guard
      setTimeout(() => {
        if (!isDone) {
          isDone = true;
          resolve(chunks.length > 0 ? Buffer.concat(chunks) : null);
        }
      }, 6000);
    });
  } catch (err) {
    console.warn('Neural male voice error, falling back to Google TTS:', err);
    return null;
  }
}

// 2. Fallback: Google TTS
async function fetchGoogleTtsFallback(text: string): Promise<Buffer | null> {
  const chunks = splitIntoChunks(text);
  const audioBuffers = await Promise.all(
    chunks.map(async (chunk) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ur&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://translate.google.com/',
          },
        });
        if (!res.ok) return null;
        return Buffer.from(await res.arrayBuffer());
      } catch (e) {
        return null;
      }
    })
  );

  const valid: Buffer[] = [];
  for (const b of audioBuffers) {
    if (b && b.length > 0) valid.push(b);
  }
  return valid.length > 0 ? Buffer.concat(valid) : null;
}

function splitIntoChunks(text: string, maxChunkLength = 160): string[] {
  if (text.length <= maxChunkLength) return [text];
  const sentences = text.split(/(?<=[.?!:\n])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxChunkLength) {
      currentChunk = (currentChunk + ' ' + sentence).trim();
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.filter((c) => c.trim().length > 0);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawText = searchParams.get('text') || '';

  if (!rawText.trim()) {
    return new NextResponse('Text parameter is required', { status: 400 });
  }

  return generateVoiceResponse(rawText);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawText = body.text || '';

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    return generateVoiceResponse(rawText);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateVoiceResponse(rawText: string) {
  const cleanText = cleanTextForUrduSpeech(rawText);
  if (!cleanText) {
    return new NextResponse('Empty clean text', { status: 400 });
  }

  const cappedText = cleanText.length > 800 ? cleanText.slice(0, 800) + '...' : cleanText;

  // 1. Attempt deep studio-grade male neural voice (AsadNeural)
  let audioBuffer = await generateNeuralMaleVoice(cappedText);

  // 2. Fallback if neural connection dropped
  if (!audioBuffer || audioBuffer.length === 0) {
    audioBuffer = await fetchGoogleTtsFallback(cappedText);
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    return new NextResponse('Failed to generate audio stream', { status: 502 });
  }

  return new NextResponse(new Uint8Array(audioBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
