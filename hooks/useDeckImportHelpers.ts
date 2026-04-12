import { useCallback } from "react";
import type { EditableDeckData } from "../contexts/DeckImportContext";
import { useDeckImport } from "../contexts/DeckImportContext";
import type { DeckFeatureInput } from "../scripts/add_deck_scripts";
import {
  buildDeckImportPlan,
  parseDecklist,
  storeDeckImportPlan,
  validateDecklist,
} from "../scripts/add_deck_scripts";

/**
 * Hook providing utilities for deck import management
 * Connects the DeckImportContext to the analysis functions from add_deck_scripts
 */
export function useDeckImportHelpers() {
  const { state, actions } = useDeckImport();

  // Generate initial editable data from parsed decklist
  const generateEditableData = useCallback(
    (parsedDecklist: any): EditableDeckData => {
      const { mainboard, commander, total_card_count } = parsedDecklist;

      // Calculate basic card counts from parsed decklist
      const cardCounts = {
        num_creatures: 0, // Will need card type analysis
        num_instants: 0,
        num_sorceries: 0,
        num_artifacts: 0,
        num_enchantments: 0,
        num_planeswalkers: 0,
        num_lands: 0,
        total_cards: total_card_count || 100,
      };

      // Generate color identity from commander
      const colorIdentity = {
        is_white: 0 as 0 | 1,
        is_blue: 0 as 0 | 1,
        is_black: 0 as 0 | 1,
        is_red: 0 as 0 | 1,
        is_green: 0 as 0 | 1,
        num_colors: 1 as 1 | 2 | 3 | 4 | 5,
        color_identity: commander?.card_name || "",
      };

      // Initialize empty lists for user editing
      return {
        deckName: "",
        owner: "",
        selectedCommander: "",
        cardCounts,
        colorIdentity,
        manaCurve: {
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
        },
        ramp: {
          rampCards: [], // User will manually add/edit these
          fastManaCards: [],
          landRampCards: [],
          manaDorkCards: [],
          rockCards: [],
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
          singleTargetRemovalCards: [],
          boardWipeCards: [],
          counterspellCards: [],
          stackInteractionCards: [],
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
          knownCombos: [],
          finisherCards: [],
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
    },
    [],
  );

  // Convert editable data back to DeckFeatureInput for saving
  const convertEditableDataToFeatures = useCallback(
    (editableData: EditableDeckData): DeckFeatureInput => {
      // Recalculate stats from card lists before saving
      const rampStats = {
        ...editableData.ramp.stats,
        num_ramp_cards: editableData.ramp.rampCards.length,
        num_fast_mana: editableData.ramp.fastManaCards.length,
        num_land_ramp: editableData.ramp.landRampCards.length,
        num_mana_dorks: editableData.ramp.manaDorkCards.length,
        num_rocks: editableData.ramp.rockCards.length,
      };

      const interactionStats = {
        ...editableData.interaction.stats,
        num_single_target_removal:
          editableData.interaction.singleTargetRemovalCards.length,
        num_board_wipes: editableData.interaction.boardWipeCards.length,
        num_counterspells: editableData.interaction.counterspellCards.length,
        num_stack_interaction:
          editableData.interaction.stackInteractionCards.length,
      };

      const winconStats = {
        ...editableData.wincons.stats,
        num_combo_pieces: editableData.wincons.comboPieceCards.length,
        num_known_combos: editableData.wincons.knownCombos.length,
        num_finishers: editableData.wincons.finisherCards.length,
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
    },
    [],
  );

  // Enhanced analyze deck function
  const analyzeDeck = useCallback(async () => {
    if (!state.rawDecklist.trim()) {
      return;
    }

    try {
      actions.setRawDecklist(state.rawDecklist);

      // Parse and validate the decklist
      const validation = validateDecklist(state.rawDecklist);
      const parsed = parseDecklist(state.rawDecklist);

      // Generate initial editable data
      const editableData = generateEditableData(parsed);

      // Update state with results
      const payload = {
        parsed,
        editable: editableData,
        issues: validation.issues,
      };

      // Dispatch success action
      actions.analyzeDeck = async () => {
        actions.setRawDecklist(state.rawDecklist);
        // This would be the actual implementation
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      // Handle error case
    }
  }, [state.rawDecklist, actions, generateEditableData]);

  // Enhanced save deck function
  const saveDeck = useCallback(async () => {
    if (!state.parsedDecklist || !state.isValid) {
      throw new Error("Cannot save invalid deck data");
    }

    try {
      // Convert editable data to features
      const features = convertEditableDataToFeatures(state.editableData);

      // Build import plan
      const metadata = {
        deck_name: state.editableData.deckName,
        owner: state.editableData.owner,
        created_date: new Date().toISOString(),
      };

      const plan = buildDeckImportPlan(state.parsedDecklist, {
        ...metadata,
        features,
      });

      // Store the plan
      const result = await storeDeckImportPlan(plan);

      return result;
    } catch (error) {
      console.error("Save failed:", error);
      throw error;
    }
  }, [
    state.parsedDecklist,
    state.editableData,
    state.isValid,
    convertEditableDataToFeatures,
  ]);

  // Helper to add card names to lists
  const addCardToList = useCallback(
    (
      category: "ramp" | "interaction" | "wincons",
      listType: string,
      cardName: string,
    ) => {
      if (!cardName.trim()) return;

      const currentList = (state.editableData[category] as any)[listType] || [];
      if (!currentList.includes(cardName)) {
        const updatedList = [...currentList, cardName.trim()];

        if (category === "ramp") {
          actions.updateRampCards(
            listType as keyof EditableDeckData["ramp"],
            updatedList,
          );
        } else if (category === "interaction") {
          actions.updateInteractionCards(
            listType as keyof EditableDeckData["interaction"],
            updatedList,
          );
        } else if (category === "wincons") {
          if (listType === "knownCombos") {
            actions.updateWinconCards(
              listType as keyof EditableDeckData["wincons"],
              updatedList,
            );
          } else {
            actions.updateWinconCards(
              listType as keyof EditableDeckData["wincons"],
              updatedList,
            );
          }
        }
      }
    },
    [state.editableData, actions],
  );

  // Helper to remove card names from lists
  const removeCardFromList = useCallback(
    (
      category: "ramp" | "interaction" | "wincons",
      listType: string,
      cardName: string,
    ) => {
      const currentList = (state.editableData[category] as any)[listType] || [];
      const updatedList = currentList.filter(
        (name: string) => name !== cardName,
      );

      if (category === "ramp") {
        actions.updateRampCards(
          listType as keyof EditableDeckData["ramp"],
          updatedList,
        );
      } else if (category === "interaction") {
        actions.updateInteractionCards(
          listType as keyof EditableDeckData["interaction"],
          updatedList,
        );
      } else if (category === "wincons") {
        if (listType === "knownCombos") {
          actions.updateWinconCards(
            listType as keyof EditableDeckData["wincons"],
            updatedList,
          );
        } else {
          actions.updateWinconCards(
            listType as keyof EditableDeckData["wincons"],
            updatedList,
          );
        }
      }
    },
    [state.editableData, actions],
  );

  // Helper to get all card names from parsed decklist for suggestions
  const getAllCardNames = useCallback((): string[] => {
    if (!state.parsedDecklist) return [];

    const cards: string[] = [];

    // Add commander
    if (state.parsedDecklist.commander) {
      cards.push(state.parsedDecklist.commander.card_name);
    }

    // Add mainboard cards
    state.parsedDecklist.mainboard.forEach((card) => {
      cards.push(card.card_name);
    });

    // Add sideboard cards
    if (state.parsedDecklist.sideboard) {
      state.parsedDecklist.sideboard.forEach((card) => {
        cards.push(card.card_name);
      });
    }

    return cards.sort();
  }, [state.parsedDecklist]);

  // Helper to check if deck has unsaved changes
  const hasUnsavedChanges = state.hasUnsavedChanges;

  // Helper to get validation errors
  const getValidationErrors = useCallback(() => {
    return state.validationIssues.filter((issue) => issue.severity === "error");
  }, [state.validationIssues]);

  // Helper to get validation warnings
  const getValidationWarnings = useCallback(() => {
    return state.validationIssues.filter(
      (issue) => issue.severity === "warning",
    );
  }, [state.validationIssues]);

  return {
    // State access
    state,
    actions,

    // Enhanced functions
    analyzeDeck,
    saveDeck,

    // Helper functions
    addCardToList,
    removeCardFromList,
    getAllCardNames,
    convertEditableDataToFeatures,

    // Validation helpers
    hasUnsavedChanges,
    getValidationErrors,
    getValidationWarnings,

    // Status checks
    canAnalyze: !!state.rawDecklist.trim(),
    canSave:
      state.isValid &&
      !!state.parsedDecklist &&
      !!state.editableData.selectedCommander.trim() &&
      !state.isSaving,
    isProcessing: state.isAnalyzing || state.isSaving,
  };
}
