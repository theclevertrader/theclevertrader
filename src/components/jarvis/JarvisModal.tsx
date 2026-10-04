'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Key,
  Flame,
  Zap
} from 'lucide-react';
import { JarvisCore } from '@/lib/ai/jarvis-core';

interface JarvisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: Record<string, any>;
}

interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  time: string;
}

export const JarvisModal: React.FC<JarvisModalProps> = ({
  isOpen,
  onClose,
  currentContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'jarvis',
      text: `Assalam o Alaikum! Main NEXUS AI hoon, aapka institutional trading AI copilot.
      
Aap mujh se Roman Urdu mein live batein kar saktay hain!

[FACT]:
- THE CLEVER TRADER Terminal status: 100% ONLINE
- Monitored Markets: XAUUSD (Gold), BTCUSD, EURUSD, NAS100
- AI Auto-Trader: Live SMC/ICT scanning active

[SIGNAL]:
- NFP & CPI Macro economic calendar synchronized
- Voice Audio & Microphone active

Aap text likhein ya mic daba kar bolain, main foran Roman Urdu mein jawab doon ga!`,
      time: '12:00 PM',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('JARVIS_GEMINI_API_KEY');
    if (savedKey) setGeminiApiKey(savedKey);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Fallback to browser TTS if audio stream fails
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

  // Google Urdu Voice Audio Engine (gTTS Stream)
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
        console.warn('Audio auto-play policy notice:', playErr);
        fallbackSpeechSynthesis(text, msgId);
      });
    } catch (e) {
      fallbackSpeechSynthesis(text, msgId);
    }
  };

  // Speech to text (Microphone)
  const toggleListening = async () => {
    if (typeof window === 'undefined') return;
    setMicError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Aap ke browser mein Microphone Speech Recognition support nahi hai. Meharbani kar ke Google Chrome ya Microsoft Edge use karein.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    // Explicitly prompt the browser for microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close tracks immediately so SpeechRecognition has full exclusive mic access
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (permErr: any) {
      console.warn('Microphone permission check failed:', permErr);
      if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
        setMicError('Microphone blocked hai! Browser ke address bar mein Lock/Tune icon par click kar ke Microphone ko "Allow" karein.');
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'ur-PK'; // Urdu / Roman Urdu speech recognition
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

  if (!isOpen) return null;

  const quickPrompts = [
    'Suno batein karo',
    'Gold ka live setup btao',
    'Auto-trader ka status kya hai?',
    'MT5 connect kaise karein?',
    'Aaj NFP news ka asar?',
    'Mera risk kitna hona chahiye?',
    'SMC Order Block strategy samjhao',
    'Pine script code bnao',
  ];

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
            context: currentContext,
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
          currentContext, 
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

      // Speak automatically if voice output is enabled
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

  const handleSaveGeminiKey = () => {
    localStorage.setItem('JARVIS_GEMINI_API_KEY', geminiApiKey);
    setShowApiKeyModal(false);
    alert('Gemini Free API Key saved! NEXUS AI is now powered by Gemini 1.5 Flash.');
  };

  // Helper to format institutional tags with colors
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('[FACT]:')) {
        return (
          <div key={idx} className="mt-2 text-cyan-400 font-bold flex items-center gap-1.5 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>[FACT]</span>
          </div>
        );
      }
      if (line.startsWith('[SIGNAL]:')) {
        return (
          <div key={idx} className="mt-2 text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>[SIGNAL]</span>
          </div>
        );
      }
      if (line.startsWith('[ASSUMPTION]:')) {
        return (
          <div key={idx} className="mt-2 text-amber-400 font-bold flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>[ASSUMPTION]</span>
          </div>
        );
      }
      if (line.startsWith('[OPINION]:')) {
        return (
          <div key={idx} className="mt-2 text-purple-400 font-bold flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" />
            <span>[OPINION]</span>
          </div>
        );
      }
      if (line.startsWith('```')) {
        return (
          <pre key={idx} className="p-2.5 my-2 rounded bg-slate-900 border border-slate-700 text-[11px] overflow-x-auto text-cyan-300 font-mono">
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-backdrop-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl h-[85vh] bg-[#131722] border border-[#242b38] rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans animate-modal-pop">

        
        {/* Header with Glowing Voice & Sound Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#242b38] bg-[#0c1017]">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-tv-blue">
              <Bot className="w-5 h-5 text-terminal-cyan" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-tv-green animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  NEXUS AI COPILOT
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  VOICE ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#848e9c]">
                Autonomous Quantitative Voice Guardian & Execution Copilot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Mute / Unmute Button */}
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) window.speechSynthesis?.cancel();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                voiceEnabled
                  ? 'bg-blue-500/20 text-tv-blue border-blue-500/40 shadow-sm'
                  : 'bg-[#181e2b] text-[#848e9c] border-[#242b38]'
              }`}
              title={voiceEnabled ? 'Voice output is ON (Nexus AI will speak)' : 'Voice is muted'}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{voiceEnabled ? 'VOICE ON' : 'MUTED'}</span>
            </button>

            {/* Cloud Key Button */}
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="p-1.5 rounded-lg bg-[#181e2b] border border-[#242b38] hover:border-tv-blue text-[#848e9c] hover:text-white transition-colors"
              title="Add Free Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#848e9c] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-[#242b38] bg-[#161b26] scrollbar-none text-xs">
          <span className="text-[10px] font-mono text-[#848e9c] uppercase shrink-0">Ask:</span>
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-[#1e2433] hover:bg-tv-blue hover:text-white text-slate-300 border border-[#242b38] text-[11px] whitespace-nowrap transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#0c1017]">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-terminal-cyan flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`relative max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                  isUser
                    ? 'bg-tv-blue text-white rounded-tr-none'
                    : 'bg-[#181e2b] border border-[#242b38] text-slate-200 rounded-tl-none'
                }`}>
                  {renderMessageContent(msg.text)}

                  <div className="flex items-center justify-between gap-4 mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] text-[#848e9c]">
                    <span>{msg.time}</span>

                    {!isUser && (
                      <div className="flex items-center gap-2">
                        {/* Audio Speak button */}
                        <button
                          onClick={() => speakText(msg.text, msg.id)}
                          className={`flex items-center gap-1 hover:text-white transition-colors ${
                            isSpeaking ? 'text-tv-green font-bold' : ''
                          }`}
                          title="Listen to this reply"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{isSpeaking ? 'Speaking...' : 'Bolo'}</span>
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-white transition-colors"
                          title="Copy text"
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
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-terminal-cyan flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl rounded-tl-none bg-[#181e2b] border border-[#242b38] text-xs text-tv-blue flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-tv-blue" />
                <span>NEXUS AI soch raha hai aur live data analyze kar raha hai...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar with Microphone & Send */}
        <div className="p-3 border-t border-[#242b38] bg-[#0c1017]">
          {micError && (
            <div className="mb-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between gap-2">
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
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border font-bold text-xs ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg ring-2 ring-rose-400/50'
                  : 'bg-[#181e2b] border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-300 hover:text-white shadow-sm'
              }`}
              title={isListening ? 'Click to STOP listening' : 'Click to SPEAK in Roman Urdu'}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-white' : 'text-cyan-400'}`} />
              <span className="text-[11px]">
                {isListening ? 'Recording...' : 'Bolain'}
              </span>
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? '🔴 Sun raha hoon, bolain...' : 'Roman Urdu mein kuch bhi poochiye (e.g. Gold ka setup btao, risk kitna lu?)...'}
              className="flex-1 bg-[#181e2b] border border-[#242b38] rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-[#5d6573] focus:outline-none focus:border-tv-blue transition-colors"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-tv-blue hover:bg-blue-600 disabled:opacity-40 text-white transition-colors shadow-sm"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Optional Gemini API Key Dialog */}
        {showApiKeyModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#131722] border border-[#242b38] rounded-2xl p-5 space-y-3 shadow-2xl text-xs">
              <div className="flex items-center justify-between border-b border-[#242b38] pb-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-tv-blue" />
                  <span>Google Gemini Free API Key</span>
                </h4>
                <button onClick={() => setShowApiKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <p className="text-[#848e9c] text-[11px] leading-relaxed">
                Nexus AI ke pass built-in offline engine pehle se active hai. Agar aap Google Gemini 1.5 Flash se unlimited natural Urdu conversations chahte hain to apni free key daalein (Google AI Studio se free milti hai):
              </p>
              <input
                type="password"
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                placeholder="Paste AIzaSy... key here"
                className="w-full bg-[#0c1017] border border-[#242b38] rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-tv-blue"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowApiKeyModal(false)} className="px-3 py-1.5 rounded bg-[#181e2b] text-slate-300">Cancel</button>
                <button onClick={handleSaveGeminiKey} className="px-4 py-1.5 rounded bg-tv-blue text-white font-bold">Save Key</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
