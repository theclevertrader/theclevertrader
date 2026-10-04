'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';

export interface LiveSignalRTick {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  high: number;
  low: number;
  spread: number;
  dayDiffPercent: number;
  direction: string;
  timestamp: string;
}

export function useBiquoteSignalR(symbols: string[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD', 'USDJPY', 'US30', 'US500']) {
  const [ticks, setTicks] = useState<Record<string, LiveSignalRTick>>({});
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'LIVE_CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // Extract complex expression to a stable key for the dependency array
  const symbolsKey = useMemo(() => symbols.join(','), [symbols]);

  useEffect(() => {
    let isMounted = true;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('https://biquote.io/hubs/tick', {
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => {
      console.log('Biquote: reconnecting...');
      if (isMounted) setConnectionStatus('RECONNECTING');
    });

    connection.onreconnected(() => {
      console.log('Biquote: LIVE_CONNECTED');
      if (isMounted) {
        setConnectionStatus('LIVE_CONNECTED');
        void resubscribe();
      }
    });

    connection.onclose((error) => {
      console.error('Biquote: connection closed', error);
      if (isMounted) setConnectionStatus('DISCONNECTED');
    });

    connection.on('ReceiveTick', (tick: any) => {
      if (!isMounted || !tick?.symbol) return;

      const parsed: LiveSignalRTick = {
        symbol: tick.symbol,
        bid: Number(tick.bid || 0),
        ask: Number(tick.ask || 0),
        mid: Number(tick.mid || tick.bid || 0),
        high: Number(tick.high || 0),
        low: Number(tick.low || 0),
        spread: Number(tick.spread || 0),
        dayDiffPercent: Number(tick.dayDiffPercent || 0),
        direction: tick.direction || 'NEUTRAL',
        timestamp: tick.timestamp || new Date().toISOString(),
      };

      setTicks(prev => ({
        ...prev,
        [tick.symbol]: parsed,
      }));
    });

    async function resubscribe() {
      if (connection.state === signalR.HubConnectionState.Connected && symbols.length > 0) {
        try {
          await connection.invoke('Subscribe', symbols);
        } catch (err) {
          console.error('Biquote SignalR subscribe error:', err);
        }
      }
    }

    async function startConnection() {
      try {
        await connection.start();
        if (isMounted) {
          console.log('Biquote: LIVE_CONNECTED');
          setConnectionStatus('LIVE_CONNECTED');
          await resubscribe();
        }
      } catch (err) {
        console.error('Biquote SignalR start error:', err);
        if (isMounted) setConnectionStatus('DISCONNECTED');
      }
    }

    void startConnection();

    return () => {
      isMounted = false;
      if (connection) {
        void connection.stop();
      }
    };
  }, [symbolsKey]);

  return { ticks, connectionStatus };
}
