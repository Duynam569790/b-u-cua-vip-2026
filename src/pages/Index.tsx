import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SymbolType, symbols } from "@/components/Dice";
import { Dice3D } from "@/components/Dice3D";
import { BetArea } from "@/components/BetArea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sound effects using Web Audio API
const createDiceRollSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(150 + Math.random() * 100, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

const createBounceSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(400 + Math.random() * 200, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.05);
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
};

const createWinSound = (audioContext: AudioContext) => {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);
    
    oscillator.start(audioContext.currentTime + i * 0.1);
    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
  });
};

const createLoseSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
  
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

interface GameHistory {
  id: number;
  results: SymbolType[];
  totalBet: number;
  winAmount: number;
  isWin: boolean;
  timestamp: Date;
}

const symbolKeys = Object.keys(symbols) as SymbolType[];

const getRandomSymbol = (): SymbolType => {
  return symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
};

const Index = () => {
  const [money, setMoney] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [bets, setBets] = useState<Record<SymbolType, number>>({
    bau: 0,
    cua: 0,
    ca: 0,
    ga: 0,
    tom: 0,
    nai: 0,
  });
  const [results, setResults] = useState<SymbolType[]>(["bau", "cua", "ca"]);
  const [isRolling, setIsRolling] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [history, setHistory] = useState<GameHistory[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const rollSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play rolling sounds continuously while dice are rolling
  const startRollingSounds = useCallback(() => {
    const audioContext = initAudio();
    
    // Play initial roll sound
    createDiceRollSound(audioContext);
    
    // Play bounce sounds at random intervals
    rollSoundIntervalRef.current = setInterval(() => {
      if (Math.random() > 0.3) {
        createBounceSound(audioContext);
      }
      if (Math.random() > 0.6) {
        createDiceRollSound(audioContext);
      }
    }, 100);
  }, [initAudio]);

  const stopRollingSounds = useCallback(() => {
    if (rollSoundIntervalRef.current) {
      clearInterval(rollSoundIntervalRef.current);
      rollSoundIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRollingSounds();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRollingSounds]);

  const totalBet = Object.values(bets).reduce((sum, bet) => sum + bet, 0);

  const handleBet = useCallback(
    (symbol: SymbolType) => {
      if (money < betAmount) {
        toast.error("Không đủ tiền!");
        return;
      }
      setBets((prev) => ({ ...prev, [symbol]: prev[symbol] + 1 }));
      setMoney((prev) => prev - betAmount);
    },
    [money, betAmount]
  );

  const handleRemoveBet = useCallback(
    (symbol: SymbolType) => {
      if (bets[symbol] <= 0) return;
      setBets((prev) => ({ ...prev, [symbol]: prev[symbol] - 1 }));
      setMoney((prev) => prev + betAmount);
    },
    [bets, betAmount]
  );

  const handleRoll = useCallback(() => {
    if (totalBet === 0) {
      toast.error("Hãy đặt cược trước!");
      return;
    }

    setIsRolling(true);
    setLastWin(0);
    
    // Start rolling sounds
    startRollingSounds();

    // Animation lắc xúc xắc
    const rollInterval = setInterval(() => {
      setResults([getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);
      stopRollingSounds();
      
      const finalResults: SymbolType[] = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol(),
      ];
      setResults(finalResults);
      setIsRolling(false);

      // Tính tiền thắng
      let winnings = 0;
      symbolKeys.forEach((symbol) => {
        const count = finalResults.filter((r) => r === symbol).length;
        if (count > 0 && bets[symbol] > 0) {
          winnings += bets[symbol] * betAmount * count;
        }
      });

      const betTotal = totalBet * betAmount;
      const isWin = winnings > 0;

      // Thêm vào lịch sử
      setHistory((prev) => [
        {
          id: Date.now(),
          results: finalResults,
          totalBet: betTotal,
          winAmount: winnings,
          isWin,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9), // Giữ 10 lượt gần nhất
      ]);

      // Play win/lose sound
      const audioContext = initAudio();
      if (isWin) {
        createWinSound(audioContext);
        setMoney((prev) => prev + winnings);
        setLastWin(winnings);
        toast.success(`🎉 Thắng ${winnings.toLocaleString()}đ!`);
      } else {
        createLoseSound(audioContext);
        toast.error("Chúc may mắn lần sau!");
      }

      // Reset cược
      setBets({
        bau: 0,
        cua: 0,
        ca: 0,
        ga: 0,
        tom: 0,
        nai: 0,
      });
    }, 2000);
  }, [totalBet, bets, betAmount, startRollingSounds, stopRollingSounds, initAudio]);

  const handleClearBets = () => {
    const refund = totalBet * betAmount;
    setMoney((prev) => prev + refund);
    setBets({
      bau: 0,
      cua: 0,
      ca: 0,
      ga: 0,
      tom: 0,
      nai: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-amber-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 drop-shadow-lg mb-2">
            🎲 BẦU CUA 🎲
          </h1>
          <p className="text-white/80">Lắc xúc xắc và thử vận may!</p>
        </div>

        {/* Money Display */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-6 py-3 rounded-full shadow-lg">
            <span className="text-xl md:text-2xl font-bold text-black">
              💰 {money.toLocaleString()}đ
            </span>
          </div>
          {lastWin > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 rounded-full shadow-lg animate-pulse">
              <span className="text-xl md:text-2xl font-bold text-white">
                +{lastWin.toLocaleString()}đ
              </span>
            </div>
          )}
        </div>

        {/* 3D Dice Area */}
        <div className="bg-black/30 backdrop-blur rounded-3xl p-6 mb-6">
          <Dice3D results={results} isRolling={isRolling} />
        </div>

        {/* Bet Amount Selection */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <span className="text-white self-center mr-2">Mức cược:</span>
          {[10, 50, 100, 500].map((amount) => (
            <Button
              key={amount}
              variant={betAmount === amount ? "default" : "outline"}
              onClick={() => setBetAmount(amount)}
              className={
                betAmount === amount
                  ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                  : "bg-white/10 text-white border-white/30 hover:bg-white/20"
              }
            >
              {amount}đ
            </Button>
          ))}
        </div>

        {/* Bet Area */}
        <div className="bg-black/30 backdrop-blur rounded-3xl mb-6">
          <BetArea
            bets={bets}
            onBet={handleBet}
            onRemoveBet={handleRemoveBet}
            disabled={isRolling}
            results={isRolling ? [] : results}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleRoll}
            disabled={isRolling || totalBet === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl px-8 py-6 rounded-full shadow-lg disabled:opacity-50"
          >
            {isRolling ? "🎲 Đang lắc..." : "🎲 LẮC"}
          </Button>
          
          <Button
            onClick={handleClearBets}
            disabled={isRolling || totalBet === 0}
            variant="outline"
            className="bg-white/10 text-white border-white/30 hover:bg-white/20 px-6 py-6 rounded-full"
          >
            Xóa cược
          </Button>
        </div>

        {/* Total Bet Display */}
        {totalBet > 0 && (
          <div className="text-center mt-4">
            <span className="text-white/80">
              Tổng cược: <span className="text-yellow-400 font-bold">{(totalBet * betAmount).toLocaleString()}đ</span>
            </span>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center text-white/60 text-sm">
          <p>👆 Click để đặt cược • 👆 Click phải để bỏ cược</p>
          <p className="mt-1">Thắng x1 mỗi xúc xắc trùng</p>
        </div>

        {/* History Table */}
        {history.length > 0 && (
          <div className="mt-8 bg-black/30 backdrop-blur rounded-3xl p-4">
            <h2 className="text-xl font-bold text-yellow-400 mb-4 text-center">
              📜 Lịch Sử Chơi
            </h2>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {history.map((game) => (
                  <div
                    key={game.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      game.isWin
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-red-500/20 border border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {game.results.map((result, idx) => (
                          <span key={idx} className="text-2xl">
                            {symbols[result].emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-sm">
                        Cược: {game.totalBet.toLocaleString()}đ
                      </div>
                      <div
                        className={`font-bold ${
                          game.isWin ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {game.isWin
                          ? `+${game.winAmount.toLocaleString()}đ`
                          : `-${game.totalBet.toLocaleString()}đ`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
