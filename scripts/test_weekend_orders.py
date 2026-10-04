import MetaTrader5 as mt5

if not mt5.initialize():
    print("MT5 init failed")
    exit(1)

for symbol in ["USDJPY", "EURUSD", "XAUUSD", "BTCUSD"]:
    tick = mt5.symbol_info_tick(symbol)
    sym_info = mt5.symbol_info(symbol)
    if not tick or not sym_info:
        continue
    
    req = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": 0.01,
        "type": mt5.ORDER_TYPE_BUY,
        "price": tick.ask,
        "deviation": 50,
        "magic": 999999,
        "comment": "Weekend Test",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    res = mt5.order_send(req)
    if res:
        print(f"Symbol {symbol}: retcode={res.retcode}, comment='{res.comment}'")
    else:
        print(f"Symbol {symbol}: order_send returned None, error={mt5.last_error()}")

mt5.shutdown()
