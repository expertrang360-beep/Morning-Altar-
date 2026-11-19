import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, Award, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { StudyPlanType } from '../types';
import { calculateGoalEstimates, OT_CHAPTERS_COUNT, NT_CHAPTERS_COUNT } from '../data/biblePlanHelper';

interface BiblePlanSelectorProps {
  initialPlan: StudyPlanType;
  initialStartTestament?: 'ot' | 'nt';
  initialDailyCapacity?: number;
  onSelect: (plan: StudyPlanType, startTestament: 'ot' | 'nt', dailyCapacity: number) => void;
  compact?: boolean;
}

export function BiblePlanSelector({
  initialPlan,
  initialStartTestament = 'ot',
  initialDailyCapacity = 3,
  onSelect,
  compact = false,
}: BiblePlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<StudyPlanType>(initialPlan);
  const [startTestament, setStartTestament] = useState<'ot' | 'nt'>(initialStartTestament);
  const [dailyCapacity, setDailyCapacity] = useState<number>(initialDailyCapacity || 3);

  const { presetGoals, customGoal, milestones } = calculateGoalEstimates(startTestament, dailyCapacity);

  const handleTestamentChange = (testament: 'ot' | 'nt') => {
    setStartTestament(testament);
    onSelect(selectedPlan, testament, dailyCapacity);
  };

  const handlePlanChange = (plan: StudyPlanType, capacity?: number) => {
    const newCap = capacity !== undefined ? capacity : dailyCapacity;
    setSelectedPlan(plan);
    if (capacity !== undefined) {
      setDailyCapacity(capacity);
    }
    onSelect(plan, startTestament, newCap);
  };

  const handleCapacityChange = (cap: number) => {
    setDailyCapacity(cap);
    setSelectedPlan('custom');
    onSelect('custom', startTestament, cap);
  };

  // Active goal summary
  const activeEstimate = selectedPlan === 'custom' 
    ? customGoal 
    : presetGoals.find(g => g.id === selectedPlan) || customGoal;

  return (
    <div className="w-full space-y-6 text-left">
      {/* 1. Choose Starting Testament */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-theme-muted uppercase tracking-widest flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-theme-accent" />
            1. Where to Begin
          </label>
          <span className="text-[11px] text-theme-accent font-medium">
            {startTestament === 'nt' ? 'New Testament first' : 'Old Testament first'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleTestamentChange('ot')}
            className={`p-3.5 rounded-2xl border transition-all text-left relative flex flex-col gap-1.5 ${
              startTestament === 'ot'
                ? 'bg-theme-accent/15 border-theme-accent text-theme-text shadow-sm'
                : 'bg-theme-card border-theme-border text-theme-muted hover:border-theme-accent/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                📜 Old Testament
              </span>
              {startTestament === 'ot' && (
                <CheckCircle2 className="w-4 h-4 text-theme-accent" />
              )}
            </div>
            <p className="text-[11px] text-theme-muted leading-tight">
              Start Genesis 1 &rarr; Malachi, then Gospels to Revelation.
            </p>
            <span className="text-[10px] font-medium text-theme-accent/90 mt-1">
              {OT_CHAPTERS_COUNT} chapters first
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTestamentChange('nt')}
            className={`p-3.5 rounded-2xl border transition-all text-left relative flex flex-col gap-1.5 ${
              startTestament === 'nt'
                ? 'bg-theme-accent/15 border-theme-accent text-theme-text shadow-sm'
                : 'bg-theme-card border-theme-border text-theme-muted hover:border-theme-accent/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                ✝️ New Testament
              </span>
              {startTestament === 'nt' && (
                <CheckCircle2 className="w-4 h-4 text-theme-accent" />
              )}
            </div>
            <p className="text-[11px] text-theme-muted leading-tight">
              Start Matthew 1 &rarr; Revelation, then loop into Genesis.
            </p>
            <span className="text-[10px] font-medium text-theme-accent/90 mt-1">
              {NT_CHAPTERS_COUNT} chapters first
            </span>
          </button>
        </div>
      </div>

      {/* 2. Choose Pace / Goal */}
      <div>
        <label className="text-xs font-bold text-theme-muted uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
          <Award className="w-4 h-4 text-theme-accent" />
          2. Pace & Target Goal
        </label>

        <div className="space-y-2.5">
          {presetGoals.map((goal) => {
            const isSelected = selectedPlan === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => handlePlanChange(goal.id as StudyPlanType, Math.round(goal.capacity))}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-theme-accent border-theme-accent text-theme-bg shadow-md'
                    : 'bg-theme-card border-theme-border text-theme-text hover:border-theme-accent/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{goal.title}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-theme-bg/20 text-theme-bg'
                          : 'bg-theme-accent/10 text-theme-accent'
                      }`}
                    >
                      {goal.paceLabel}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      isSelected ? 'text-theme-bg/90' : 'text-theme-muted'
                    }`}
                  >
                    {goal.recommendedFor}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                  <span className="text-xs font-bold block">
                    ~{goal.dailyMinutes} min/day
                  </span>
                  <span
                    className={`text-[10px] ${
                      isSelected ? 'text-theme-bg/80' : 'text-theme-muted'
                    }`}
                  >
                    {goal.totalDays} days
                  </span>
                </div>
              </button>
            );
          })}

          {/* Custom Capacity Option */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              selectedPlan === 'custom'
                ? 'bg-theme-card border-theme-accent ring-1 ring-theme-accent/50'
                : 'bg-theme-card/60 border-theme-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-sm text-theme-text block">
                  Custom Daily Capacity
                </span>
                <span className="text-xs text-theme-muted">
                  Choose exactly how many chapters you want to read each day
                </span>
              </div>
              <span className="text-xs font-extrabold bg-theme-accent/15 text-theme-accent px-2.5 py-1 rounded-full">
                {dailyCapacity} ch/day
              </span>
            </div>

            {/* Quick capacity buttons */}
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {[1, 2, 3, 4, 5].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => handleCapacityChange(cap)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    selectedPlan === 'custom' && dailyCapacity === cap
                      ? 'bg-theme-accent border-theme-accent text-theme-bg'
                      : 'bg-theme-bg border-theme-border text-theme-muted hover:border-theme-accent/40'
                  }`}
                >
                  {cap} ch
                </button>
              ))}
            </div>

            {/* Range slider for fine-tuning */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-theme-muted font-bold">1</span>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={dailyCapacity}
                onChange={(e) => handleCapacityChange(Number(e.target.value))}
                className="w-full accent-theme-accent cursor-pointer"
              />
              <span className="text-[10px] text-theme-muted font-bold">8+</span>
            </div>
          </div>

          {/* No Plan Option */}
          <button
            type="button"
            onClick={() => handlePlanChange('none')}
            className={`w-full p-3 rounded-2xl border text-center text-xs font-medium transition-all ${
              selectedPlan === 'none'
                ? 'bg-theme-border border-theme-border text-theme-text font-bold'
                : 'bg-transparent border-dashed border-theme-border/60 text-theme-muted hover:text-theme-text'
            }`}
          >
            I prefer reading freely without a structured plan
          </button>
        </div>
      </div>

      {/* 3. Live Estimate & Milestones Breakdown */}
      {selectedPlan !== 'none' && (
        <div className="bg-theme-accent/10 border border-theme-accent/25 rounded-2xl p-4.5 space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-theme-accent/20">
            <span className="text-xs font-bold text-theme-accent flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Plan Forecast & Estimate
            </span>
            <span className="text-xs font-extrabold text-theme-text">
              Finish: {activeEstimate.completionDate}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-theme-card/60 p-2.5 rounded-xl border border-theme-border">
              <p className="text-[10px] text-theme-muted uppercase font-semibold">Pace</p>
              <p className="text-sm font-bold text-theme-text mt-0.5">
                {activeEstimate.paceLabel}
              </p>
            </div>
            <div className="bg-theme-card/60 p-2.5 rounded-xl border border-theme-border">
              <p className="text-[10px] text-theme-muted uppercase font-semibold">Daily Time</p>
              <p className="text-sm font-bold text-theme-accent mt-0.5">
                ~{activeEstimate.dailyMinutes} min
              </p>
            </div>
            <div className="bg-theme-card/60 p-2.5 rounded-xl border border-theme-border">
              <p className="text-[10px] text-theme-muted uppercase font-semibold">Total Time</p>
              <p className="text-sm font-bold text-theme-text mt-0.5">
                ~{activeEstimate.approxMonths} mos
              </p>
            </div>
          </div>

          {/* Milestones timeline */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider">
              Key Milestones at this pace:
            </p>
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-theme-bg/40 text-theme-text/90"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-theme-accent" />
                  <span className="font-medium text-[11px]">{m.title}</span>
                </div>
                <div className="text-right text-[11px]">
                  <span className="text-theme-accent font-semibold">{m.daysAtCurrentPace} days</span>
                  <span className="text-theme-muted ml-1.5">({m.targetDate})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
