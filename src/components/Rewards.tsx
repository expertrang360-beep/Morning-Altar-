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
    color: 'text-theme-accent',
    bg: 'bg-theme-accent/10',
    border: 'border-theme-accent/20'
  },
  {
    id: 'provisions_pack',
    title: 'Provisions Pack',
    description: 'A small pack of daily essentials.',
    pointsCost: 1000,
    icon: ShoppingBag,
    color: 'text-theme-accent',
    bg: 'bg-theme-accent/10',
    border: 'border-theme-accent/20'
  },
  {
    id: 'coffee_voucher',
    title: 'Coffee Voucher',
    description: 'Redeemable at participating cafes.',
    pointsCost: 500,
    icon: Coffee,
    color: 'text-theme-accent',
    bg: 'bg-theme-accent/10',
    border: 'border-theme-accent/20'
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
    <div className="fixed inset-0 bg-theme-bg/90 backdrop-blur-sm z-[100] flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="flex-1 flex flex-col max-w-md mx-auto w-full bg-theme-bg"
      >
        <header className="p-6 flex items-center justify-between border-b border-theme-border sticky top-0 bg-theme-bg/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-theme-accent/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-theme-accent" />
            </div>
            <h2 className="text-xl font-bold text-theme-text">Royalty Rewards</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-theme-card flex items-center justify-center hover:opacity-80 transition-colors"
          >
            <X className="w-5 h-5 text-theme-muted" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pb-32">
          {/* Points Balance Card */}
          <div className="bg-gradient-to-br from-theme-card to-theme-bg border border-theme-border p-8 rounded-[2rem] mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-3xl -mr-10 -mt-10" />
            
            <p className="text-theme-muted text-sm font-medium uppercase tracking-widest mb-2">Your Streak Points</p>
            <div className="flex items-end gap-3 mb-6">
              <h3 className="text-5xl font-bold text-theme-text tracking-tighter">{points}</h3>
              <p className="text-theme-accent font-bold mb-1">≈ ${dollarValue}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-theme-muted">Progress to Minimum Redemption ($5)</span>
                <span className="text-theme-text/80">{Math.round(progressToMin)}%</span>
              </div>
              <div className="h-2 w-full bg-theme-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-theme-accent rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressToMin}%` }}
                />
              </div>
              <p className="text-[10px] text-theme-muted text-right">
                {points < MIN_REDEMPTION_POINTS 
                  ? `${MIN_REDEMPTION_POINTS - points} points away` 
                  : 'Eligible for redemption!'}
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-theme-accent/10 border border-theme-accent/20 p-4 rounded-2xl mb-8 flex gap-3 items-start">
            <Gift className="w-5 h-5 text-theme-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-theme-accent/90 font-medium leading-relaxed">
                Maintain your daily streak to earn points! 100 days streak point is equivalent to $1.00. 
                A 1-year streak rewards you with bonus points.
              </p>
            </div>
          </div>

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-8 flex gap-3 items-center"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-500 font-medium">{successMessage}</p>
            </motion.div>
          )}

          <h3 className="text-lg font-bold text-theme-text mb-4">Redeem Rewards</h3>
          
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
                      ? 'bg-theme-card/80 border-theme-border hover:border-theme-accent/30' 
                      : 'bg-theme-card/30 border-theme-border/50 opacity-75'
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.border} border flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-theme-text/90">{item.title}</h4>
                      <p className="text-xs text-theme-muted mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-theme-accent">{item.pointsCost} pts</p>
                      <p className="text-[10px] text-theme-muted">≈ ${(item.pointsCost * DOLLARS_PER_POINT).toFixed(2)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!canRedeem || isRedeeming}
                    className={`w-full mt-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      isRedeeming
                        ? 'bg-theme-accent/50 text-theme-bg cursor-wait'
                        : canRedeem
                        ? 'bg-theme-card text-theme-text hover:opacity-80'
                        : 'bg-theme-card/50 text-theme-muted cursor-not-allowed'
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
