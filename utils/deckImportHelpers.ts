import type { EditableDeckData } from "../contexts/DeckImportContext";
import type {
  BuildDeckImportPlanOptions,
  DeckFeatureInput,
  DeckMetadata,
  ParsedDecklist
} from "../scripts/add_deck_scripts";
import type {
  DeckCardCountsInsert,
  DeckColorIdentityInsert,
  DeckInteractionInsert,
  DeckManaCurveInsert,
  DeckRampInsert,
  DeckWinconSpeedInsert
} from "../types/databaseTypes";

/**
 * Utility functions for converting between EditableDeckData and database types
 * Used to bridge the context state with the add_deck_scripts functions
 */

/**
 * Generates initial editable data structure from a parsed decklist
 * This provides the user with empty card lists to manually populate
 */
export function generateInitialEditableData(
  parsedDecklist: ParsedDecklist,
): EditableDeckData {
  const { mainboard, commander, companion, sideboard, total_card_count } =
    parsedDecklist;

  // Basic card counts - these would need actual card type analysis
  // For now, initialize to zero since user will update manually
  const cardCounts: Omit<DeckCardCountsInsert, "deck_id"> = {
    num_creatures: 0,
    num_instants: 0,
    num_sorceries: 0,
    num_artifacts: 0,
    num_enchantments: 0,
    num_planeswalkers: 0,
    num_lands: 0,
    total_cards: total_card_count,
  };

  // Color identity - extract from commander name if available
  // This would need Scryfall API or card database lookup
  const colorIdentity: Omit<DeckColorIdentityInsert, "deck_id"> = {
    is_white: 0 as 0 | 1,
    is_blue: 0 as 0 | 1,
    is_black: 0 as 0 | 1,
    is_red: 0 as 0 | 1,
    is_green: 0 as 0 | 1,
    num_colors: 1 as 1 | 2 | 3 | 4 | 5,
    color_identity: "",
  };

  // Mana curve - would need CMC data from card database
  const manaCurve: Omit<DeckManaCurveInsert, "deck_id"> = {
    avg_cmc: 0,
    median_cmc: 0,
    cmc_0_1_count: 0,
    cmc_2_count: 0,
    cmc_3_count: 0,
    cmc_4_count: 0,
    cmc_5_count: 0,
    cmc_6_plus_count: 0,
    curve_skewness: 0,
    curve_std: 0,
  };

  return {
    deckName: "",
    owner: "",
    cardCounts,
    colorIdentity,
    manaCurve,
    ramp: {
      rampCards: [], // User manually populates
      fastManaCards: [], // Sol Ring, Mana Crypt, etc.
      landRampCards: [], // Cultivate, Rampant Growth, etc.
      manaDorkCards: [], // Llanowar Elves, Birds, etc.
      rockCards: [], // Signets, Talismans, etc.
      stats: {
        num_ramp_cards: 0,
        num_fast_mana: 0,
        num_land_ramp: 0,
        num_mana_dorks: 0,
        num_rocks: 0,
        avg_ramp_cmc: 0,
        ramp_early_game_ratio: 0,
      },
    },
    interaction: {
      singleTargetRemovalCards: [], // Path to Exile, Swords, etc.
      boardWipeCards: [], // Wrath of God, Cyclonic Rift, etc.
      counterspellCards: [],
      stackInteractionCards: [], // All instant-speed interaction
      stats: {
        num_single_target_removal: 0,
        num_board_wipes: 0,
        num_counterspells: 0,
        num_stack_interaction: 0,
        interaction_density: 0,
        instant_speed_interaction_ratio: 0,
      },
    },
    wincons: {
      comboPieceCards: [],
      knownCombos: [], // Text descriptions
      finisherCards: [], // Game-ending cards
      stats: {
        num_combo_pieces: 0,
        num_known_combos: 0,
        num_finishers: 0,
        goldfish_turn_estimate: 0,
        wincon_speed_score: 0,
      },
    },
    archetype: {
      primary_archetype: "midrange",
      secondary_archetype: null,
      archetype_confidence: 0,
    },
  };
}

/**
 * Converts EditableDeckData back to DeckFeatureInput for database storage
 * Recalculates stats from the user-edited card lists
 */
export function convertEditableDataToFeatures(
  editableData: EditableDeckData,
): DeckFeatureInput {
  // Recalculate ramp stats from card lists
  const totalRampCards = [
    ...editableData.ramp.fastManaCards,
    ...editableData.ramp.landRampCards,
    ...editableData.ramp.manaDorkCards,
    ...editableData.ramp.rockCards,
  ];

  const rampStats: Omit<DeckRampInsert, "deck_id"> = {
    num_ramp_cards: totalRampCards.length,
    num_fast_mana: editableData.ramp.fastManaCards.length,
    num_land_ramp: editableData.ramp.landRampCards.length,
    num_mana_dorks: editableData.ramp.manaDorkCards.length,
    num_rocks: editableData.ramp.rockCards.length,
    avg_ramp_cmc: editableData.ramp.stats.avg_ramp_cmc, // Keep user value
    ramp_early_game_ratio: editableData.ramp.stats.ramp_early_game_ratio, // Keep user value
  };

  // Recalculate interaction stats from card lists
  const totalInteractionCards = [
    ...editableData.interaction.singleTargetRemovalCards,
    ...editableData.interaction.boardWipeCards,
    ...editableData.interaction.counterspellCards,
    ...editableData.interaction.stackInteractionCards,
  ];

  const interactionStats: Omit<DeckInteractionInsert, "deck_id"> = {
    num_single_target_removal:
      editableData.interaction.singleTargetRemovalCards.length,
    num_board_wipes: editableData.interaction.boardWipeCards.length,
    num_counterspells: editableData.interaction.counterspellCards.length,
    num_stack_interaction:
      editableData.interaction.stackInteractionCards.length,
    interaction_density:
      totalInteractionCards.length /
      Math.max(
        (editableData.cardCounts.total_cards || 100) -
          (editableData.cardCounts.num_lands || 0),
        1,
      ),
    instant_speed_interaction_ratio:
      editableData.interaction.stats.instant_speed_interaction_ratio, // Keep user value
  };

  // Recalculate wincon stats from card lists
  const winconStats: Omit<DeckWinconSpeedInsert, "deck_id"> = {
    num_combo_pieces: editableData.wincons.comboPieceCards.length,
    num_known_combos: editableData.wincons.knownCombos.length,
    num_finishers: editableData.wincons.finisherCards.length,
    goldfish_turn_estimate: editableData.wincons.stats.goldfish_turn_estimate, // Keep user value
    wincon_speed_score: editableData.wincons.stats.wincon_speed_score, // Keep user value
  };

  return {
    card_counts: editableData.cardCounts,
    color_identity: editableData.colorIdentity,
    mana_curve: editableData.manaCurve,
    ramp: rampStats,
    interaction: interactionStats,
    wincon_speed: winconStats,
    archetype: editableData.archetype,
  };
}

/**
 * Creates DeckMetadata object from editable data
 */
export function createDeckMetadata(
  editableData: EditableDeckData,
): DeckMetadata {
  return {
    deck_name: editableData.deckName,
    owner: editableData.owner,
    created_date: new Date().toISOString(),
    commander_override: null, // Let the system detect commander from decklist
  };
}

/**
 * Creates BuildDeckImportPlanOptions from editable data
 */
export function createBuildOptions(
  editableData: EditableDeckData,
): BuildDeckImportPlanOptions {
  const metadata = createDeckMetadata(editableData);
  const features = convertEditableDataToFeatures(editableData);

  return {
    ...metadata,
    features,
  };
}

/**
 * Helper to get all unique card names from parsed decklist
 * Useful for providing autocomplete suggestions when editing card lists
 */
export function extractAllCardNames(parsedDecklist: ParsedDecklist): string[] {
  const cardNames = new Set<string>();

  // Add commander
  if (parsedDecklist.commander) {
    cardNames.add(parsedDecklist.commander.card_name);
  }

  // Add companion
  if (parsedDecklist.companion) {
    cardNames.add(parsedDecklist.companion.card_name);
  }

  // Add mainboard cards
  parsedDecklist.mainboard.forEach((card) => {
    cardNames.add(card.card_name);
  });

  // Add sideboard cards
  parsedDecklist.sideboard.forEach((card) => {
    cardNames.add(card.card_name);
  });

  return Array.from(cardNames).sort();
}

/**
 * Helper to validate that all manually entered card names exist in the parsed decklist
 * Returns array of invalid card names
 */
export function validateCardNames(
  editableData: EditableDeckData,
  parsedDecklist: ParsedDecklist,
): string[] {
  const validCardNames = new Set(extractAllCardNames(parsedDecklist));
  const invalidNames: string[] = [];

  // Check all manually entered card names
  const allEnteredNames = [
    ...editableData.ramp.rampCards,
    ...editableData.ramp.fastManaCards,
    ...editableData.ramp.landRampCards,
    ...editableData.ramp.manaDorkCards,
    ...editableData.ramp.rockCards,
    ...editableData.interaction.singleTargetRemovalCards,
    ...editableData.interaction.boardWipeCards,
    ...editableData.interaction.counterspellCards,
    ...editableData.interaction.stackInteractionCards,
    ...editableData.wincons.comboPieceCards,
    ...editableData.wincons.finisherCards,
  ];

  allEnteredNames.forEach((cardName) => {
    if (cardName && !validCardNames.has(cardName)) {
      invalidNames.push(cardName);
    }
  });

  return [...new Set(invalidNames)]; // Remove duplicates
}

/**
 * Helper to recalculate derived stats when card lists are updated
 * Updates the stats fields based on current card list contents
 */
export function recalculateStats(
  editableData: EditableDeckData,
): EditableDeckData {
  const updated = { ...editableData };

  // Update ramp stats
  updated.ramp.stats.num_ramp_cards = [
    ...editableData.ramp.fastManaCards,
    ...editableData.ramp.landRampCards,
    ...editableData.ramp.manaDorkCards,
    ...editableData.ramp.rockCards,
  ].length;

  updated.ramp.stats.num_fast_mana = editableData.ramp.fastManaCards.length;
  updated.ramp.stats.num_land_ramp = editableData.ramp.landRampCards.length;
  updated.ramp.stats.num_mana_dorks = editableData.ramp.manaDorkCards.length;
  updated.ramp.stats.num_rocks = editableData.ramp.rockCards.length;

  // Update interaction stats
  updated.interaction.stats.num_single_target_removal =
    editableData.interaction.singleTargetRemovalCards.length;
  updated.interaction.stats.num_board_wipes =
    editableData.interaction.boardWipeCards.length;
  updated.interaction.stats.num_counterspells =
    editableData.interaction.counterspellCards.length;
  updated.interaction.stats.num_stack_interaction =
    editableData.interaction.stackInteractionCards.length;

  const totalInteraction =
    updated.interaction.stats.num_single_target_removal +
    updated.interaction.stats.num_board_wipes +
    updated.interaction.stats.num_counterspells +
    updated.interaction.stats.num_stack_interaction;

  const nonLandCards = Math.max(
    (editableData.cardCounts.total_cards || 100) -
      (editableData.cardCounts.num_lands || 0),
    1,
  );
  updated.interaction.stats.interaction_density =
    totalInteraction / nonLandCards;

  // Update wincon stats
  updated.wincons.stats.num_combo_pieces =
    editableData.wincons.comboPieceCards.length;
  updated.wincons.stats.num_known_combos =
    editableData.wincons.knownCombos.length;
  updated.wincons.stats.num_finishers =
    editableData.wincons.finisherCards.length;

  return updated;
}
