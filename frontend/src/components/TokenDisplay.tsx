import React from 'react';
import { TOKEN_LIMIT } from '../constants';

interface TokenDisplayProps {
  role: 'user' | 'dev';
  tokenUsage: number;
  isTokenLimitReached: boolean;
}

const TokenDisplay = React.memo(
  ({ role, tokenUsage, isTokenLimitReached }: TokenDisplayProps) => {
    if (role === 'dev') {
      return (
        <div className="rounded-lg px-3 py-1 text-sm bg-green-500/20 border border-green-500/30">
          <span className="text-green-400 font-semibold">Unlimited (dev)</span>
        </div>
      );
    }

    return (
      <div
        className={`rounded-lg px-3 py-1 text-sm ${
          isTokenLimitReached
            ? 'bg-red-500/20 border border-red-500/30'
            : tokenUsage > TOKEN_LIMIT * 0.8
            ? 'bg-yellow-500/20 border border-yellow-500/30'
            : 'bg-gray-700/50'
        }`}
      >
        <span className="text-gray-300">
          <span className="hidden sm:inline">Tokens: </span>
          <span
            className={`font-medium ${
              isTokenLimitReached
                ? 'text-red-400'
                : tokenUsage > TOKEN_LIMIT * 0.8
                ? 'text-yellow-400'
                : 'text-yellow-400'
            }`}
          >
            {tokenUsage} / {TOKEN_LIMIT}
          </span>
        </span>
      </div>
    );
  },
);

export default TokenDisplay;
