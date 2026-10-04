//+------------------------------------------------------------------+
//|                                        CleverTraderBridge.mq5     |
//|                        THE CLEVER TRADER AI HEDGE FUND TERMINAL   |
//|                                      http://localhost:3000        |
//+------------------------------------------------------------------+
#property copyright "THE CLEVER TRADER"
#property link      "http://localhost:3000"
#property version   "2.00"
#property description "Autonomous MQL5 EA Bridge connecting MetaTrader 5 to The Clever Trader AI hedge fund terminal."
#property strict

#include <Trade\Trade.mqh>
CTrade trade;

//--- inputs
input group "=== Clever Trader Terminal Connection ==="
input string BridgeUrl       = "http://localhost:3000/api/mt5"; // Dashboard API URL
input int    PollIntervalMs  = 1000;                            // Polling frequency in milliseconds
input ulong  MagicNumber     = 778899;                          // Unique Magic Number for AI Bot
input double DefaultSlippage = 20;                              // Slippage tolerance in points

// Helper to extract JSON string value
string ExtractJsonString(string json, string key)
{
   string needle = "\"" + key + "\":\"";
   int start = StringFind(json, needle);
   if(start < 0) return "";
   start += StringLen(needle);
   int end = StringFind(json, "\"", start);
   if(end < 0) return "";
   return StringSubstr(json, start, end - start);
}

// Helper to extract JSON number value
double ExtractJsonNumber(string json, string key)
{
   string needle = "\"" + key + "\":";
   int start = StringFind(json, needle);
   if(start < 0) return 0.0;
   start += StringLen(needle);
   if(StringSubstr(json, start, 1) == "\"") start++;
   int end = start;
   while(end < StringLen(json))
   {
      ushort ch = StringGetCharacter(json, end);
      if(ch == ',' || ch == '}' || ch == ']' || ch == ' ' || ch == '"') break;
      end++;
   }
   return StringToDouble(StringSubstr(json, start, end - start));
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints((ulong)DefaultSlippage);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   Print("=================================================================");
   Print("   THE CLEVER TRADER — EXPERT ADVISOR LOADED SUCCESSFULLY       ");
   Print("   Listening for autonomous trade orders from: ", BridgeUrl);
   Print("=================================================================");

   // Send initial heartbeat to terminal
   char post[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   string payload = StringFormat("{\"action\":\"heartbeat\",\"login\":\"%d\",\"server\":\"%s\",\"balance\":%.2f,\"equity\":%.2f}", 
                                 AccountInfoInteger(ACCOUNT_LOGIN), AccountInfoString(ACCOUNT_SERVER), 
                                 AccountInfoDouble(ACCOUNT_BALANCE), AccountInfoDouble(ACCOUNT_EQUITY));
   StringToCharArray(payload, post, 0, StringLen(payload));
   ResetLastError();
   WebRequest("POST", BridgeUrl, headers, 2000, post, result, headers);

   // Start polling timer
   EventSetMillisecondTimer(PollIntervalMs);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("[CLEVER TRADER] Expert Advisor bridge stopped.");
}

//+------------------------------------------------------------------+
//| Expert timer function (poller)                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   char post[];
   char result[];
   string headers = "Content-Type: application/json\r\n";
   string url = BridgeUrl + "?action=get_orders";
   
   ResetLastError();
   int res = WebRequest("GET", url, headers, 1500, post, result, headers);
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      if(StringFind(response, "\"orders\":[") >= 0 && StringFind(response, "\"action\"") >= 0)
      {
         string action = ExtractJsonString(response, "action");
         string symbol = ExtractJsonString(response, "symbol");
         string orderId = ExtractJsonString(response, "id");
         double lot = ExtractJsonNumber(response, "lot");
         double sl = ExtractJsonNumber(response, "stopLoss");
         double tp = ExtractJsonNumber(response, "takeProfit");

         if(symbol == "") symbol = _Symbol;
         if(lot <= 0) lot = 0.01;

         PrintFormat("[CLEVER TRADER] Executing: %s %.2f on %s | SL: %.2f | TP: %.2f", action, lot, symbol, sl, tp);

         bool success = false;
         if(action == "BUY")
         {
            double price = SymbolInfoDouble(symbol, SYMBOL_ASK);
            success = trade.Buy(lot, symbol, price, sl, tp, "Clever Trader AI");
         }
         else if(action == "SELL")
         {
            double price = SymbolInfoDouble(symbol, SYMBOL_BID);
            success = trade.Sell(lot, symbol, price, sl, tp, "Clever Trader AI");
         }

         if(success)
         {
            PrintFormat("[CLEVER TRADER] Order executed successfully! Ticket: %d", trade.ResultOrder());
            string ackUrl = BridgeUrl;
            string ackBody = StringFormat("{\"action\":\"order_filled\",\"id\":\"%s\",\"ticket\":%d}", orderId, trade.ResultOrder());
            char ackPost[];
            StringToCharArray(ackBody, ackPost, 0, StringLen(ackBody));
            WebRequest("POST", ackUrl, headers, 2000, ackPost, result, headers);
         }
         else
         {
            PrintFormat("[CLEVER TRADER] Execution failed. Retcode: %d, Description: %s", trade.ResultRetcode(), trade.ResultRetcodeDescription());
         }
      }
   }
}
