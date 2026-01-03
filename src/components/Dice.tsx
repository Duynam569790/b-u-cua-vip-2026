import { cn } from "@/lib/utils";

const symbols = {
  bau: { emoji: "🍐", name: "Bầu", color: "from-green-400 to-green-600" },
  cua: { emoji: "🦀", name: "Cua", color: "from-red-400 to-red-600" },
  ca: { emoji: "🐟", name: "Cá", color: "from-blue-400 to-blue-600" },
  ga: { emoji: "🐓", name: "Gà", color: "from-yellow-400 to-yellow-600" },
  tom: { emoji: "🦐", name: "Tôm", color: "from-orange-400 to-orange-600" },
  nai: { emoji: "🦌", name: "Nai", color: "from-amber-600 to-amber-800" },
};

export type SymbolType = keyof typeof symbols;

interface DiceProps {
  result: SymbolType;
  isRolling: boolean;
  index: number;
}

export const Dice = ({ result, isRolling, index }: DiceProps) => {
  const symbol = symbols[result];

  return (
    <div
      className={cn(
        "w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br shadow-2xl flex items-center justify-center text-4xl md:text-6xl border-4 border-white/30 transition-all duration-300",
        symbol.color,
        isRolling && "animate-bounce"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        transform: isRolling ? `rotate(${Math.random() * 360}deg)` : "rotate(0deg)",
      }}
    >
      <span className={cn("drop-shadow-lg", isRolling && "animate-spin")}>
        {symbol.emoji}
      </span>
    </div>
  );
};

export { symbols };
