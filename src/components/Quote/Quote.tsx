// src/components/Quote/Quote.tsx

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react'; // Only Heart is available
import { Quote as QuoteType } from '../../types/app';

interface QuoteProps {
  changeInterval: number;
  category?: string;
  onFavorite?: (quote: QuoteType) => void;
  forceChange?: number;
  favoriteQuotes?: QuoteType[]; // To determine if the current quote is already favorited
}

const defaultQuotes: QuoteType[] = [
  {
    id: '1',
    text: "There are three ways to ultimate success: The first way is to be kind. The second way is to be kind. The third way is to be kind.",
    author: "Mister Rogers",
    category: "kindness",
  },
  {
    id: '2',
    text: "Success is peace of mind, which is a direct result of self-satisfaction in knowing you made the effort to become the best of which you are capable.",
    author: "John Wooden",
    category: "success",
  },
  // ... (other quotes)
  {
    id: '13',
    text: "Nothing in the world can take the place of persistence. Talent will not; nothing is more common than unsuccessful men with talent. Genius will not; unrewarded genius is almost a proverb. Education will not; the world is full of educated derelicts. The slogan 'Press On' has solved and always will solve the problems of the human race.",
    author: "Calvin Coolidge",
    category: "persistence",
  }
];

export const Quote: React.FC<QuoteProps> = ({
  changeInterval,
  category = 'all',
  onFavorite,
  forceChange = 0,
  favoriteQuotes = [],
}) => {
  const [currentQuote, setCurrentQuote] = useState<QuoteType | null>(null);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);

  useEffect(() => {
    // On mount or forceChange, pick a random quote
    const filteredQuotes = category === 'all'
      ? defaultQuotes
      : defaultQuotes.filter((q) => q.category === category);

    if (!filteredQuotes.length) {
      // No quotes match
      setCurrentQuote(null);
      setIsFavorited(false);
      return;
    }

    // Pick a random quote
    const newQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    setCurrentQuote(newQuote);

    // Check if the new quote is already favorited
    const isFav = favoriteQuotes.some((q) => q.id === newQuote.id);
    setIsFavorited(isFav);
  }, [forceChange, category, favoriteQuotes]);

  const handleFavoriteClick = () => {
    if (currentQuote && onFavorite) {
      onFavorite(currentQuote);
      setIsFavorited(true);
    }
  };

  if (!currentQuote) {
    return <div className="text-center text-gray-500 dark:text-gray-400">No quotes available.</div>;
  }

  return (
    <div className="quote-area p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
      <div className="flex flex-col items-center">
        <p className="text-lg italic text-gray-800 dark:text-gray-200">"{currentQuote.text}"</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">- {currentQuote.author}</p>
        {onFavorite && (
          <button
            onClick={handleFavoriteClick}
            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full 
              ${isFavorited 
                ? 'bg-yellow-400 text-white cursor-not-allowed' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'
              } transition-colors`}
            disabled={isFavorited}
            aria-label={isFavorited ? "Already Favorited" : "Favorite Quote"}
          >
            <Heart 
              className={`w-5 h-5 transition-transform duration-200 
                ${isFavorited ? 'text-white' : 'text-gray-800 dark:text-gray-200'}
                ${isFavorited ? 'transform scale-110' : ''}
              `}
            />
            <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
