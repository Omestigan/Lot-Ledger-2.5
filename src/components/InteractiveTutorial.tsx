import React, { useState } from 'react';
import {
  Sparkles, X, ChevronRight, ChevronLeft, ShoppingBag, Car,
  Users, Globe, HardDrive, CheckCircle2, ArrowRight
} from 'lucide-react';

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Lot & Ledger v2.0 Network!',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      badge: 'Getting Started',
      tabId: 'welcome',
      description:
        'Step into the shoes of an automotive entrepreneur. Sourcing flips, diagnosing hidden rust, managing driveway repairs, unlocking contact networks, and trading B2B with real players online!',
      tips: [
        'Each game is procedurally generated with distinct listings, rust rates, and relationship networks.',
        'Manage your daily visits, work hours, and commercial credit wisely.',
      ],
    },
    {
      title: '1. Sourcing Flips (Market Tab)',
      icon: ShoppingBag,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      badge: 'Step 1 of 5',
      tabId: 'market',
      description:
        'Browse classifieds, dealer trade-ins, and auctions. Meet sellers in person to perform walk-arounds, test drives, and OBD-II trouble code scans before placing lowball offers or bids.',
      tips: [
        'Watch out for title flags, lien debts, and rolled odometers in history reports.',
        'Use the interactive OBD-II tool to catch hidden engine misfires.',
      ],
    },
    {
      title: '2. Driveway Repairs & Plating (Garage Tab)',
      icon: Car,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      badge: 'Step 2 of 5',
      tabId: 'garage',
      description:
        'Perform DIY driveway wrenching to save labor costs and level up your Mechanical skill, or book professional shop repairs. Plate and register vehicles with provincial authorities before listing for sale.',
      tips: [
        'Detailing a car before listing increases buyer valuation and photo appeal.',
        'Fix safety-critical issues (brakes, tie rods) to avoid buyer lawsuits!',
      ],
    },
    {
      title: '3. Relationship Networks (Connections Tab)',
      icon: Users,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Step 3 of 5',
      tabId: 'connections',
      description:
        'Explore procedurally generated relationship paths on an interactive canvas graph. Unlock auction insiders, mechanics, and scrap yard owners for exclusive perks, discounts, and high-trust quests.',
      tips: [
        'Quality of connections varies independently of level—start forging deals from Day 1!',
        'Active perks grant free PPI inspections and auction fee discounts.',
      ],
    },
    {
      title: '4. Live B2B Wholesale Market (B2B Network)',
      icon: Globe,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      badge: 'Step 4 of 5',
      tabId: 'b2b',
      description:
        'Connect directly with other real players over Cloud Firestore! List vehicles from your garage for wholesale B2B sale, buy cars from live online dealers, and chat in global dealership chat.',
      tips: [
        'B2B transactions update instantly across all active players in real time.',
        'Browse the active dealer lobby to inspect competitor net worths and reputation.',
      ],
    },
    {
      title: '5. Cloud Saves & Accounts (Accounts Modal)',
      icon: HardDrive,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      badge: 'Step 5 of 5',
      tabId: 'welcome',
      description:
        'Sign in with Google to enable automatic Cloud Firestore save synchronization. Manage multi-slot saves, or export JSON backups to transfer state anywhere.',
      tips: [
        'Your active slot saves automatically as you advance days.',
        'Access the Accounts menu anytime from the top bar.',
      ],
    },
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleJumpToTab = () => {
    onNavigateTab(step.tabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="liquid-glass rounded-3xl max-w-xl w-full p-6 shadow-2xl floating-panel flex flex-col justify-between gap-6 border border-white/80 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${step.color}`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                {step.badge}
              </span>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {step.description}
          </p>

          <div className="p-4 rounded-2xl liquid-glass-input space-y-2 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Pro Tips
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Tutorial Progress</span>
            <span>{currentStep + 1} / {steps.length}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-medium"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {step.tabId !== 'welcome' && (
              <button
                onClick={handleJumpToTab}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Try Feature</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold floating-btn flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? 'Got It, Let\'s Play!' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
