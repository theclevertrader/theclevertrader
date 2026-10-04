import MetaTrader5 as mt5

if not mt5.initialize():
    print("MT5 init failed:", mt5.last_error())
    exit(1)

print("Account:", mt5.account_info().login)
print("Balance:", mt5.account_info().balance)

symbols = ['XAUUSD', 'EURUSD', 'BTCUSD', 'USDJPY', 'GBPUSD']
for s in symbols:
    info = mt5.symbol_info(s)
    if info:
        print(f"Symbol {s}: visible={info.visible}, trade_mode={info.trade_mode}, min_vol={info.volume_min}, filling_mode={info.filling_mode}")
    else:
        # Search match
        matches = [x.name for x in (mt5.symbols_get() or []) if s in x.name]
        print(f"Symbol {s} NOT found directly. Matches: {matches}")

mt5.shutdown()
