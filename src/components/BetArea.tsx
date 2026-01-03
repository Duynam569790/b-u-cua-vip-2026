import { cn } from "@/lib/utils";
import { SymbolType, symbols } from "./Dice";

interface BetAreaProps {
  bets: Record<SymbolType, number>;
  onBet: (symbol: SymbolType) => void;
  onRemoveBet: (symbol: SymbolType) => void;
  disabled: boolean;
  results: SymbolType[];
}

export const BetArea = ({ bets, onBet, onRemoveBet, disabled, results }: BetAreaProps) => {
  const symbolEntries = Object.entries(symbols) as [SymbolType, typeof symbols[SymbolType]][];

  const countResult = (symbol: SymbolType) => {
    return results.filter((r) => r === symbol).length;
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 p-4">
      {symbolEntries.map(([key, value]) => {
        const wins = countResult(key);
        const isWinning = wins > 0 && results.length > 0;
        
        return (
          <div
            key={key}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-300 border-4",
              "bg-gradient-to-br shadow-lg hover:shadow-xl hover:scale-105",
              value.color,
              disabled && "opacity-50 cursor-not-allowed",
              isWinning && "ring-4 ring-yellow-400 ring-offset-2 animate-pulse",
              bets[key] > 0 && "border-yellow-400"
            )}
            onClick={() => !disabled && onBet(key)}
            onContextMenu={(e) => {
              e.preventDefault();
              !disabled && onRemoveBet(key);
            }}
          >
            <span className="text-5xl md:text-6xl drop-shadow-lg">{value.emoji}</span>
            <span className="text-white font-bold text-lg drop-shadow">{value.name}</span>
            
            {bets[key] > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg">
                {bets[key]}
              </div>
            )}
            
            {isWinning && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg">
                x{wins}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
