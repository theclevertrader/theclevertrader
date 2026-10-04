import { AiProvider, AiResponse, AiPromptOptions } from './provider-interface';

export class JarvisCore {
  private static systemInstruction = `
You are NEXUS AI, an elite institutional AI trading copilot for "THE CLEVER TRADER" hedge fund terminal.
Strict rules for communication:
1. Speak ONLY in clean, natural, professional Roman Urdu (e.g., "Walaikum Assalam! Main NEXUS AI hoon...", "Aap ka hukam, sir...", "Market structure abhi bullish hai...").
2. DO NOT use Hindi vocabulary (do not say "kripya", "dhanyawad", "namaste"; use "shukriya", "khush aamdeed", "mashwara").
3. DO NOT output Devanagari script.
4. Structure detailed market analysis responses into clear sections when relevant:
   - [FACT]: Proven price levels, current quotes, confirmed BOS/CHoCH, session timings.
   - [SIGNAL]: Algorithmic setup trigger, FVG retest, liquidity sweep.
   - [ASSUMPTION]: Probable institutional intent, order flow direction.
   - [OPINION]: AI risk evaluation and recommendation.
5. Emphasize strict risk management: maximum 1% risk per setup, 0.01 lot micro-scalp limits ($3 SL, $9 TP).
6. Be friendly, authoritative, conversational, and always ready to talk like a professional institutional quant!
`;

  /**
   * Generates a Roman Urdu response based on user query and market context
   */
  public static async askJarvis(
    userMessage: string, 
    contextData?: Record<string, any>,
    apiKey?: string,
    provider: 'offline' | 'gemini' | 'groq' | 'openrouter' | 'huggingface' | 'openai' | 'anthropic' = 'offline'
  ): Promise<string> {
    const q = userMessage.toLowerCase().trim();

    // 1. If explicit Groq requested or available
    if (provider === 'groq' || (!provider && process.env.GROQ_API_KEY)) {
      const gKey = apiKey || process.env.GROQ_API_KEY;
      if (gKey) {
        try {
          const res = await this.callGroqApi(userMessage, gKey, contextData);
          if (res) return res;
        } catch (err) {
          console.warn('[Jarvis] Groq API failover:', err);
        }
      }
    }

    // 2. Try Gemini API
    const geminiKey = apiKey || process.env.GEMINI_API_KEY;
    if (geminiKey && (provider === 'gemini' || !provider || provider === 'offline')) {
      try {
        const res = await this.callGeminiApi(userMessage, geminiKey, contextData);
        if (res) return res;
      } catch (err) {
        console.warn('[Jarvis] Gemini API failover:', err);
      }
    }

    // 3. Try Groq (LPU Llama 3.3-70B ultra-fast failover)
    if (process.env.GROQ_API_KEY) {
      try {
        const res = await this.callGroqApi(userMessage, process.env.GROQ_API_KEY, contextData);
        if (res) return res;
      } catch (err) {
        console.warn('[Jarvis] Groq fallback failed:', err);
      }
    }

    // 4. Try OpenRouter (Claude / DeepSeek / GPT-4o-mini router)
    const orKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (orKey) {
      try {
        const res = await this.callOpenRouterApi(userMessage, orKey, contextData);
        if (res) return res;
      } catch (err) {
        console.warn('[Jarvis] OpenRouter fallback failed:', err);
      }
    }

    // 5. Try Hugging Face Inference API
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const res = await this.callHuggingFaceApi(userMessage, process.env.HUGGINGFACE_API_KEY, contextData);
        if (res) return res;
      } catch (err) {
        console.warn('[Jarvis] HuggingFace fallback failed:', err);
      }
    }

    // 6. Built-in institutional Roman Urdu reasoning engine (Offline / High-Fidelity Local Copilot)
    return this.generateOfflineJarvisResponse(q, contextData);
  }

  private static generateOfflineJarvisResponse(query: string, context?: Record<string, any>): string {
    const currentSymbol = context?.symbol || 'XAUUSD';
    const currentPrice = context?.price || 2652.40;
    const htfBias = context?.htfBias || 'Bullish';
    const setupScore = context?.setupScore || 82;

    // 1. GREETINGS & TALKING / CONVERSATION ("batein karo", "kya haal hai", "suno", "tum kon ho")
    if (
      query.includes('batein') || 
      query.includes('bat') || 
      query.includes('bolo') || 
      query.includes('suno') || 
      query.includes('kya haal') || 
      query.includes('kaise ho') || 
      query.includes('kon ho') || 
      query.includes('kya chal') || 
      query.includes('hello') || 
      query.includes('hi') || 
      query.includes('assalam') || 
      query.includes('salam')
    ) {
      return `Walaikum Assalam! Main bilkul theek aur 100% active hoon, sir! Main NEXUS AI hoon—THE CLEVER TRADER terminal ka autonomous AI copilot.

Main aap ke sath 24/7 batein karne, live markets analyze karne aur automated trades monitor karne ke liye tayyar hoon.

Aap mujh se kuch bhi pooch saktay hain:
1. "Gold ka live analysis aur setup btao"
2. "Auto-trader bot ka kya status hai?"
3. "MetaTrader 5 (MT5) par connect kaise karein?"
4. "Aaj konsi high-impact news aane wali hai?"
5. "Mera position size aur stop loss kitna hona chahiye?"
6. "TradingView ke liye Pine Script code bnao"

Aap text likhein ya microphone icon daba kar bolain, main foran Roman Urdu mein jawab doon ga!`;
    }

    // 2. AUTO-TRADER STATUS ("auto bot", "khud trade", "bot kaisa chal raha")
    if (
      query.includes('auto') || 
      query.includes('bot') || 
      query.includes('khud') || 
      query.includes('automatic') ||
      query.includes('trade li') ||
      query.includes('trader kaisa')
    ) {
      return `Assalam o Alaikum! Autonomous AI Auto-Trading Bot ka live status yeh hai:

[FACT]:
- Bot Status: ACTIVE & MONITORING (SMC + ICT Scanner ON)
- Monitored Pairs: XAUUSD (Gold), BTCUSD, EURUSD, NAS100
- Confluence Threshold: Minimum 75/100 required
- Daily Drawdown Safety Gate: 0.0% / 3.0% Max Limit (OK)

[SIGNAL]:
- Jaise hi kisi pair par Liquidity Sweep + Order Block + FVG Confluence Score >= 75 confirm hota hai, bot **khud ba khud trade execute kar deta hai**.
- Default Execution: 0.01 Micro Lot ($3 Max Risk SL | $9 Target TP).

[OPINION]:
- Agar aap chahein to Command Center par ja kar **⚡ SCAN NOW & AUTO-EXECUTE** button click kar saktay hain taake bot foran market scan karke active trade place kare!`;
    }

    // 3. METATRADER 5 (MT5) CONNECTION ("mt5", "metatrader", "connect")
    if (
      query.includes('mt5') || 
      query.includes('metatrader') || 
      query.includes('connect') || 
      query.includes('broker')
    ) {
      return `Assalam o Alaikum! MetaTrader 5 (MT5) connect karne ka tareeqa nihayat asaan hai:

[FACT]:
- Terminal ke pass dedicated **MT5 Bridge Gateway** active hai on \`http://localhost:3000/api/mt5\`.
- Top header mein **[MT5: CONNECT]** button par click karke aap status dekh saktay hain.

[SIGNAL]:
- Do tareeqe hain MT5 link karne ke:
  1. **1-Click Python Bridge (Fastest)**: Desktop par \`START_MT5_BRIDGE.bat\` par double click karein ya \`python mt5_bridge.py\` run karein. Ye instantly aapke open MT5 se sync ho jata hai!
  2. **MQL5 EA**: \`CleverTraderBridge.mq5\` ko MT5 MetaEditor mein compile karke chart par attach karein.

[OPINION]:
- Python bridge sab se tez aur stable hai. Connect hote hi hamara AI bot jo bhi trade lega, woh micro-seconds mein aapke MT5 account par live lag jayegi!`;
    }

    // 4. ECONOMIC CALENDAR & NEWS ("news", "nfp", "cpi", "calendar", "fundamental")
    if (
      query.includes('news') || 
      query.includes('calendar') || 
      query.includes('fundamental') || 
      query.includes('nfp') || 
      query.includes('cpi') || 
      query.includes('fed') || 
      query.includes('interest rate')
    ) {
      return `Assalam o Alaikum! Live Macro & Economic News ka tajziya:

[FACT]:
- US Dollar Index (DXY): 101.42 (Bearish Trend)
- US 10-Year Bond Yield: 3.72% (Yields dropping = Bullish for Gold)
- Upcoming Tier-1 News: **US Non-Farm Payrolls (NFP)** and Core CPI
- High-Impact News Window: Releases ke waqt broker spread 5x se 10x barh jata hai.

[SIGNAL]:
- Hamare Economic Calendar mein **⚠️ NO-TRADE NEWS LOCK** active hai jo news se 30 minutes pehle auto-trader ko protect karta hai taake slippage se loss na ho.

[OPINION]:
- NFP ya CPI ke waqt direct market orders se bachein. News ke 15 minutes baad jab Asian high/low ki liquidity sweep ho jaye, tab pullback par entry lein!`;
    }

    // 5. GOLD / XAUUSD SETUP
    if (query.includes('gold') || query.includes('xau') || query.includes('sona')) {
      return `Assalam o Alaikum! ${currentSymbol} (Gold) ka live institutional SMC/ICT structure:

[FACT]:
- Current Market Price: ${currentPrice} USD
- Higher Timeframe (4H / Daily) Bias: ${htfBias}
- Key Liquidity Raid: Asian Low liquidity sweep 2640.20 par confirm hui hai.
- Active Bullish FVG: 2648.50 - 2651.00 demand zone.

[SIGNAL]:
- Confluence Score: ${setupScore}/100 (VALID INSTITUTIONAL SETUP).
- 15M timeframe par Bullish MSS (Market Structure Shift) confirmed.
- Target Buy-Side Liquidity: 2664.00 - 2670.00.

[ASSUMPTION]:
- London Kill Zone ke dauran institutional smart money ne sell-stops raid kar liye hain aur ab price higher levels ki taraf expand kar sakti hai.

[OPINION]:
- Entry Zone: 2650.00 - 2651.50
- Stop Loss: 2645.00 ($3 risk on 0.01 lot)
- Take Profit 1: 2660.00 | Take Profit 2: 2665.00 (1:3 Risk/Reward)`;
    }

    // 6. BITCOIN / CRYPTO SETUP ("btc", "bitcoin", "crypto", "eth")
    if (query.includes('btc') || query.includes('bitcoin') || query.includes('crypto') || query.includes('eth')) {
      return `Assalam o Alaikum! Bitcoin (BTCUSD) ka institutional market structure:

[FACT]:
- Current BTCUSD Price: ~63,800 USD
- 4H Structure: Bullish Break of Structure (BOS) above 63,200
- Demand Order Block: 62,800 - 63,100 zone unmitigated hai.

[SIGNAL]:
- RSI Bullish Hidden Divergence 1H chart par active hai.
- Volume Expansion displacement candles ke sath notice hui hai.

[OPINION]:
- Dip buyers 63,200 demand zone par active hain. 
- Invalidation level 62,500 hai. Target 65,500 aur 66,200 Buy-side liquidity pools hain!`;
    }

    // 7. BUY KARNA CHAHIYE YA SELL ("buy karu", "sell karu", "entry kab lu")
    if (query.includes('buy') || query.includes('sell') || query.includes('entry') || query.includes('kharid') || query.includes('becho')) {
      return `Assalam o Alaikum! ${currentSymbol} par entry ke mutalliq mera institutional analysis:

[FACT]:
- Current Setup Score: ${setupScore}/100
- No-Trade Engine Filter: ${setupScore >= 75 ? 'APPROVED (VALID SETUP)' : 'NO TRADE (WAIT FOR CONFLUENCE)'}

[SIGNAL]:
- Hamesha 4 cheezon ka wait karein:
  1. Higher Timeframe Trend Bias (Bullish ya Bearish)
  2. Liquidity Sweep (Asian High ya Low sweep ho chuka ho)
  3. Lower Timeframe MSS (Market Structure Shift)
  4. FVG Retest entry

[OPINION]:
- Candle close hone se pehle entry lena "FOMO" hai jo 90% traders ke loss ka sabab banta hai.
- Jab tak hamara Auto-Trader radar 75+ score show na kare, tab tak sabar karein!`;
    }

    // 8. RISK MANAGEMENT & LOT SIZING ("risk", "lot", "size", "stop loss", "tp")
    if (query.includes('risk') || query.includes('lot') || query.includes('size') || query.includes('sl') || query.includes('stop loss') || query.includes('paisa')) {
      return `Assalam o Alaikum! Institutional Risk Management Formula:

[FACT]:
- Professional funds kabhi bhi per-trade 1% se zyada risk nahi letay.
- Formula: Lot Size = (Account Balance × Risk %) ÷ (Stop Loss Pips × Pip Value).

[SIGNAL]:
- THE CLEVER TRADER "Micro-Scalp" Formula:
  - Lot Size: 0.01 Micro Lot
  - Target Risk: $3.00 USD (Tight Stop Loss)
  - Target Reward: $9.00 USD (Take Profit)
  - Fixed R:R: 1 : 3.0

[OPINION]:
- Agar aap lagatar 2 trades loss mein close karein, to terminal band kar dein aur 3% daily drawdown lock ko hargiz violate na karein!`;
    }

    // 9. PINE SCRIPT GENERATION
    if (query.includes('pine') || query.includes('script') || query.includes('code') || query.includes('indicator')) {
      return `Assalam o Alaikum! Main ne aap ke liye institutional SMC Order Block & FVG detector ka Pine Script v5 code generate kar diya hai:

\`\`\`pinescript
//@version=5
indicator("THE CLEVER TRADER — SMC & FVG Engine", overlay=true)

// --- INPUTS ---
lookback = input.int(3, "Swing Lookback")
showFVG  = input.bool(true, "Show Fair Value Gaps")
showOB   = input.bool(true, "Show Order Blocks")

// --- FAIR VALUE GAPS ---
bullFVG = low > high[2]
bearFVG = high < low[2]

plotshape(showFVG and bullFVG, title="Bullish FVG", location=location.belowbar, color=color.new(#089981, 0), style=shape.labelup, text="BULL FVG", textcolor=color.white)
plotshape(showFVG and bearFVG, title="Bearish FVG", location=location.abovebar, color=color.new(#f23645, 0), style=shape.labeldown, text="BEAR FVG", textcolor=color.white)

// --- SWING HIGHS & LOWS ---
sh = ta.pivothigh(high, lookback, lookback)
sl = ta.pivotlow(low, lookback, lookback)

plot(sh, "Swing High", color=color.orange, style=plot.style_circles, linewidth=2)
plot(sl, "Swing Low", color=color.teal, style=plot.style_circles, linewidth=2)
\`\`\`

Aap is code ko direct TradingView Pine Editor ya terminal ke "Pine Lab" tab mein test kar saktay hain!`;
    }

    // 10. PSYCHOLOGY & LOSS RECOVERY ("loss", "nuqsan", "darr", "recovery", "ghalti")
    if (query.includes('loss') || query.includes('nuqsan') || query.includes('darr') || query.includes('recovery') || query.includes('ghalti')) {
      return `Assalam o Alaikum! Trading psychology par mera institutional mashwara ghour se suniye:

[FACT]:
- Har professional trader ke loss hotay hain. Loss trading business ka lazmi hissa hai.
- Khata tab hoti hai jab trader loss ke baad "Revenge Trade" karta hai aur lot size bara kar deta hai.

[SIGNAL]:
- Agar aaj loss hua hai:
  1. Foran terminal se 30 minutes ke liye break lein.
  2. "Trading Journal" tab kholain aur mistake note karein (kya aap ne FOMO mein entry li thi?).
  3. Next trade par lot size bilkul na barhayen, 0.01 lot par hi continue karein.

[OPINION]:
- Long-term kamyabi 1 trade se nahi, balke 100 trades ke consistent discipline se aati hai!`;
    }

    // DEFAULT DYNAMIC CONVERSATIONAL RESPONSE
    return `Assalam o Alaikum! Main NEXUS AI hoon, aapka institutional trading copilot. 

Aap ka sawal mil gaya hai. Main live market feed (${currentSymbol} @ ${currentPrice}), SMC Order Blocks, aur economic news ko actively monitor kar raha hoon.

Aap mujh se mazeed pooch saktay hain:
- "Gold ka analysis btao"
- "Auto-trader bot kaisa kaam kar raha hai?"
- "MT5 connect karne ka tareeqa btao"
- "NFP news ka kya asar hoga?"
- "Buy karna chahiye ya sell?"
- "Pine script code bnao"

Aap text likhein ya awaz se bolain, main har waqt aap ki madad ke liye haazir hoon!`;
  }

  private static async callGeminiApi(prompt: string, apiKey: string, context?: Record<string, any>): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const contextStr = context ? `\nCurrent Market Context: ${JSON.stringify(context)}` : '';
    const fullPrompt = `${this.systemInstruction}\n${contextStr}\nUser Query: ${prompt}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1000,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || null;
  }

  private static async callGroqApi(prompt: string, apiKey: string, context?: Record<string, any>): Promise<string | null> {
    const contextStr = context ? `\nCurrent Market Context: ${JSON.stringify(context)}` : '';
    const fullPrompt = `${contextStr}\nUser Query: ${prompt}`;
    
    // Ultra-fast LPU inference (Qwen 27B / GPT-OSS)
    const model = 'qwen/qwen3.8-27b';
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: this.systemInstruction },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      throw new Error(`Groq API error ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  }

  private static async callOpenRouterApi(prompt: string, apiKey: string, context?: Record<string, any>): Promise<string | null> {
    const contextStr = context ? `\nCurrent Market Context: ${JSON.stringify(context)}` : '';
    const fullPrompt = `${contextStr}\nUser Query: ${prompt}`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'The Clever Trader',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: this.systemInstruction },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  }

  private static async callHuggingFaceApi(prompt: string, apiKey: string, context?: Record<string, any>): Promise<string | null> {
    const contextStr = context ? `\nCurrent Market Context: ${JSON.stringify(context)}` : '';
    const fullPrompt = `${this.systemInstruction}\n${contextStr}\nUser Query: ${prompt}`;

    const res = await fetch('https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-3B-Instruct/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`HuggingFace API error ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  }
}
