import { Deck } from '../types/deck';

export const MOCK_DECKS: Deck[] = [
  { 
    id: 1, 
    name: "Morska",
    colors: ["white", "blue", "green"],
    winrate: 0.65,
    description: "A control deck focused on card advantage and late game dominance.",
    totalGames: 47,
    lastPlayed: new Date('2024-10-20'),
    cards: [
      { id: "1", name: "Lightning Bolt", cost: 1, type: "Instant", rarity: "Common", quantity: 4 },
      { id: "2", name: "Counterspell", cost: 2, type: "Instant", rarity: "Common", quantity: 4 },
      { id: "3", name: "Wrath of God", cost: 4, type: "Sorcery", rarity: "Rare", quantity: 2 },
    ]
  },
  { 
    id: 2, 
    name: "Blaster",
    colors: ["red", "green"],
    winrate: 0.55,
    description: "An aggressive deck that aims to deal damage quickly.",
    totalGames: 32,
    lastPlayed: new Date('2024-10-22'),
    cards: [
      { id: "4", name: "Lightning Bolt", cost: 1, type: "Instant", rarity: "Common", quantity: 4 },
      { id: "5", name: "Giant Growth", cost: 1, type: "Instant", rarity: "Common", quantity: 4 },
      { id: "6", name: "Tarmogoyf", cost: 2, type: "Creature", rarity: "Mythic", quantity: 4 },
    ]
  },
  { 
    id: 3, 
    name: "War Doctor",
    colors: ["white", "red", "green"],
    winrate: 0.70,
    description: "A midrange deck with powerful creatures and removal.",
    totalGames: 28,
    lastPlayed: new Date('2024-10-25'),
    cards: [
      { id: "7", name: "Path to Exile", cost: 1, type: "Instant", rarity: "Uncommon", quantity: 4 },
      { id: "8", name: "Lightning Helix", cost: 2, type: "Instant", rarity: "Uncommon", quantity: 4 },
      { id: "9", name: "Tarmogoyf", cost: 2, type: "Creature", rarity: "Mythic", quantity: 2 },
    ]
  },
];