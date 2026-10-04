import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'full', className = '' }) => {
  return (
    <div className={`w-full flex items-center justify-center select-none group ${className}`}>
      <img
        src="/clever_trader_new_logo.png"
        alt="The Clever Trader - Institutional Intelligence. Autonomous Execution."
        className="w-full h-auto object-cover rounded-lg border border-[#00ff9d22] shadow-[0_0_15px_rgba(0,255,157,0.08)] transition-all duration-200 group-hover:scale-[1.01] group-hover:border-[#00ff9d55] group-hover:shadow-[0_0_20px_rgba(0,255,157,0.18)] block"
      />
    </div>
  );
};
