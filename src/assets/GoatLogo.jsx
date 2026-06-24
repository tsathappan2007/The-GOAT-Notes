import React from 'react';

/**
 * GoatLogo Component
 * Renders the premium gold goat silhouette vector, matching the exact uploaded image profile.
 */
export default function GoatLogo({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={className}
    >
      <g fill="none" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer thin decorative circle */}
        <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="0.75" strokeOpacity="0.25" strokeDasharray="2 2" />
        
        {/* Refined Goat Head Silhouette & Horns matching the uploaded profile */}
        <path 
          d="
            M 35 76 
            C 33 80, 30 84, 32 88 
            C 35 90, 39 88, 41 84 
            C 43 80, 42 76, 43 72
            C 44 68, 47 65, 51 62
            C 57 58, 65 54, 72 50
            C 77 47, 79 43, 77 39
            C 75 35, 70 34, 64 37
            C 59 40, 53 43, 47 41
            C 41 39, 38 34, 33 36
            C 29 38, 28 44, 31 49
            C 34 54, 36 59, 34 64
            C 32 69, 28 72, 35 76 
            Z
          "
          fill="url(#goldGradientLogo)"
          stroke="#D4AF37"
          strokeWidth="0.75"
        />

        {/* Front Horn */}
        <path 
          d="
            M 43 33 
            C 38 23, 31 16, 20 16
            C 28 12, 37 11, 46 18
            C 52 23, 55 29, 54 39
          "
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2.5"
        />

        {/* Back Horn */}
        <path 
          d="
            M 46 34
            C 42 20, 33 10, 22 8
            C 31 5, 42 6, 51 12
            C 58 17, 60 23, 59 35
          "
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        
        {/* Eye Cutout */}
        <path 
          d="M 46 47 L 50 45 L 49 49 Z" 
          fill="#000000" 
          className="dark:fill-black fill-slate-50"
          stroke="none"
        />
      </g>
      
      <defs>
        <linearGradient id="goldGradientLogo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#AA7C11" />
          <stop offset="25%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#FDF6C7" />
          <stop offset="75%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA7C11" />
        </linearGradient>
      </defs>
    </svg>
  );
}
