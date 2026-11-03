export type StartingRoleId =
  | 'independent_flipper'
  | 'dealership_worker'
  | 'master_technician'
  | 'scrap_yard_operator'
  | 'import_export_specialist'
  | 'fleet_liquidator'
  | 'underground_broker';

export interface StartingRole {
  id: StartingRoleId;
  name: string;
  tagline: string;
  badge: string;
  avatarIcon: string;
  startingCash: number;
  startingDebt: number;
  initialRep: number;
  initialFavours: number;
  startingTools: { obd: boolean; comp: boolean };
  hasCommercialLicense: boolean;
  skills: Record<string, number>;
  story: string;
  perks: string[];
}

export const STARTING_ROLES: StartingRole[] = [
  {
    id: 'independent_flipper',
    name: 'Independent Flipper',
    tagline: 'Driveway hustler turning modest savings into pure flip margins.',
    badge: 'Balanced Starter',
    avatarIcon: '🚗',
    startingCash: 2200,
    startingDebt: 0,
    initialRep: 50,
    initialFavours: 1,
    startingTools: { obd: false, comp: false },
    hasCommercialLicense: false,
    skills: { neg: 8, mech: 6, body: 6, appr: 7, paper: 6, mkt: 6, net: 6 },
    story: 'You bought your first rusted Civic behind a strip mall for $800, scrubbed the interior, repaired the alternator, and sold it for double. Now you want to scale up from driveway deals to a legitimate automotive empire.',
    perks: [
      'Balanced negotiation and valuation instincts',
      'Flexible market access without strict corporate overhead',
      'Quick agility across classifieds and private estate sales',
    ],
  },
  {
    id: 'dealership_worker',
    name: 'Dealership Worker',
    tagline: 'Former lot porter and floor salesman who knows wholesale inside out.',
    badge: 'High Sales Margin',
    avatarIcon: '💼',
    startingCash: 1950,
    startingDebt: 0,
    initialRep: 55,
    initialFavours: 2,
    startingTools: { obd: false, comp: false },
    hasCommercialLicense: false,
    skills: { neg: 16, mech: 4, body: 4, appr: 9, paper: 10, mkt: 12, net: 10 },
    story: 'Spent five years watching dealer principals pocket $4,000 margins on trade-ins you prepped on the back lot. You know closing techniques, dealer financing markups, and how to negotiate rock-bottom buy-ins.',
    perks: [
      '+15% higher buyer offer acceptance on listed vehicles',
      'Enhanced relationship affinity with wholesale brokers',
      'Knows statutory paperwork shortcuts and lien checks',
    ],
  },
  {
    id: 'master_technician',
    name: 'Master Technician',
    tagline: 'Certified ASE wrench who can spot blown head gaskets by sound alone.',
    badge: 'DIY Mechanic',
    avatarIcon: '🔧',
    startingCash: 1700,
    startingDebt: 0,
    initialRep: 50,
    initialFavours: 1,
    startingTools: { obd: true, comp: true },
    hasCommercialLicense: false,
    skills: { neg: 5, mech: 18, body: 10, appr: 12, paper: 4, mkt: 4, net: 6 },
    story: 'Tired of flagging 60 hours a week for a dealership service manager. You brought your diagnostic scanner, compression tester, and metric wrench set to flip mechanically condemned beaters that other dealers fear to touch.',
    perks: [
      'Starts with professional OBD-II scanner & compression tester',
      '50% reduction in DIY repair labor time and parts cost',
      'Automatic detection of concealed engine and transmission trouble codes',
    ],
  },
  {
    id: 'scrap_yard_operator',
    name: 'Scrap Yard Operator',
    tagline: 'Salvage king turning totaled hulks and parts cars into pure gold.',
    badge: 'Salvage Specialist',
    avatarIcon: '⚙️',
    startingCash: 2400,
    startingDebt: 0,
    initialRep: 45,
    initialFavours: 2,
    startingTools: { obd: false, comp: false },
    hasCommercialLicense: false,
    skills: { neg: 7, mech: 12, body: 15, appr: 10, paper: 6, mkt: 4, net: 9 },
    story: 'Growing up among towering stacks of crushed sedans and catalytic converter barrels taught you what steel and salvage parts are truly worth. You make money whether a car runs or gets stripped to the bare chassis.',
    perks: [
      '+35% higher scrap and part-out liquidation payout',
      'Deep flatbed towing discounts from scrap yard dispatchers',
      'Instant access to cheap salvage body panels and rust patch panels',
    ],
  },
  {
    id: 'import_export_specialist',
    name: 'Import / Export Specialist',
    tagline: 'Global maritime trader sourcing rare JDM icons and rust-free desert trucks.',
    badge: 'Global Routes',
    avatarIcon: '🌐',
    startingCash: 3100,
    startingDebt: 0,
    initialRep: 60,
    initialFavours: 3,
    startingTools: { obd: true, comp: false },
    hasCommercialLicense: false,
    skills: { neg: 9, mech: 7, body: 6, appr: 14, paper: 14, mkt: 10, net: 14 },
    story: 'With container contacts at the Port of Montreal and Yokohama terminals, you know the regulatory sweet spot: cars over 15 years old enter duty-free and command rabid enthusiast premiums.',
    perks: [
      'Immediate access to international overseas import/export routes',
      'Port customs clearances accelerated with zero administrative holds',
      'High appraisal accuracy on foreign right-hand-drive and European specs',
    ],
  },
  {
    id: 'fleet_liquidator',
    name: 'Corporate Fleet Liquidator',
    tagline: 'Institutional dealmaker moving municipal lease returns and utility vans.',
    badge: 'High Capital Volume',
    avatarIcon: '🏢',
    startingCash: 4200,
    startingDebt: 1200,
    initialRep: 65,
    initialFavours: 2,
    startingTools: { obd: true, comp: false },
    hasCommercialLicense: true,
    skills: { neg: 14, mech: 6, body: 5, appr: 12, paper: 15, mkt: 12, net: 12 },
    story: 'You manage batch acquisitions from telephone companies, police asset seizures, and bankrupt rental franchises. You carry higher debt but hold a licensed dealer bond that bypasses private curbstoning laws.',
    perks: [
      'Starts with official Certified Dealer license pre-approved',
      'Rented commercial lot capacity starts with extra parking stalls',
      'Lower institutional borrowing interest rates on commercial credit lines',
    ],
  },
  {
    id: 'underground_broker',
    name: 'Underground Broker',
    tagline: 'Shadow operator operating in back alleys, repo auctions, and lien transfers.',
    badge: 'High Risk / High Margin',
    avatarIcon: '🕶️',
    startingCash: 2500,
    startingDebt: 0,
    initialRep: 38,
    initialFavours: 3,
    startingTools: { obd: false, comp: false },
    hasCommercialLicense: false,
    skills: { neg: 15, mech: 8, body: 9, appr: 11, paper: 11, mkt: 8, net: 16 },
    story: 'When a bank repo goes unsigned or an abandoned mechanic lien title sits in limbo, you know who to call. You walk the edge of regulatory gray zones to score pristine vehicles at 30 cents on the dollar.',
    perks: [
      'Immunity against early curbstoning regulatory fines',
      'Unlocks shadow underground salvage contacts from Day 1',
      'Ability to resolve shady registration liens at half the standard registry cost',
    ],
  },
];
