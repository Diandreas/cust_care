import React from 'react';
import { Calendar } from 'lucide-react';

export default function LiquidTest() {
  return (
    <div className="p-8 liquid-bg min-h-screen">
      <div className="liquid-glass liquid-glow liquid-float p-8 max-w-md mx-auto">
        <div className="liquid-blob"></div>
        <div className="liquid-blob"></div>
        <div className="liquid-blob"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-500/20">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">42</div>
          <div className="text-sm text-white/70">Test Card</div>
        </div>
      </div>
    </div>
  );
}