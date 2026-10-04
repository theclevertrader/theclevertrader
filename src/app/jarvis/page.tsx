'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Terminal,
  Zap,
  Code2,
  BookOpen,
  ShieldCheck,
  History,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Key
} from 'lucide-react';
import { JarvisCore } from '@/lib/ai/jarvis-core';

interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  time: string;
}

export default function JarvisPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-main-1',
      sender: 'jarvis',
      text: `Assalam o Alaikum! Main NEXUS AI hoon, THE CLEVER TRADER ka institutional AI copilot.

Main aap ke sath 24/7 batein karne, live markets analyze karne aur automated trades monitor karne ke liye tayyar hoon!

[FACT]:
- Live Trading Terminal status: ONLINE & SECURE
- Current Environment: PAPER TRADING MODE
- Markets Analyzed: XAUUSD, BTCUSD, EURUSD, GBPUSD, NAS100
- Audio Voice Engine: ACTIVE & SPEAKING

[SIGNAL]:
- SMC Structure, ICT Liquidity Raids, aur 8-Pillar Confluence Engine active hain.
- Aap Roman Urdu mein trading ka koi bhi sawal pooch saktay hain.

Aap text likhein ya microphone se bolain, main foran Roman Urdu mein jawab doon ga!`,
      time: '09:00 AM',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('JARVIS_GEMINI_API_KEY');
    if (saved) setGeminiApiKey(saved);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const fallbackSpeechSynthesis = (text: string, msgId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeakingId(null);
      return;
    }
    const cleanText = text
      .replace(/\[FACT\]:/g, 'Fact:')
      .replace(/\[SIGNAL\]:/g, 'Signal:')
      .replace(/\[ASSUMPTION\]:/g, 'Analysis:')
      .replace(/\[OPINION\]:/g, 'Recommendation:')
      .replace(/```[\s\S]*?```/g, 'Pine script code displayed.')
      .replace(/[*#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => 
      (v.name.includes("Christopher") || v.name.includes("Guy") || v.name.includes("Natural") || v.name.includes("Google UK English Male") || v.name.includes("Daniel") || v.name.includes("David")) &&
      v.lang.startsWith("en")
    ) || voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) || voices.find(v => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.rate = 1.02;
    utterance.pitch = 0.98;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId || 'voice');
    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text: string, msgId?: string) => {
    if (typeof window === 'undefined') return;

    if (speakingId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setSpeakingId(msgId || 'voice');

    try {
      const audioUrl = `/api/jarvis/voice?text=${encodeURIComponent(text.slice(0, 800))}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setSpeakingId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.warn('Urdu voice stream failed, switching to local speech synthesis fallback');
        audioRef.current = null;
        fallbackSpeechSynthesis(text, msgId);
      };

      audio.play().catch(playErr => {
        console.warn('Audio auto-play notice:', playErr);
        fallbackSpeechSynthesis(text, msgId);
      });
    } catch (e) {
      fallbackSpeechSynthesis(text, msgId);
    }
  };

  const toggleListening = async () => {
    if (typeof window === 'undefined') return;
    setMicError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Aap ke browser mein Microphone Speech Recognition support nahi hai. Google Chrome ya Microsoft Edge use karein.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (permErr: any) {
      console.warn('Microphone permission check failed:', permErr);
      if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
        setMicError('Microphone blocked hai! Browser address bar mein Lock icon par click kar ke Microphone ko "Allow" karein.');
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'ur-PK';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission blocked hai! Address bar mein Lock icon par click kar ke "Allow" karein.');
        } else if (event.error === 'no-speech') {
          setMicError('Koi awaz detect nahi hui. Thora kareeb se dobara bolain.');
        } else if (event.error === 'network') {
          setMicError('Speech recognition network issue. Aap text type kar ke bhi foran pooch saktay hain!');
        } else {
          setMicError(`Notice (${event.error}). Dobara mic dabayein ya text likhein.`);
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error('Speech recognition exception:', e);
      setIsListening(false);
      setMicError('Microphone start nahi ho saka. Page refresh karein ya text type karein.');
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let responseText = '';
      try {
        const res = await fetch('/api/jarvis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            context: {
              symbol: 'XAUUSD',
              price: 2652.40,
              htfBias: 'Bullish',
              setupScore: 89,
            },
            apiKey: geminiApiKey || undefined,
            provider: geminiApiKey ? 'gemini' : undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply) responseText = data.reply;
        }
      } catch (apiErr) {
        console.warn('API /api/jarvis fetch failed, trying local engine:', apiErr);
      }

      if (!responseText) {
        responseText = await JarvisCore.askJarvis(
          textToSend, 
          {
            symbol: 'XAUUSD',
            price: 2652.40,
            htfBias: 'Bullish',
            setupScore: 89,
          },
          geminiApiKey || undefined,
          geminiApiKey ? 'gemini' : 'offline'
        );
      }

      const jarvisMsg: Message = {
        id: `j-${Date.now()}`,
        sender: 'jarvis',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, jarvisMsg]);

      if (voiceEnabled) {
        speakText(responseText, jarvisMsg.id);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'jarvis',
          text: 'Assalam o Alaikum. Maazrat chahta hoon, request process karne mein issue aya. Dobara koshish karein.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('[FACT]:')) {
        return (
          <div key={idx} className="mt-2 text-cyan-400 font-bold flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-terminal-cyan" />
            <span>[FACT]</span>
          </div>
        );
      }
      if (line.startsWith('[SIGNAL]:')) {
        return (
          <div key={idx} className="mt-2 text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
            <Sparkles className="w-4 h-4 text-terminal-green" />
            <span>[SIGNAL]</span>
          </div>
        );
      }
      if (line.startsWith('[ASSUMPTION]:')) {
        return (
          <div key={idx} className="mt-2 text-amber-400 font-bold flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>[ASSUMPTION]</span>
          </div>
        );
      }
      if (line.startsWith('[OPINION]:')) {
        return (
          <div key={idx} className="mt-2 text-purple-400 font-bold flex items-center gap-1.5 text-xs">
            <Bot className="w-4 h-4 text-terminal-purple" />
            <span>[OPINION]</span>
          </div>
        );
      }
      if (line.startsWith('```')) {
        return (
          <pre key={idx} className="p-3 my-2 rounded-lg bg-black/60 border border-white/[0.08] text-xs font-mono text-terminal-cyan overflow-x-auto">
            {line.replace(/```(pinescript)?/, '')}
          </pre>
        );
      }
      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] font-sans w-full space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl tv-card">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-tv-blue">
            <Bot className="w-6 h-6 text-terminal-cyan" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-tv-green animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                NEXUS — QUANTITATIVE AI COPILOT
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                VOICE ACTIVE
              </span>
            </div>
            <p className="text-xs text-[#848e9c]">
              Autonomous Quantitative Voice Guardian & Execution Copilot • High-Status English Diction • SMC/ICT Market Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Toggle */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) window.speechSynthesis?.cancel();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              voiceEnabled
                ? 'bg-blue-600/20 text-tv-blue border-blue-500/40 shadow-sm'
                : 'bg-[#181e2b] text-[#848e9c] border-[#242b38]'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{voiceEnabled ? 'VOICE ON' : 'MUTED'}</span>
          </button>
        </div>
      </div>

      {/* Main Chat Frame */}
      <div className="flex-1 flex flex-col min-h-0 tv-card overflow-hidden">
        {/* Messages Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 text-xs bg-[#0c1017]">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-terminal-cyan flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm text-xs leading-relaxed ${
                    isUser
                      ? 'bg-tv-blue text-white rounded-tr-none'
                      : 'bg-[#181e2b] border border-[#242b38] text-slate-200 rounded-tl-none'
                  }`}
                >
                  {renderContent(msg.text)}

                  <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-white/[0.06] text-[10px] text-[#848e9c]">
                    <span>{msg.time}</span>
                    {!isUser && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakText(msg.text, msg.id)}
                          className={`flex items-center gap-1 hover:text-white transition-colors ${
                            isSpeaking ? 'text-tv-green font-bold' : ''
                          }`}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{isSpeaking ? 'Speaking...' : 'Bolo'}</span>
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-white transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-tv-green" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-terminal-cyan flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#181e2b] border border-[#242b38] text-xs text-tv-blue flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-tv-blue" />
                <span>NEXUS AI live market structure analyze kar raha hai...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar with Microphone */}
        <div className="p-4 border-t border-[#242b38] bg-[#131722]">
          {micError && (
            <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{micError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setMicError(null)} 
                className="text-slate-400 hover:text-white font-bold text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3.5 py-3 rounded-xl transition-all border font-bold text-xs ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg ring-2 ring-rose-400/50'
                  : 'bg-[#181e2b] border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-300 hover:text-white shadow-sm'
              }`}
              title={isListening ? 'Click to STOP listening' : 'Click to SPEAK in Roman Urdu'}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-white' : 'text-cyan-400'}`} />
              <span className="text-xs">
                {isListening ? 'Recording...' : 'Bolain'}
              </span>
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? '🔴 Sun raha hoon, bolain...' : 'Roman Urdu mein poochein (e.g. "Suno batein karo", "Gold ka setup btao", "Auto bot kaisa hai?")...'}
              className="flex-1 bg-[#0c1017] border border-[#242b38] rounded-xl px-4 py-3 text-white text-xs placeholder:text-[#5d6573] focus:outline-none focus:border-tv-blue transition-colors font-sans"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-tv-blue hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-2"
            >
              <span>SEND</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
