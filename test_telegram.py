import sys
import requests

def send_test_alert(token: str, chat_id: str):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    text = (
        "🚀 *THE CLEVER TRADER — TELEGRAM VIP RADAR ACTIVE*\n\n"
        "✅ *Connection Status:* 100% Online & Linked\n"
        "⚡ *Engine:* Modal.com 24/7 Serverless Cloud Sentinel\n"
        "🎯 *Filters Active:* 4-Filter Institutional Confluence\n"
        "• BestOrderFlow 300% Stacked Imbalances\n"
        "• SMC Asian/London Liquidity Sweeps\n"
        "• MBO Iceberg Absorptions\n"
        "• Tight Risk/Reward: 1:2 & 1:4 R:R\n\n"
        "📱 *You will now receive high-probability setups directly to your phone!*"
    )
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    try:
        res = requests.post(url, json=payload, timeout=6)
        if res.status_code == 200:
            print("[SUCCESS] Test alert sent successfully via Direct Telegram API!")
            return True
        else:
            print(f"[!] Direct API returned status {res.status_code}. Trying Modal Cloud Relay...")
    except Exception as e:
        print(f"[!] Direct connection throttled/blocked ({e}). Trying Modal Cloud Relay...")

    # Modal Cloud Relay Fallback (Bypasses Pakistani ISP DNS/SNI Throttling)
    relay_url = "https://shafaan2000--clever-trader-cloud-sentinel-relay-telegram-alert.modal.run"
    try:
        relay_payload = {
            "token": token,
            "chatId": chat_id,
            "text": text,
            "parseMode": "Markdown"
        }
        res_relay = requests.post(relay_url, json=relay_payload, timeout=8)
        if res_relay.status_code == 200:
            print("[SUCCESS] Test alert sent successfully via Modal US/EU Cloud Relay!")
            return True
        else:
            print(f"[FAILED] Modal Relay error: {res_relay.text}")
            return False
    except Exception as err:
        print(f"[ERROR] Both Direct and Modal Relay failed: {err}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_telegram.py <BOT_TOKEN> <CHAT_ID>")
        sys.exit(1)
    
    token = sys.argv[1].strip()
    chat_id = sys.argv[2].strip()
    send_test_alert(token, chat_id)
