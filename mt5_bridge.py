# =====================================================================
# THE CLEVER TRADER — OFFICIAL METATRADER 5 (MT5) HIGH-SPEED PYTHON BRIDGE
# Real-Time Forex & Gold Live Prices, Account Sync & Instant Order Gateway
# =====================================================================

import os
import time
import sys

# Configure UTF-8 encoding for Windows CMD/PowerShell consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import http.server
import socketserver
import threading
import urllib.parse
import json

try:
    import requests
except ImportError:
    print("[!] 'requests' library not found. Installing: pip install requests")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

try:
    import MetaTrader5 as mt5
except ImportError:
    print("[!] 'MetaTrader5' library not found. Installing: pip install MetaTrader5")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "MetaTrader5"])
    import MetaTrader5 as mt5

TERMINAL_URL = "http://localhost:3000/api/mt5"
http_session = requests.Session()

SYMBOLS_TO_TRACK = [
    'XAUUSD', 'BTCUSD', 'EURUSD', 'NAS100', 'USTEC',
    'GBPUSD', 'USDJPY', 'US30', 'DJ30', 'WALLSTREET',
    'AUDUSD', 'USDCAD', 'USOIL', 'DXY'
]

SYMBOL_ALIASES = {
    'NAS100': ['USTEC', 'USTEC_x100', 'US100', 'NAS100', 'NQ', 'NAS100.cash', 'US100Cash'],
    'US30': ['US30', 'DJ30', 'WALLSTREET', 'WS30', 'US30Cash', 'YM', 'DJI', 'US30.cash'],
    'XAUUSD': ['XAUUSD', 'XAUUSD247', 'GOLD', 'XAUUSD.m', 'XAUUSDm'],
    'BTCUSD': ['BTCUSD', 'BTCUSDT', 'BTCUSDm', 'BTCUSD.m'],
    'EURUSD': ['EURUSD', 'EURUSDm', 'EURUSD.ecn', 'EURUSD_i'],
    'GBPUSD': ['GBPUSD', 'GBPUSDm', 'GBPUSD.ecn', 'GBPUSD_i'],
    'USDJPY': ['USDJPY', 'USDJPYm', 'USDJPY.ecn', 'USDJPY_i'],
    'USOIL': ['USOIL', 'USOILm', 'USOIL.cash', 'WTI', 'OIL', 'CRUDE'],
    'DXY': ['DXY', 'DXYm', 'USDX', 'USDXOF'],
}

RESOLVED_CACHE = {}

def resolve_broker_symbol(symbol):
    if not symbol:
        return 'XAUUSD'
    if symbol in RESOLVED_CACHE:
        return RESOLVED_CACHE[symbol]
    # 1. Try exact match first
    info = mt5.symbol_info(symbol)
    if info is not None:
        RESOLVED_CACHE[symbol] = symbol
        return symbol
    # 2. Try alias list
    candidates = SYMBOL_ALIASES.get(symbol.upper(), [])
    for c in candidates:
        info = mt5.symbol_info(c)
        if info is not None:
            RESOLVED_CACHE[symbol] = c
            return c
    # 3. Fuzzy search for broker suffixes (e.g., EURUSDm, XAUUSDm, etc.)
    try:
        all_syms = mt5.symbols_get()
        if all_syms:
            upper_sym = symbol.upper()
            for s in all_syms:
                if s.name.upper() == upper_sym or s.name.upper().startswith(upper_sym):
                    RESOLVED_CACHE[symbol] = s.name
                    return s.name
    except Exception:
        pass
    RESOLVED_CACHE[symbol] = symbol
    return symbol

def execute_single_order(ord):
    """
    Executes a market order, close order, or modification directly on MT5 with
    sub-millisecond execution and institutional risk normalization.
    """
    try:
        raw_sym = ord.get("symbol", "XAUUSD")
        lot = float(ord.get("lot", 0.01))
        action = str(ord.get("action", "BUY")).upper()
        sl = float(ord.get("stopLoss", 0))
        tp = float(ord.get("takeProfit", 0))
        magic = int(ord.get("magic", 778899))
        order_id = ord.get("id") or ord.get("order_id", f"ord-{int(time.time()*1000)}")

        print(f"\n[>>>] MT5 DIRECT ORDER DISPATCH:")
        print(f"      Action: {action} | Lot: {lot} | Symbol: {raw_sym} | SL: {sl} | TP: {tp}")

        # 1. Handle 1-Click Close All Positions
        if action == "CLOSE_ALL":
            all_positions = mt5.positions_get()
            pos_count = len(all_positions) if all_positions else 0
            print(f"\n[CLOSE ALL] 1-CLICK CLOSE ALL COMMAND: Closing {pos_count} active position(s)...")
            closed_count = 0
            if all_positions:
                for p in all_positions:
                    try:
                        p_sym = p.symbol
                        p_sym_info = mt5.symbol_info(p_sym)
                        p_tick = mt5.symbol_info_tick(p_sym)
                        if not p_tick or not p_sym_info:
                            continue
                        p_digits = p_sym_info.digits
                        c_type = mt5.ORDER_TYPE_SELL if p.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
                        c_price = p_tick.bid if p.type == mt5.ORDER_TYPE_BUY else p_tick.ask
                        f_mode = p_sym_info.filling_mode or 0
                        c_filling = mt5.ORDER_FILLING_IOC if (f_mode & 2) else (mt5.ORDER_FILLING_FOK if (f_mode & 1) else mt5.ORDER_FILLING_RETURN)
                        c_req = {
                            "action": mt5.TRADE_ACTION_DEAL,
                            "position": p.ticket,
                            "symbol": p_sym,
                            "volume": p.volume,
                            "type": c_type,
                            "price": round(c_price, p_digits),
                            "deviation": 50,
                            "magic": p.magic,
                            "comment": "1-Click Close All",
                            "type_time": mt5.ORDER_TIME_GTC,
                            "type_filling": c_filling,
                        }
                        res_c = mt5.order_send(c_req)
                        if res_c and res_c.retcode == mt5.TRADE_RETCODE_DONE:
                            closed_count += 1
                    except Exception as err_p:
                        print(f"[-] Error closing #{p.ticket}: {err_p}")
            return {"success": True, "action": "CLOSE_ALL", "closed": closed_count}

        broker_symbol = resolve_broker_symbol(raw_sym)
        mt5.symbol_select(broker_symbol, True)
        sym_info = mt5.symbol_info(broker_symbol)
        tick = mt5.symbol_info_tick(broker_symbol)

        if tick is None or sym_info is None:
            err = f"Symbol {raw_sym} (resolved: {broker_symbol}) tick missing or market closed"
            print(f"[-] {err}")
            return {"success": False, "error": err}

        digits = sym_info.digits
        min_vol = sym_info.volume_min or 0.01
        max_vol = sym_info.volume_max or 100.0
        vol_step = sym_info.volume_step or 0.01

        exec_lot = max(min_vol, round(round(lot / vol_step) * vol_step, 2))
        exec_lot = min(exec_lot, max_vol)

        price = round(tick.ask if action == "BUY" else tick.bid, digits)

        # 2. Handle Close Single Position
        if action == "CLOSE":
            ticket = int(ord.get("magic") or ord.get("ticket") or 0)
            pos = mt5.positions_get(ticket=ticket) if ticket > 0 else None
            if not pos:
                pos = mt5.positions_get(symbol=broker_symbol)
            if pos and len(pos) > 0:
                target_pos = pos[0]
                close_type = mt5.ORDER_TYPE_SELL if target_pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
                close_price = tick.bid if target_pos.type == mt5.ORDER_TYPE_BUY else tick.ask
                filling_mode = sym_info.filling_mode or 0
                close_filling = mt5.ORDER_FILLING_IOC if (filling_mode & 2) else (mt5.ORDER_FILLING_FOK if (filling_mode & 1) else mt5.ORDER_FILLING_RETURN)
                close_req = {
                    "action": mt5.TRADE_ACTION_DEAL,
                    "position": target_pos.ticket,
                    "symbol": target_pos.symbol,
                    "volume": target_pos.volume,
                    "type": close_type,
                    "price": round(close_price, digits),
                    "deviation": 30,
                    "magic": target_pos.magic,
                    "comment": "Clever Trader Close",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": close_filling,
                }
                res = mt5.order_send(close_req)
                if res and res.retcode == mt5.TRADE_RETCODE_DONE:
                    return {"success": True, "ticket": target_pos.ticket, "retcode": res.retcode}
                return {"success": False, "error": res.comment if res else "Close failed"}
            return {"success": False, "error": "No open position to close"}

        # 3. Handle Auto Break-Even / Trailing Stop Modify
        if action in ["MODIFY", "MODIFY_SLTP", "BREAK_EVEN", "TRAILING_STOP", "TRAILING_SL"]:
            ticket = int(ord.get("magic") or ord.get("ticket") or 0)
            pos = mt5.positions_get(ticket=ticket) if ticket > 0 else None
            if not pos:
                pos = mt5.positions_get(symbol=broker_symbol)
            if pos and len(pos) > 0:
                target_pos = pos[0]
                new_sl = float(ord.get("stopLoss", target_pos.sl))
                new_tp = float(ord.get("takeProfit", target_pos.tp))
                is_trail = "TRAIL" in action or ord.get("comment", "").startswith("Trailing")
                sl_comment = ord.get("comment") or ("Dynamic Trailing SL" if is_trail else "Auto Break-Even SL")

                mod_req = {
                    "action": mt5.TRADE_ACTION_SLTP,
                    "position": target_pos.ticket,
                    "symbol": target_pos.symbol,
                    "sl": round(new_sl, digits),
                    "tp": round(new_tp, digits),
                    "magic": target_pos.magic,
                    "comment": sl_comment
                }
                res_mod = mt5.order_send(mod_req)
                if res_mod and res_mod.retcode == mt5.TRADE_RETCODE_DONE:
                    tag = "TRAILING SL" if is_trail else "BREAK-EVEN SL"
                    print(f"[{tag} SUCCESS] Stop Loss modified on Ticket #{target_pos.ticket}! New SL: {round(new_sl, digits)}")
                    return {"success": True, "ticket": target_pos.ticket, "retcode": res_mod.retcode}
                return {"success": False, "error": res_mod.comment if res_mod else "Modify failed"}
            return {"success": False, "error": "Position for modification not found"}

        # 4. Handle 50% Partial Close
        if action in ["PARTIAL_CLOSE", "CLOSE_50"]:
            ticket = int(ord.get("magic") or ord.get("ticket") or 0)
            pos = mt5.positions_get(ticket=ticket) if ticket > 0 else None
            if not pos:
                pos = mt5.positions_get(symbol=broker_symbol)
            if pos and len(pos) > 0:
                target_pos = pos[0]
                close_type = mt5.ORDER_TYPE_SELL if target_pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
                close_price = tick.bid if target_pos.type == mt5.ORDER_TYPE_BUY else tick.ask
                req_lot = float(ord.get("lot", 0))
                p_vol = req_lot if (req_lot > 0 and req_lot < target_pos.volume) else round(target_pos.volume / 2.0, 2)
                p_vol = max(min_vol, round(round(p_vol / vol_step) * vol_step, 2))
                p_vol = min(p_vol, target_pos.volume)
                filling_mode = sym_info.filling_mode or 0
                close_filling = mt5.ORDER_FILLING_IOC if (filling_mode & 2) else (mt5.ORDER_FILLING_FOK if (filling_mode & 1) else mt5.ORDER_FILLING_RETURN)
                part_req = {
                    "action": mt5.TRADE_ACTION_DEAL,
                    "position": target_pos.ticket,
                    "symbol": target_pos.symbol,
                    "volume": p_vol,
                    "type": close_type,
                    "price": round(close_price, digits),
                    "deviation": 30,
                    "magic": target_pos.magic,
                    "comment": "AI 50% Partial Close",
                    "type_time": mt5.ORDER_TIME_GTC,
                    "type_filling": close_filling,
                }
                res_p = mt5.order_send(part_req)
                if res_p and res_p.retcode == mt5.TRADE_RETCODE_DONE:
                    rem_vol = round(target_pos.volume - p_vol, 2)
                    print(f"[PARTIAL CLOSE SUCCESS] 50% Partial Close on Ticket #{target_pos.ticket}! Closed: {p_vol} Lot | Runner Left: {rem_vol} Lot!")
                    return {"success": True, "ticket": target_pos.ticket, "closedVolume": p_vol, "runnerVolume": rem_vol}
                return {"success": False, "error": res_p.comment if res_p else "Partial close failed"}
            return {"success": False, "error": "Position for partial close not found"}

        # 5. Handle Standard BUY / SELL Market Order
        order_type = mt5.ORDER_TYPE_BUY if action == "BUY" else mt5.ORDER_TYPE_SELL
        filling_mode = sym_info.filling_mode or 0
        if filling_mode & 2:
            type_filling = mt5.ORDER_FILLING_IOC
        elif filling_mode & 1:
            type_filling = mt5.ORDER_FILLING_FOK
        else:
            type_filling = mt5.ORDER_FILLING_RETURN

        point = sym_info.point or 0.0001
        min_dist = max(10 * point, (sym_info.trade_stops_level or 0) * point)
        if action == "BUY":
            if sl >= price:
                sl = round(price - min_dist * 3, digits)
            if tp <= price and tp > 0:
                tp = round(price + min_dist * 6, digits)
        else:
            if sl <= price and sl > 0:
                sl = round(price + min_dist * 3, digits)
            if tp >= price:
                tp = round(price - min_dist * 6, digits)

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": broker_symbol,
            "volume": exec_lot,
            "type": order_type,
            "price": price,
            "sl": round(sl, digits),
            "tp": round(tp, digits),
            "deviation": 30,
            "magic": magic,
            "comment": "TradingView Alert",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": type_filling,
        }

        result = mt5.order_send(request)
        if result and result.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"[SUCCESS] Order Executed on Exness MT5! Ticket #: {result.order}")
            return {
                "success": True,
                "ticket": result.order,
                "retcode": result.retcode,
                "action": action,
                "symbol": broker_symbol,
                "lot": exec_lot,
                "price": price,
                "sl": round(sl, digits),
                "tp": round(tp, digits)
            }
        else:
            comment = result.comment if result else "Unknown MT5 error"
            retcode = result.retcode if result else "N/A"
            print(f"[-] Order execution failed: {comment} (RetCode: {retcode})")
            return {"success": False, "error": f"{comment} (RetCode: {retcode})", "retcode": retcode}
    except Exception as ex:
        print(f"[-] Critical exception during order execution: {ex}")
        return {"success": False, "error": str(ex)}

class MT5LocalRatesServer(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Silence terminal access logs to keep CLI clean

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/order':
            try:
                length = int(self.headers.get('Content-Length', 0))
                raw_data = self.rfile.read(length).decode('utf-8')
                ord_data = json.loads(raw_data)
                result = execute_single_order(ord_data)
                resp = json.dumps(result).encode('utf-8')
                self.send_response(200 if result.get('success') else 400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                try:
                    self.wfile.write(resp)
                except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                    pass
                return
            except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                return
            except Exception as e:
                resp = json.dumps({'success': False, 'error': str(e)}).encode('utf-8')
                try:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(resp)
                except Exception:
                    pass
                return

        try:
            self.send_response(404)
            self.end_headers()
        except Exception:
            pass

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path == '/rates':
                params = urllib.parse.parse_qs(parsed.query)
                raw_sym = params.get('symbol', ['XAUUSD'])[0]
                try:
                    tf_min = float(params.get('tf', ['15'])[0])
                except (ValueError, TypeError):
                    tf_min = 15.0
                try:
                    count = min(300, max(10, int(params.get('count', ['120'])[0])))
                except (ValueError, TypeError):
                    count = 120

                broker_sym = resolve_broker_symbol(raw_sym)
                mt5.symbol_select(broker_sym, True)

                # Map minutes to MT5 timeframe enum
                tf_map = {
                    1: mt5.TIMEFRAME_M1,
                    5: mt5.TIMEFRAME_M5,
                    15: mt5.TIMEFRAME_M15,
                    30: mt5.TIMEFRAME_M30,
                    60: mt5.TIMEFRAME_H1,
                    240: mt5.TIMEFRAME_H4,
                    1440: mt5.TIMEFRAME_D1
                }
                rounded_tf = 1 if tf_min <= 1 else 5 if tf_min <= 5 else 15 if tf_min <= 15 else 30 if tf_min <= 30 else 60 if tf_min <= 60 else 240 if tf_min <= 240 else 1440
                mt5_tf = tf_map.get(rounded_tf, mt5.TIMEFRAME_M15)

                rates = mt5.copy_rates_from_pos(broker_sym, mt5_tf, 0, count)
                if rates is not None and len(rates) > 0:
                    dec = 3 if 'JPY' in broker_sym else 5 if broker_sym in ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD'] else 0 if 'US30' in broker_sym else 1 if 'NAS' in broker_sym or 'BTC' in broker_sym else 2
                    candles = []
                    for r in rates:
                        candles.append({
                            'time': int(r[0] * 1000),
                            'open': round(float(r[1]), dec),
                            'high': round(float(r[2]), dec),
                            'low': round(float(r[3]), dec),
                            'close': round(float(r[4]), dec),
                            'volume': int(r[5]) if r[5] > 0 else 100
                        })
                    resp = json.dumps({'success': True, 'symbol': raw_sym, 'brokerSymbol': broker_sym, 'candles': candles}).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(resp)
                    return
                else:
                    resp = json.dumps({'success': False, 'error': 'NO_RATES_FROM_MT5', 'symbol': broker_sym}).encode('utf-8')
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(resp)
                    return

            self.send_response(404)
            self.end_headers()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass
        except Exception:
            pass

def start_local_rates_server(port=8001):
    try:
        class ReusableTCPServer(socketserver.TCPServer):
            allow_reuse_address = True
            def handle_error(self, request, client_address):
                exc_type, _, _ = sys.exc_info()
                if exc_type in (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                    return  # Normal client-side disconnect, silently ignore
                super().handle_error(request, client_address)

        server = ReusableTCPServer(('127.0.0.1', port), MT5LocalRatesServer)
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()
        print(f"[+] MT5 High-Speed Order & Rates Server listening on http://127.0.0.1:{port}")
    except Exception as e:
        print(f"[-] Could not start MT5 rates server: {e}")

def fetch_live_ticks():
    ticks = {}
    for s in SYMBOLS_TO_TRACK:
        try:
            broker_sym = resolve_broker_symbol(s)
            mt5.symbol_select(broker_sym, True)
            t = mt5.symbol_info_tick(broker_sym)
            if t and (t.bid > 0 or t.ask > 0):
                bid = t.bid if t.bid > 0 else t.ask
                ask = t.ask if t.ask > 0 else t.bid
                price = bid
                rates = mt5.copy_rates_from_pos(broker_sym, mt5.TIMEFRAME_D1, 0, 1)
                change = 0.0
                high = ask
                low = bid
                if rates is not None and len(rates) > 0:
                    open_d = rates[0][1]
                    high_d = rates[0][2]
                    low_d = rates[0][3]
                    if open_d > 0:
                        change = ((price - open_d) / open_d) * 100
                    high = max(high_d, ask)
                    low = min(low_d, bid)

                # Precision formatting based on instrument category
                if 'JPY' in s:
                    dec = 3
                elif s in ['EURUSD', 'GBPUSD']:
                    dec = 5
                elif s in ['US30', 'DJ30', 'WALLSTREET']:
                    dec = 0
                elif s in ['NAS100', 'USTEC', 'BTCUSD']:
                    dec = 1
                else:
                    dec = 2

                tick_data = {
                    'bid': bid,
                    'ask': ask,
                    'price': price,
                    'change': round(change, 2),
                    'high': round(high, dec),
                    'low': round(low, dec),
                    'time': int(time.time() * 1000)
                }
                ticks[s] = tick_data
                if broker_sym != s:
                    ticks[broker_sym] = tick_data
                # Map broker names to canonical names for dashboard
                if s == 'USTEC' or 'USTEC' in broker_sym:
                    ticks['NAS100'] = tick_data
                if s in ['DJ30', 'WALLSTREET'] or 'DJ' in broker_sym or 'WALL' in broker_sym:
                    ticks['US30'] = tick_data
        except Exception:
            pass
    return ticks

def fetch_broker_symbol_specs():
    specs = {}
    for s in SYMBOLS_TO_TRACK:
        try:
            broker_sym = resolve_broker_symbol(s)
            mt5.symbol_select(broker_sym, True)
            info = mt5.symbol_info(broker_sym)
            if info:
                digits = info.digits
                pip_size = 0.0001 if digits == 5 else (0.01 if digits == 3 else (0.1 if digits == 2 else 1.0))
                specs[s] = {
                    "symbol": s,
                    "brokerSymbol": broker_sym,
                    "priceDigits": digits,
                    "digits": digits,
                    "pipSize": pip_size,
                    "contractSize": float(info.trade_contract_size or 100000),
                    "tickValuePerLot": float(info.trade_tick_value or 10.0),
                    "pipValue": float(info.trade_tick_value or 10.0),
                    "minLot": float(info.volume_min or 0.01),
                    "maxLot": float(info.volume_max or 100.0),
                    "lotStep": float(info.volume_step or 0.01),
                    "spreadPips": round(float(info.spread or 0) * (0.1 if digits in [3, 5] else 1.0), 2),
                    "tickSize": float(info.trade_tick_size or 0.00001),
                    "stopsLevel": int(info.trade_stops_level or 0),
                    "freezeLevel": int(info.trade_freeze_level or 0),
                }
        except Exception:
            pass
    return specs

def is_terminal_process_running():
    try:
        import subprocess
        out = subprocess.check_output('tasklist /FI "IMAGENAME eq terminal64.exe" /NH', shell=True).decode('utf-8', errors='ignore')
        return 'terminal64.exe' in out
    except Exception:
        return False

def main():
    print("=" * 65)
    print("      THE CLEVER TRADER — AI AUTONOMOUS METATRADER 5 BRIDGE      ")
    print("=" * 65)

    # Wait for MetaTrader 5 GUI to be launched by user so it never gets locked in headless mode
    wait_msg_shown = False
    while not is_terminal_process_running():
        if not wait_msg_shown:
            print("[*] Waiting for MetaTrader 5 GUI to open on laptop... (Launch MT5 from Desktop/Taskbar)")
            wait_msg_shown = True
        time.sleep(2)

    init_ok = mt5.initialize()
    if not init_ok:
        init_ok = mt5.initialize(path=r"C:\Program Files\MetaTrader 5\terminal64.exe")

    if not init_ok:
        print("[-] Error: MT5 initialization failed. Make sure MetaTrader 5 is installed and running!")
        print(f"[-] MT5 Error code: {mt5.last_error()}")
        return

    account_info = mt5.account_info()
    if account_info:
        print(f"[+] MT5 CONNECTED!")
        print(f"    Account Login : {account_info.login}")
        print(f"    Server        : {account_info.server}")
        print(f"    Balance       : ${account_info.balance:.2f} USD")
        print(f"    Equity        : ${account_info.equity:.2f} USD")
        print(f"    Company       : {account_info.company}")
        
        # Start local high-speed rates & direct order HTTP server on port 8001
        start_local_rates_server(8001)
        
        # Initial ticks & dynamic broker symbol specifications
        init_ticks = fetch_live_ticks()
        init_specs = fetch_broker_symbol_specs()
        try:
            http_session.post(TERMINAL_URL, json={
                "action": "heartbeat",
                "login": str(account_info.login),
                "server": account_info.server,
                "balance": account_info.balance,
                "equity": account_info.equity,
                "freeMargin": account_info.margin_free,
                "ticks": init_ticks,
                "symbol_specs": init_specs
            }, timeout=3)
            print("[+] Synchronized successfully with Clever Trader Terminal (http://localhost:3000)!")
            print(f"[+] Loaded dynamic broker specifications for {len(init_specs)} instruments (Tick Value, Contract Size, Min/Max/Step Lot).")
        except Exception as e:
            print(f"[!] Warning: Could not reach Clever Trader terminal: {e}")

    print("\n[*] BRIDGE IS ACTIVE: Streaming Live Quotes & Listening for Instant Orders...")
    print("[*] Direct Order Endpoint: POST http://127.0.0.1:8001/order")
    print("[*] Press Ctrl+C to stop the bridge anytime.\n")

    last_disconnect_post_time = 0.0
    last_specs_sync_time = 0.0

    while True:
        try:
            # 1. Fetch pending orders from terminal polling queue as backup
            res = http_session.get(f"{TERMINAL_URL}?action=get_orders", timeout=2)
            if res.status_code == 200:
                data = res.json()
                orders = data.get("orders", [])
                for ord in orders:
                    res_exec = execute_single_order(ord)
                    order_id = ord.get("id")
                    if res_exec.get("success"):
                        try:
                            http_session.post(TERMINAL_URL, json={
                                "action": "order_filled",
                                "id": order_id,
                                "ticket": str(res_exec.get("ticket", ""))
                            }, timeout=3)
                        except Exception:
                            pass
                    else:
                        try:
                            http_session.post(TERMINAL_URL, json={
                                "action": "order_failed",
                                "id": order_id,
                                "error": res_exec.get("error", "Failed")
                            }, timeout=3)
                        except Exception:
                            pass

            # 1b. Fetch pending orders from Modal Cloud Permanent Sentinel Queue (24/7 Lifetime Webhook)
            try:
                res_cloud = http_session.get("https://shafaan2000--clever-trader-cloud-sentinel-get-cloud-orders.modal.run", timeout=2)
                if res_cloud.status_code == 200:
                    cloud_data = res_cloud.json()
                    cloud_orders = cloud_data.get("orders", [])
                    for ord in cloud_orders:
                        print(f"\n[⚡ MODAL CLOUD WEBHOOK DISPATCH]: Received {ord.get('action')} {ord.get('symbol')} from TradingView!")
                        res_exec = execute_single_order(ord)
                        order_id = ord.get("id")
                        if res_exec.get("success"):
                            try:
                                http_session.post(TERMINAL_URL, json={
                                    "action": "order_filled",
                                    "id": order_id,
                                    "ticket": str(res_exec.get("ticket", ""))
                                }, timeout=3)
                            except Exception:
                                pass
                        else:
                            try:
                                http_session.post(TERMINAL_URL, json={
                                    "action": "order_failed",
                                    "id": order_id,
                                    "error": res_exec.get("error", "Failed")
                                }, timeout=3)
                            except Exception:
                                pass
            except Exception:
                pass
        except KeyboardInterrupt:
            print("\n[*] Stopping MT5 bridge gateway...")
            break
        except Exception:
            pass

        # 2. Sync live balance, equity, margin, active positions & real ticks to Dashboard at high speed
        try:
            acc = mt5.account_info()
            term = mt5.terminal_info()

            if acc is None or term is None or not term.connected:
                disconnect_reason = "MT5 terminal software closed on laptop" if term is None else ("MT5 disconnected from trade server" if not term.connected else "MT5 account session inactive")
                now_ts = time.time()
                if now_ts - last_disconnect_post_time >= 120.0:
                    last_disconnect_post_time = now_ts
                    print(f"\n[EMERGENCY DISCONNECT WARNING]: {disconnect_reason}!")
                    print(f"    Dispatching Emergency Telegram Alert: 'MT5 disconnected, check your laptop'...")
                    try:
                        http_session.post(TERMINAL_URL, json={
                            "action": "mt5_disconnected",
                            "reason": disconnect_reason,
                        }, timeout=2)
                    except Exception:
                        pass
                time.sleep(2)
                if is_terminal_process_running():
                    mt5.initialize()
                continue

            ticks = fetch_live_ticks()
            
            # Fetch real-time open positions directly from MT5
            positions = mt5.positions_get()
            pos_list = []
            total_floating_profit = 0.0
            total_pips = 0.0

            if positions:
                for p in positions:
                    pos_type = "BUY" if p.type == 0 else "SELL"
                    digits = 2
                    pips = 0.0
                    sym_upper = p.symbol.upper()

                    if "JPY" in sym_upper:
                        digits = 3
                        diff = (p.price_current - p.price_open) if p.type == 0 else (p.price_open - p.price_current)
                        pips = round(diff * 100, 1)
                    elif "US30" in sym_upper or "DJ" in sym_upper or "WALL" in sym_upper or "WS30" in sym_upper:
                        digits = 0
                        diff = (p.price_current - p.price_open) if p.type == 0 else (p.price_open - p.price_current)
                        pips = round(diff, 1)
                    elif "NAS" in sym_upper or "USTEC" in sym_upper or "US100" in sym_upper:
                        digits = 1
                        diff = (p.price_current - p.price_open) if p.type == 0 else (p.price_open - p.price_current)
                        pips = round(diff, 1)
                    elif "BTC" in sym_upper:
                        digits = 1
                        diff = (p.price_current - p.price_open) if p.type == 0 else (p.price_open - p.price_current)
                        pips = round(diff, 1)
                    elif "XAU" in sym_upper or "GOLD" in sym_upper:
                        digits = 2
                        diff = (p.price_current - p.price_open) if p.type == 0 else (p.price_open - p.price_current)
                        pips = round(diff * 10, 1)
                    else:
                        digits = 5
                        diff = (p.price_current - p.price_open) if p.type == 0 else (p.price_open - p.price_current)
                        pips = round(diff * 10000, 1)

                    pos_list.append({
                        "ticket": p.ticket,
                        "symbol": p.symbol,
                        "type": pos_type,
                        "volume": p.volume,
                        "openPrice": round(p.price_open, digits),
                        "currentPrice": round(p.price_current, digits),
                        "sl": round(p.sl, digits),
                        "tp": round(p.tp, digits),
                        "profit": round(p.profit, 2),
                        "pips": pips,
                        "time": p.time
                    })
                    total_floating_profit += p.profit
                    total_pips += pips

            if acc:
                # Save live state to data/mt5_live_state.json for zero-latency local IPC
                try:
                    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
                    os.makedirs(data_dir, exist_ok=True)
                    sym_counts = {}
                    for p in pos_list:
                        s = p.get("symbol", "UNKNOWN")
                        sym_counts[s] = sym_counts.get(s, 0) + 1
                    breakdown_str = " | ".join([f"{s}: {c}" for s, c in sym_counts.items()]) if sym_counts else "None"
                    state_path = os.path.join(data_dir, "mt5_live_state.json")
                    with open(state_path, "w", encoding="utf-8") as f:
                        json.dump({
                            "login": str(acc.login),
                            "server": acc.server,
                            "balance": acc.balance,
                            "equity": acc.equity,
                            "freeMargin": acc.margin_free,
                            "margin": round(acc.margin, 2),
                            "floatingProfit": round(total_floating_profit, 2),
                            "openPositions": len(pos_list),
                            "breakdown": breakdown_str,
                            "positions": pos_list,
                            "ticks": ticks,
                            "timestamp": time.time()
                        }, f)
                except Exception:
                    pass

                sync_payload = {
                    "action": "heartbeat",
                    "login": str(acc.login),
                    "server": acc.server,
                    "balance": acc.balance,
                    "equity": acc.equity,
                    "freeMargin": acc.margin_free,
                    "ticks": ticks,
                    "positions": pos_list,
                    "floatingProfit": round(total_floating_profit, 2),
                    "totalPips": round(total_pips, 1)
                }

                # Periodically re-sync broker contract specs every 30 seconds
                now_t = time.time()
                if now_t - last_specs_sync_time >= 30.0:
                    last_specs_sync_time = now_t
                    sync_payload["symbol_specs"] = fetch_broker_symbol_specs()

                http_session.post(TERMINAL_URL, json=sync_payload, timeout=1.5)
        except Exception:
            pass

        time.sleep(1.0)

    mt5.shutdown()
    print("[*] MT5 Bridge shut down cleanly.")

if __name__ == "__main__":
    main()
