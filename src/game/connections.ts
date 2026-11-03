import {
  Contact,
  ContactCategory,
  ContactTier,
  ConnectionGraph,
  ConnectionLink,
  ConnectionPerk,
  ConnectionQuest,
} from './types';

// Deterministic PRNG helper based on seed
export function createRng(seed: number) {
  let s = (seed + 0x6d2b79f5) | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  'Marco', 'Dominic', 'Helena', 'Sylvain', 'Kenji', 'Guillaume', 'Cassandra', 'Dmitri',
  'Sal', 'Aisha', 'Nadia', 'Benoit', 'Vince', 'Valerie', 'Tariq', 'Mireille',
  'Rocco', 'Svetlana', 'Jean-Luc', 'Farah', 'Mateo', 'Brigitte', 'Anand', 'Chloe'
];

const LAST_NAMES = [
  'Vance', 'Moretti', 'Tremblay', 'Tanaka', 'Dubois', 'Kowalski', 'Castillo', 'Bélanger',
  'Kuznetsov', 'Morin', 'Chen', 'Rossi', 'Gauthier', 'Al-Mansoor', 'O’Connor', 'Lapointe'
];

const ORGS: Record<ContactCategory, string[]> = {
  mechanic: [
    'Apex Precision Auto', 'Lapointe & Sons Engine Lab', 'Underground JDM Tuning',
    'Rust-Free Fabworks', 'Direct Clutch & Gear', 'Sherbrooke German Specialists'
  ],
  wholesaler: [
    'Tri-City Fleet Liquidation', 'CarMax B2B Auctions', 'Continental Auto Wholesale',
    'Crown Lease Returns', 'Border State Auto Exchange'
  ],
  auction: [
    'Metro Salvage Direct', 'Police & Municipal Asset Disposal', 'Apex Heavy Recoveries',
    'Northway Bankruptcy Liquidators', 'Pacific Maritime Auctioneers'
  ],
  insider: [
    'Registry Compliance Partners', 'Surety Bond & Title Clearing', 'Provincial Safety Board',
    'Maritime Transit Records', 'Justice Court Mediation Bureau'
  ],
  collector: [
    'Laurentian Heritage Classics', 'Quebec Sportscar Syndicate', 'Nordic Turbo Preservation Society',
    'Private Collector Vault 4', 'Vanguard Concours Trust'
  ],
  underground: [
    'Nightshift Parts Syndicate', 'Yard 17 Scrap & Recoveries', 'The Odo Whisperer Network',
    'Borderland Runner Depot', 'Redacted Speed & Salvage'
  ],
  logistics: [
    'St. Lawrence Heavy Hauling', 'Midwest Flatbed Express', 'Pacific Container Lines',
    'Port of Montreal Customs Brokerage', 'FastTrack Interprovincial Towing'
  ],
};

const BIOS: Record<ContactCategory, string[]> = {
  mechanic: [
    'Can rebuild a blown Subaru head gasket in 4 hours blindfolded. Only deals with serious flippers.',
    'Former rally mechanic with an eye for frame cracks and hidden transmission slippage.',
    'Specializes in rust cutting and rocker panel patches that pass strict inspections every time.',
    'Knows every electrical gremlin on BMWs and Audis. Has wholesale access to OEM sensors.'
  ],
  wholesaler: [
    'Liquidates municipal fleets, enterprise leases, and trade-ins before they hit the open market.',
    'Buys volume from rental car companies. Happy to sell off single units at wholesale to trusted buyers.',
    'Moves 40 cars a week through dealer channels. Will give you first dibs on profitable runners.'
  ],
  auction: [
    'Runs the regional salvage yard and bank repo lanes. Knows which cars run before the gavel drops.',
    'Handles government seizure lots and impound releases. Can get you inside bidding access.',
    'Insider at the insurance total-loss depot. Can flag clean-title insurance write-offs.'
  ],
  insider: [
    'Works directly with provincial vehicle safety registries. Can expedite tricky out-of-province paperwork.',
    'Former vehicle inspector turned paperwork consultant. Knows every loophole in safety inspections.',
    'Small claims paralegal who knows how to counter buyer fraud and settle tricky disputes quickly.'
  ],
  collector: [
    'Wealthy dentist and classic enthusiast who pays top dollar for rust-free manual Japanese icons.',
    'Collects pristine European sport sedans. Willing to pay 30% above market for clean service records.',
    'Looking for clean 4x4 trucks and unmolested sports cars. Has zero patience for hidden rust.'
  ],
  underground: [
    'Operates out of an unmarked warehouse near the railyard. Sells cheap parts with no questions asked.',
    'Scrap yard magnate who pays double for catalytic converters and hard-to-find Japanese body panels.',
    'Can source rare JDM parts directly from shipping containers before they hit public forums.'
  ],
  logistics: [
    'Dispatches a fleet of 5-car haulers across Ontario, Quebec, and the US border.',
    'Port customs broker in Montreal. Speeds through import compliance inspections and clearance holds.',
    'Offers discounted flatbed towing across the entire region for registered partners.'
  ]
};

const TITLES: Record<ContactCategory, string[]> = {
  mechanic: ['Master Tech', 'Lead Engine Builder', 'Fabrication Specialist', 'Diagnostic Lead'],
  wholesaler: ['Fleet Manager', 'Acquisitions Director', 'Wholesale Trader', 'Commercial Broker'],
  auction: ['Yard Supervisor', 'Repo Desk Agent', 'Salvage Auctioneer', 'Surplus Officer'],
  insider: ['Title Clerk', 'Safety Auditor', 'Paralegal Consultant', 'Compliance Officer'],
  collector: ['Private Collector', 'Vintage Syndicate Member', 'Concours Judge', 'Enthusiast Investor'],
  underground: ['Scrap King', 'Midnight Runner', 'Wholesale Parts Scrapper', 'Yard Broker'],
  logistics: ['Fleet Hauler', 'Port Freight Agent', 'Logistics Dispatcher', 'Cross-Border Broker']
};

export const PERK_TEMPLATES: Record<ContactCategory, ConnectionPerk[]> = {
  mechanic: [
    {
      id: 'p_mech_labor',
      title: 'Friend of the Shop',
      description: '30% discount on all shop repair labor costs.',
      type: 'discount_shop',
      value: 0.3,
    },
    {
      id: 'p_mech_parts',
      title: 'Wholesale Parts Line',
      description: 'New and aftermarket replacement parts supplied at 25% discount.',
      type: 'discount_parts',
      value: 0.25,
    },
    {
      id: 'p_mech_ppi',
      title: 'Priority Lift Inspection',
      description: 'Pre-purchase inspections (PPI) are 50% cheaper and uncover all latent defects.',
      type: 'free_ppi',
      value: 0.5,
    },
  ],
  wholesaler: [
    {
      id: 'p_whole_leads',
      title: 'B2B Wholesale Bulletin',
      description: 'Receive 2 exclusive off-market vehicle listings every week at 20% below asking.',
      type: 'exclusive_leads',
      value: 0.2,
    },
    {
      id: 'p_whole_paper',
      title: 'Dealer-to-Dealer Fastlane',
      description: 'Zero provincial tax paperwork disputes on wholesale transfers.',
      type: 'easy_paperwork',
      value: 1,
    },
  ],
  auction: [
    {
      id: 'p_auct_fee',
      title: 'Waived Buyer Premium',
      description: 'The standard 10% auction buyer premium is completely waived on all lots.',
      type: 'auction_no_fee',
      value: 0.1,
    },
    {
      id: 'p_auct_tip',
      title: 'Pre-Gavel Condition Sheets',
      description: 'See true vehicle condition and reserve prices before placing auction bids.',
      type: 'free_history',
      value: 1,
    },
  ],
  insider: [
    {
      id: 'p_ins_carfax',
      title: 'Registry Records Direct',
      description: 'Free comprehensive vehicle history and lien reports on all listings.',
      type: 'free_history',
      value: 35,
    },
    {
      id: 'p_ins_paper',
      title: 'Expedited Safety Certification',
      description: 'Vehicle registration inspection fees reduced by 40% with zero delays.',
      type: 'easy_paperwork',
      value: 0.4,
    },
  ],
  collector: [
    {
      id: 'p_coll_bonus',
      title: 'High-Roller Premium',
      description: 'Pays +25% above market value for clean-title sports cars, trucks, and luxury sedans.',
      type: 'high_roller_bonus',
      value: 0.25,
    },
  ],
  underground: [
    {
      id: 'p_under_tow',
      title: 'Flat-Rate Towing',
      description: 'Any vehicle tow anywhere in province capped at $45 flat.',
      type: 'tow_cap',
      value: 45,
    },
    {
      id: 'p_under_parts',
      title: 'Salvage Yard Scrap Bonus',
      description: '+$250 extra on any car sold to scrap yards or parted out.',
      type: 'discount_parts',
      value: 250,
    },
  ],
  logistics: [
    {
      id: 'p_log_speed',
      title: 'Priority Customs Clearance',
      description: 'Import shipping days cut in half and customs holds eliminated.',
      type: 'import_speed',
      value: 0.5,
    },
    {
      id: 'p_log_tow',
      title: 'Multi-Car Hauler Rate',
      description: 'Intercity and regional vehicle towing costs reduced by 35%.',
      type: 'tow_cap',
      value: 0.35,
    },
  ],
};

function generateQuests(category: ContactCategory, name: string, rng: () => number): ConnectionQuest[] {
  const quests: ConnectionQuest[] = [];
  if (category === 'collector') {
    quests.push({
      id: `q_${name.toLowerCase().replace(/[^a-z]/g, '')}_1`,
      title: 'Search for a Clean Manual Sport',
      description: 'Deliver or flip a manual transmission sports car or coupe with clean title and under 180,000 km.',
      targetType: 'bring_car',
      criteria: { cls: 'sport', cleanTitleOnly: true, maxKm: 180000 },
      rewardTrust: 35,
      rewardCash: 1200,
      completed: false,
    });
  } else if (category === 'wholesaler') {
    quests.push({
      id: `q_${name.toLowerCase().replace(/[^a-z]/g, '')}_1`,
      title: 'Fleet Clearance Support',
      description: 'Purchase or trade at least 1 vehicle from wholesale stock this month.',
      targetType: 'inspect_deal',
      rewardTrust: 25,
      rewardCash: 500,
      completed: false,
    });
  } else if (category === 'mechanic') {
    quests.push({
      id: `q_${name.toLowerCase().replace(/[^a-z]/g, '')}_1`,
      title: 'Shop Loan & Parts Pre-order',
      description: 'Lend $350 for an advance shipment of diagnostic scanners and timing tools.',
      targetType: 'lend_money',
      criteria: { amount: 350 },
      rewardTrust: 30,
      rewardCash: 450,
      completed: false,
    });
  } else {
    quests.push({
      id: `q_${name.toLowerCase().replace(/[^a-z]/g, '')}_1`,
      title: 'Trade Network Endorsement',
      description: 'Complete 2 successful car flips with disclosed defects to prove reliability.',
      targetType: 'inspect_deal',
      rewardTrust: 25,
      rewardCash: 400,
      completed: false,
    });
  }
  return quests;
}

export function generateProceduralConnections(seed: number, playerBg: string): ConnectionGraph {
  const rng = createRng(seed);
  const categories: ContactCategory[] = [
    'mechanic', 'wholesaler', 'auction', 'insider', 'collector', 'underground', 'logistics'
  ];
  const tiers: ContactTier[] = ['rookie', 'established', 'elite', 'shadow'];

  const contacts: Record<string, Contact> = {};
  const links: ConnectionLink[] = [];
  const rootId = 'player_root';

  // Total contacts in procedural pool: 14 to 20 nodes
  const totalCount = 16;
  const createdIds: string[] = [];

  for (let i = 0; i < totalCount; i++) {
    const category = categories[i % categories.length];
    const firstName = FIRST_NAMES[(i * 3 + Math.floor(rng() * FIRST_NAMES.length)) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 5 + Math.floor(rng() * LAST_NAMES.length)) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const org = ORGS[category][Math.floor(rng() * ORGS[category].length)];
    const title = TITLES[category][Math.floor(rng() * TITLES[category].length)];
    const bio = BIOS[category][Math.floor(rng() * BIOS[category].length)];
    const tier = tiers[Math.floor(rng() * tiers.length)];
    
    // Quality 1-5 stars (can be 4 or 5 right away! not locked behind levels)
    const quality = Math.min(5, Math.max(1, Math.floor(rng() * 5) + 1));
    const id = `contact_${i + 1}`;

    const perks = PERK_TEMPLATES[category].slice(0, Math.min(2, quality));
    const quests = generateQuests(category, firstName, rng);

    // Initial status determined later
    const contact: Contact = {
      id,
      name: fullName,
      title,
      organization: org,
      category,
      tier,
      quality,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`, // fallback
      location: org.includes('Montreal') ? 'Montréal, QC' : org.includes('Sherbrooke') ? 'Sherbrooke, QC' : 'Regional Metro',
      bio,
      status: 'rumored',
      trust: Math.floor(rng() * 20) + 10,
      introReq: {
        type: rng() < 0.35 ? 'free' : rng() < 0.7 ? 'cash' : 'favor',
        cost: Math.floor(rng() * 15 + 3) * 10, // $30 - $180
        description: `Introduced through mutual auto trade connections.`,
      },
      perks,
      quests,
    };

    contacts[id] = contact;
    createdIds.push(id);
  }

  // Determine starting active contacts based on player background
  let startingActiveIndices = [0, 1];
  if (playerBg === 'wrench') startingActiveIndices = [0, 5]; // mechanic + underground
  else if (playerBg === 'sales') startingActiveIndices = [1, 2]; // wholesaler + auction
  else if (playerBg === 'clerk') startingActiveIndices = [3, 0]; // insider + mechanic
  else if (playerBg === 'social') startingActiveIndices = [0, 1, 4]; // mechanic + wholesaler + collector
  else if (playerBg === 'auction') startingActiveIndices = [2, 1]; // auction + wholesaler

  startingActiveIndices.forEach((idx) => {
    const cId = createdIds[idx % createdIds.length];
    contacts[cId].status = 'active';
    contacts[cId].trust = 50;
    contacts[cId].unlockedDay = 1;

    // Link directly to player root
    links.push({
      source: rootId,
      target: cId,
      reason: 'Long-time acquaintance from the neighborhood lot.',
      strength: 3,
    });
  });

  // Now create procedural branching links across nodes
  // Connect active nodes to their neighbors, setting neighbors to 'revealed'
  for (let i = 0; i < createdIds.length; i++) {
    const currentId = createdIds[i];
    // Connect to 2-3 other nodes
    const numLinks = 2 + (i % 2);
    for (let j = 1; j <= numLinks; j++) {
      const targetIdx = (i + j * 3 + Math.floor(rng() * 4)) % createdIds.length;
      const targetId = createdIds[targetIdx];
      if (targetId !== currentId && !links.some((l) => (l.source === currentId && l.target === targetId) || (l.source === targetId && l.target === currentId))) {
        const reasons = [
          'Frequent buyer at the Saturday morning wholesale auctions.',
          'Trades salvaged OEM parts and specialized diagnostic tooling.',
          'Former partner in a rural auto repair shop.',
          'Shares transport haulers for out-of-province auction deliveries.',
          'Mutual acquaintance through local SAAQ inspection disputes.',
          'Met at an estate vehicle sale in Drummondville.',
        ];
        links.push({
          source: currentId,
          target: targetId,
          reason: reasons[Math.floor(rng() * reasons.length)],
          strength: Math.floor(rng() * 3) + 1,
        });
      }
    }
  }

  // Reveal neighbors of active contacts
  startingActiveIndices.forEach((idx) => {
    const activeId = createdIds[idx % createdIds.length];
    const neighborLinks = links.filter((l) => l.source === activeId || l.target === activeId);
    neighborLinks.forEach((l) => {
      const neighborId = l.source === activeId ? l.target : l.source;
      if (contacts[neighborId] && contacts[neighborId].status === 'rumored') {
        contacts[neighborId].status = 'revealed';
        contacts[neighborId].discoveredDay = 1;
        contacts[neighborId].introReq.introducedById = activeId;
        contacts[neighborId].introReq.description = `${contacts[activeId].name} can introduce you: ${l.reason}`;
      }
    });
  });

  return {
    contacts,
    links,
    rootId,
  };
}

export function findPathToContact(graph: ConnectionGraph, targetId: string): string[] {
  // BFS path from rootId to targetId
  const queue: { id: string; path: string[] }[] = [{ id: graph.rootId, path: [graph.rootId] }];
  const visited = new Set<string>([graph.rootId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.id === targetId) {
      return current.path;
    }

    const neighbors = graph.links
      .filter((l) => l.source === current.id || l.target === current.id)
      .map((l) => (l.source === current.id ? l.target : l.source));

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return [];
}

export function unlockContact(
  graph: ConnectionGraph,
  contactId: string,
  currentDay: number
): { success: boolean; message: string } {
  const contact = graph.contacts[contactId];
  if (!contact) return { success: false, message: 'Contact not found.' };
  if (contact.status === 'active') return { success: false, message: 'Already an active connection.' };

  contact.status = 'active';
  contact.unlockedDay = currentDay;
  contact.trust = Math.max(30, contact.trust + 20);

  // Reveal all neighbors of this newly unlocked contact
  const neighborLinks = graph.links.filter((l) => l.source === contactId || l.target === contactId);
  let newReveals = 0;
  neighborLinks.forEach((l) => {
    const neighborId = l.source === contactId ? l.target : l.source;
    const neighbor = graph.contacts[neighborId];
    if (neighbor && neighbor.status === 'rumored') {
      neighbor.status = 'revealed';
      neighbor.discoveredDay = currentDay;
      neighbor.introReq.introducedById = contactId;
      neighbor.introReq.description = `${contact.name} introduced you: ${l.reason}`;
      newReveals++;
    }
  });

  return {
    success: true,
    message: `Connected with ${contact.name} (${contact.organization})! ${newReveals ? `${newReveals} new potential connection(s) discovered in your network.` : ''}`,
  };
}

export function getActivePerks(graph: ConnectionGraph): ConnectionPerk[] {
  const activePerks: ConnectionPerk[] = [];
  Object.values(graph.contacts).forEach((c) => {
    if (c.status === 'active') {
      activePerks.push(...c.perks);
    }
  });
  return activePerks;
}
