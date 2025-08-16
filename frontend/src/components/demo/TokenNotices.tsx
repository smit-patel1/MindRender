import React from "react";
import { AlertTriangle } from "lucide-react";
import { TOKEN_LIMIT } from "../../constants";

interface TokenNoticesProps {
  isDeveloper: boolean;
  isTokenLimitReached: boolean;
  tokenUsage: number;
  tokensRemaining: number;
}

const TokenNotices = React.memo(
  ({ isDeveloper, isTokenLimitReached, tokenUsage, tokensRemaining }: TokenNoticesProps) => (
    <>
      {!isDeveloper && isTokenLimitReached && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          <div className="flex items-center space-x-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <div className="text-red-400 font-medium text-xs">Token Limit</div>
          </div>
          <div className="text-red-300 text-xs">
            Used {tokenUsage}/{TOKEN_LIMIT} tokens.
          </div>
        </div>
      )}

      {!isDeveloper && !isTokenLimitReached && tokenUsage > TOKEN_LIMIT * 0.8 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
          <div className="flex items-center space-x-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <div className="text-yellow-400 font-medium text-xs">Warning</div>
          </div>
          <div className="text-yellow-300 text-xs">{tokensRemaining} tokens left.</div>
        </div>
      )}
    </>
  )
);

export default TokenNotices;
