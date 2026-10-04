import MetaTrader5 as mt5

if not mt5.initialize():
    print("MT5 init failed")
    exit(1)

symbol = "USDJPY"
sym_info = mt5.symbol_info(symbol)
tick = mt5.symbol_info_tick(symbol)

print("Tick:", tick)
print("sym_info digits:", sym_info.digits, "filling_mode:", sym_info.filling_mode, "trade_mode:", sym_info.trade_mode)

for filling in [mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_RETURN]:
    req = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": 0.01,
        "type": mt5.ORDER_TYPE_BUY,
        "price": tick.ask,
        "sl": round(tick.ask - 0.20, sym_info.digits),
        "tp": round(tick.ask + 0.60, sym_info.digits),
        "deviation": 30,
        "magic": 778899,
        "comment": "Test Check",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": filling,
    }
    check = mt5.order_check(req)
    if check:
        print(f"Filling {filling}: retcode={check.retcode}, comment='{check.comment}'")
    else:
        print(f"Filling {filling}: None, last_error={mt5.last_error()}")

mt5.shutdown()
