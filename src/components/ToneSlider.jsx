import React from 'react';
import { Sliders, HelpCircle } from 'lucide-react';

/**
 * ToneSlider Component
 * A stylized 3-position slider for choosing the explanation tone on the Customer tab:
 * 0 = Non-technical, 1 = Balanced, 2 = Technical
 */
export default function ToneSlider({ currentTone, onChange, disabled }) {
  const tones = ['Non-technical', 'Balanced', 'Technical'];
  const currentIndex = tones.indexOf(currentTone);
  
  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (onChange && !disabled) {
      onChange(tones[val]);
    }
  };

  const handleLabelClick = (tone) => {
    if (onChange && !disabled && tone !== currentTone) {
      onChange(tone);
    }
  };

  const getToneExplanation = (tone) => {
    if (tone === 'Non-technical') return 'No jargon. Focuses purely on user value, benefits, and everyday language.';
    if (tone === 'Technical') return 'Details feature names, minor architectural aspects, and structured details.';
    return 'The sweet spot. Combines simple English with clear feature names and changes.';
  };

  return (
    <div className="flex flex-col gap-3 py-2.5 px-3">
      {/* Header and Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 text-slate-200">
          <Sliders size={14} className="text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Customer Audience Tone</span>
        </div>
        <div className="text-[10px] text-slate-400 font-medium italic sm:text-right">
          {getToneExplanation(currentTone)}
        </div>
      </div>

      {/* Slider Control */}
      <div className="relative w-full mt-2">
        {/* Track Background ticks */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-950 border border-slate-900 -translate-y-1/2 rounded-full pointer-events-none" />
        
        {/* Custom Input */}
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="1"
          value={currentIndex !== -1 ? currentIndex : 1}
          onChange={handleSliderChange}
          disabled={disabled}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-100 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-100 [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(99,102,241,0.5)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110"
        />
      </div>

      {/* Step Labels */}
      <div className="flex justify-between px-1 -mt-1 text-[10px] font-bold tracking-wide text-slate-500 uppercase select-none">
        {tones.map((t, idx) => {
          const isActive = t === currentTone;
          return (
            <button
              key={t}
              onClick={() => handleLabelClick(t)}
              disabled={disabled}
              className={`transition-colors py-1 px-1.5 rounded hover:text-slate-200 disabled:opacity-50 cursor-pointer ${
                isActive ? 'text-indigo-400 font-extrabold font-mono' : 'text-slate-500'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
