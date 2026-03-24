import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Gift, Wifi, ShoppingBag, Coffee, ChevronRight, CheckCircle2 } from 'lucide-react';
import { UserData } from '../types';

interface RewardsProps {
  userData: UserData;
  onClose: () => void;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

const REWARD_ITEMS = [
  {
    id: 'data_1gb',
    title: '1GB Internet Data',
    description: 'Stay connected with 1GB of mobile data.',
    pointsCost: 500,
    icon: Wifi,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  {
    id: 'provisions_pack',
    title: 'Provisions Pack',
    description: 'A small pack of daily essentials.',
    pointsCost: 1000,
    icon: ShoppingBag,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20'
  },
  {
    id: 'coffee_voucher',
    title: 'Coffee Voucher',
    description: 'Redeemable at participating cafes.',
    pointsCost: 500,
    icon: Coffee,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20'
  }
];

// 1 point = $0.01 (100 points = $1.00)
const DOLLARS_PER_POINT = 0.01;
const MIN_REDEMPTION_DOLLARS = 5.00;
const MIN_REDEMPTION_POINTS = MIN_REDEMPTION_DOLLARS / DOLLARS_PER_POINT;

export function Rewards({ userData, onClose, onUpdateUserData }: RewardsProps) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const points = userData.points || 0;
  const dollarValue = (points * DOLLARS_PER_POINT).toFixed(2);
  const progressToMin = Math.min((points / MIN_REDEMPTION_POINTS) * 100, 100);

  const handleRedeem = (item: typeof REWARD_ITEMS[0]) => {
    if (points >= item.pointsCost && points >= MIN_REDEMPTION_POINTS) {
      setRedeemingId(item.id);
      
      // Simulate API call
      setTimeout(() => {
        onUpdateUserData({ points: points - item.pointsCost });
        setSuccessMessage(`Successfully redeemed ${item.title}! We will contact you with details.`);
        setRedeemingId(null);
        
        setTimeout(() => setSuccessMessage(null), 4000);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full bg-zinc-950"
      >
        <header className="p-6 flex items-center justify-between border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Royalty Rewards</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {/* Points Balance Card */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-[2rem] mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-2">Your Streak Points</p>
            <div className="flex items-end gap-3 mb-6">
              <h3 className="text-5xl font-bold text-white tracking-tighter">{points}</h3>
              <p className="text-amber-500 font-bold mb-1">≈ ${dollarValue}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-500">Progress to Minimum Redemption ($5)</span>
                <span className="text-zinc-300">{Math.round(progressToMin)}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressToMin}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 text-right">
                {points < MIN_REDEMPTION_POINTS 
                  ? `${MIN_REDEMPTION_POINTS - points} points away` 
                  : 'Eligible for redemption!'}
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-8 flex gap-3 items-start">
            <Gift className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-500/90 font-medium leading-relaxed">
                Maintain your daily streak to earn points! 100 days streak point is equivalent to $1.00. 
                A 1-year streak rewards you with bonus points.
              </p>
            </div>
          </div>

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl mb-8 flex gap-3 items-center"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-500 font-medium">{successMessage}</p>
            </motion.div>
          )}

          <h3 className="text-lg font-bold text-white mb-4">Redeem Rewards</h3>
          
          <div className="space-y-4">
            {REWARD_ITEMS.map(item => {
              const canAfford = points >= item.pointsCost;
              const isEligible = points >= MIN_REDEMPTION_POINTS;
              const canRedeem = canAfford && isEligible;
              const isRedeeming = redeemingId === item.id;

              return (
                <div 
                  key={item.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    canRedeem 
                      ? 'bg-zinc-900/80 border-zinc-800 hover:border-amber-500/30' 
                      : 'bg-zinc-900/30 border-zinc-800/50 opacity-75'
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.border} border flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-200">{item.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-500">{item.pointsCost} pts</p>
                      <p className="text-[10px] text-zinc-500">≈ ${(item.pointsCost * DOLLARS_PER_POINT).toFixed(2)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canRedeem || isRedeeming}
                    className={`w-full mt-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      isRedeeming
                        ? 'bg-amber-500/50 text-black cursor-wait'
                        : canRedeem
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? (
                      'Processing...'
                    ) : !isEligible ? (
                      `Requires ${MIN_REDEMPTION_POINTS} pts min`
                    ) : !canAfford ? (
                      'Not enough points'
                    ) : (
                      <>
                        Redeem Now <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
