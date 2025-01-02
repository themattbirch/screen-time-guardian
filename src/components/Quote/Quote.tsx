// /src/components/Quote/Quote.tsx

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Quote as QuoteType } from '../../types/app';

interface QuoteProps {
  changeInterval: number;
  category?: string; 
  onFavorite?: (quote: QuoteType) => void;
  forceChange?: number;
}

const defaultQuotes: QuoteType[] = [
  // ... your quotes
];

export function Quote({ changeInterval, category = 'all', onFavorite, forceChange = 0 }: QuoteProps) {
  const [currentQuote, setCurrentQuote] = useState<QuoteType>(defaultQuotes[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle forced changes (e.g., when timer completes)
  useEffect(() => {
    if (forceChange > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        const filteredQuotes = category === 'all' ? defaultQuotes : defaultQuotes.filter(q => q.category === category);
        let newQuote = currentQuote;
        while (newQuote.id === currentQuote.id && filteredQuotes.length > 1) {
          newQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
        }
        setCurrentQuote(newQuote);
        setIsTransitioning(false);
      }, 500);
    }
  }, [forceChange, category]);

  return (
    <div className="relative quote-area bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center transition-opacity duration-500">
      <div
        className={`transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <p className="italic text-gray-800 dark:text-gray-200 text-lg">
          "{currentQuote.text}"
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          — {currentQuote.author}
        </p>
      </div>
      {onFavorite && (
        <button
          onClick={() => onFavorite(currentQuote)}
          className={`absolute -right-4 top-4 p-2 rounded-full transition-colors ${
            currentQuote.isFavorite 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-400 hover:text-gray-500'
          } focus:outline-none`}
          aria-label={currentQuote.isFavorite ? "Unfavorite Quote" : "Favorite Quote"}
        >
          <Heart className="w-4 h-4" fill={currentQuote.isFavorite ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}
