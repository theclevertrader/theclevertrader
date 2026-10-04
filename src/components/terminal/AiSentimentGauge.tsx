'use client';

import React from 'react';
import { AiSentimentSpeedometer } from './AiSentimentSpeedometer';

interface AiSentimentGaugeProps {
  score?: number;
  label?: string;
  symbol?: string;
}

export const AiSentimentGauge: React.FC<AiSentimentGaugeProps> = ({
  symbol = 'XAUUSD',
}) => {
  return (
    <div className="w-full">
      <AiSentimentSpeedometer symbol={symbol} className="w-full" />
    </div>
  );
};
