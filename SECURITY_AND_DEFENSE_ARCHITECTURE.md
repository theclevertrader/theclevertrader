# THE CLEVER TRADER — 7-TIER INSTITUTIONAL CYBERSECURITY ARCHITECTURE

## Bank-Grade Defense, Anti-Intrusion, Rate Limiting & Secret Isolation Framework

---

### 1. Security Architecture Matrix (7 Defensive Rings)

```text
[ EXTERNAL THREATS / ATTACKERS / WEB SCRAPERS / HACKERS ]
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 1: CLOUDFLARE ZERO-TRUST EDGE & DDOS SHIELD             │
│ • End-to-end TLS 1.3 encryption                              │
│ • Masked server IP (Zero port-forwarding on local router)    │
│ • Edge bot filter & DDoS mitigation                          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 2: NEXT.JS EDGE MIDDLEWARE FIREWALL (src/middleware.ts) │
│ • Token-Bucket Sliding Window Rate Limiting (IP-based)       │
│ • Path traversal defense (../, /etc/passwd, win.ini blocked) │
│ • SQL / NoSQL / XSS injection pattern sanitizer              │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 3: OWASP HTTP SECURITY HEADERS (next.config.mjs)        │
│ • X-Frame-Options: DENY (Anti-Clickjacking)                  │
│ • X-Content-Type-Options: nosniff (Anti-MIME Sniffing)       │
│ • HSTS: max-age=63072000 (Forces HTTPS)                      │
│ • Strict Referrer & Permissions Policy                       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 4: CRYPTOGRAPHIC TIMING-SAFE WEBHOOK AUTHENTICATION     │
│ • crypto.timingSafeEqual buffer evaluation                   │
│ • Anti-Timing Attack protection on secret validation         │
│ • Multi-source token check (Headers, Bearer, JSON body)      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 5: GITLEAKS CI/CD & CREDENTIAL SECRECY (.gitignore)     │
│ • Automated Gitleaks scanning in GitHub Actions              │
│ • Total isolation of .env.local, API keys & MT5 tokens       │
│ • Zero plaintext credential exposure in source code          │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 6: HIGH-IMPACT NEWS SHIELD CIRCUIT BREAKER              │
│ • Auto-detects Red Folder macroeconomic releases (CPI, NFP)  │
│ • Freezes new order transmission 15 min before/after news    │
│ • Eliminates catastrophic broker slippage & spread widening  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ RING 7: 3% DAILY DRAWDOWN HARD-STOP & KELLY LOT SIZING       │
│ • Hard 3% daily account drawdown circuit breaker             │
│ • Quarter-Kelly formula limits risk strictly to 1% per setup │
│ • Monotonic Trailing Stop Loss ratchets profit forward       │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
                   [ EXNESS MT5 REAL BROKER ]
```

---

### 2. Deep Dive Into Each Defensive Layer

#### Ring 1: Cloudflare Zero-Trust Edge Tunneling

- **Attack Prevented:** Port scanning, direct IP DDoS, eavesdropping, and man-in-the-middle (MITM) attacks.
- **Mechanism:** Rather than exposing local ports (port 3000) or opening router firewall ports, traffic is piped via a secured outbound WebSocket tunnel to Cloudflare's edge network. External systems (like TradingView alerts) interact exclusively with Cloudflare's TLS 1.3 secured gateway.

#### Ring 2: Edge Rate Limiter & Injection Firewall (`src/middleware.ts`)

- **Attack Prevented:** Brute-force guessing, denial-of-service floods, directory traversal, and script injection.
- **Mechanism:** Every incoming request to `/api/*` is evaluated by an Edge sliding window rate limiter:
  - **Trade execution & webhooks:** Maximum 40 requests per minute per IP.
  - **Market data polling:** Maximum 180 requests per minute per IP.
  - Exceeding requests immediately receive HTTP `429 Too Many Requests` with a `Retry-After` header.
  - Any URL parameter containing dangerous strings (`/etc/passwd`, `win.ini`, `<script`, `union select`, `eval(`) is rejected with HTTP `403 Forbidden`.

#### Ring 3: OWASP HTTP Security Headers (`next.config.mjs`)

- **Attack Prevented:** Clickjacking, MIME-type sniffing, cross-site scripting (XSS), and SSL stripping.
- **Configured Headers:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

#### Ring 4: Cryptographic Constant-Time Signature Authentication

- **Attack Prevented:** Timing attacks against webhook secrets.
- **Mechanism:** Standard string comparisons (`strA === strB`) take variable time depending on how many characters match, allowing attackers to measure microsecond delays and infer secrets. We utilize Node.js `crypto.timingSafeEqual` with matching buffer length validation, ensuring uniform execution time regardless of input.

#### Ring 5: GitHub Actions Gitleaks & Secret Scanning (`.github/workflows/security.yml`)

- **Attack Prevented:** Accidental credential leaks to GitHub repositories.
- **Mechanism:** Every git push or pull request automatically triggers **Gitleaks** to scan commit histories for exposed private keys, Telegram tokens, or broker passwords. Simultaneously, `.gitignore` locks all environment files and binary artifacts.

#### Ring 6: Algorithmic News Shield Engine

- **Attack Prevented:** Black swan volatility, broker slippage, and spread widening during macroeconomic news releases.
- **Mechanism:** Automatically queries macroeconomic schedules. If high-impact (Red Folder) events like US CPI or Non-Farm Payrolls are scheduled within 15 minutes, the engine locks execution and logs status in telemetry.

#### Ring 7: Prop-Firm & Hedge-Fund Grade Drawdown Circuit Breakers

- **Attack Prevented:** Algorithmic runaway losses, margin calls, and geometric capital depletion.
- **Mechanism:** Daily loss is tracked in real time against account balance. If aggregate drawdown reaches **3.0%**, the system trips a hardware circuit breaker that halts trading until the next daily session.

---

### 3. Verification & Compliance Checklist

- [x] OWASP Top 10 Compliance: Active in Edge Middleware & Config
- [x] Automated Secret Scanning: Integrated via `.github/workflows/security.yml`
- [x] Zero Hardcoded Secrets in Source Code: Confirmed
- [x] Dynamic Path Resolution (Zero User Hardcoding): Verified
- [x] Timing-Safe Webhook Comparison: Verified
- [x] Rate Limiting: 40/min Trade, 180/min Data
