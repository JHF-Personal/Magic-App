import React, { createContext, ReactNode, useContext, useReducer } from "react";
import type {
  DecklistValidationIssue,
  ParsedDecklist,
  StoredDeckImportResult,
} from "../scripts/add_deck_scripts";
import type {
  DeckArchetypeInsert,
  DeckCardCountsInsert,
  DeckColorIdentityInsert,
  DeckInteractionInsert,
  DeckManaCurveInsert,
  DeckRampInsert,
  DeckWinconSpeedInsert,
} from "../types/databaseTypes";

// Editable data structure for user modification before saving
export interface EditableDeckData {
  // Basic deck info
  deckName: string;
  owner: string;

  // Card counts (mostly auto-calculated but user can override)
  cardCounts: Omit<DeckCardCountsInsert, "deck_id">;

  // Color identity (auto-calculated from commander)
  colorIdentity: Omit<DeckColorIdentityInsert, "deck_id">;

  // Mana curve (auto-calculated but user can adjust)
  manaCurve: Omit<DeckManaCurveInsert, "deck_id">;

  // Ramp analysis - user editable card lists
  ramp: {
    rampCards: string[]; // Card names for manual editing
    fastManaCards: string[]; // Sol Ring, Mana Crypt, etc.
    landRampCards: string[]; // Cultivate, Rampant Growth, etc.
    manaDorkCards: string[]; // Llanowar Elves, Birds, etc.
    rockCards: string[]; // Signets, Talismans, etc.
    stats: Omit<DeckRampInsert, "deck_id">;
  };

  // Interaction analysis - user editable card lists
  interaction: {
    singleTargetRemovalCards: string[]; // Path to Exile, Swords, etc.
    boardWipeCards: string[]; // Wrath of God, Cyclonic Rift, etc.
    counterspellCards: string[];
    stackInteractionCards: string[]; // All instant-speed interaction
    stats: Omit<DeckInteractionInsert, "deck_id">;
  };

  // Wincon analysis - user editable card lists
  wincons: {
    comboPieceCards: string[];
    knownCombos: string[]; // Text descriptions of combos
    finisherCards: string[]; // Cards that close out games
    stats: Omit<DeckWinconSpeedInsert, "deck_id">;
  };

  // Archetype classification - user selectable
  archetype: Omit<DeckArchetypeInsert, "deck_id">;
}

// State for the deck import process
export interface DeckImportState {
  // Raw input
  rawDecklist: string;

  // Parsed data (read-only after analysis)
  parsedDecklist: ParsedDecklist | null;

  // User-editable data
  editableData: EditableDeckData;

  // Validation and errors
  validationIssues: DecklistValidationIssue[];
  isValid: boolean;

  // Process state
  isAnalyzing: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // Results
  saveResult: StoredDeckImportResult | null;
  saveError: string | null;
}

// Action types for state management
type DeckImportAction =
  | { type: "SET_RAW_DECKLIST"; payload: string }
  | { type: "START_ANALYSIS" }
  | {
      type: "ANALYSIS_SUCCESS";
      payload: {
        parsed: ParsedDecklist;
        editable: EditableDeckData;
        issues: DecklistValidationIssue[];
      };
    }
  | { type: "ANALYSIS_ERROR"; payload: DecklistValidationIssue[] }
  | { type: "UPDATE_DECK_NAME"; payload: string }
  | { type: "UPDATE_OWNER"; payload: string }
  | { type: "UPDATE_CARD_COUNTS"; payload: Partial<DeckCardCountsInsert> }
  | { type: "UPDATE_MANA_CURVE"; payload: Partial<DeckManaCurveInsert> }
  | { type: "UPDATE_WINCON_STATS"; payload: Partial<DeckWinconSpeedInsert> }
  | {
      type: "UPDATE_RAMP_CARDS";
      payload: { type: keyof EditableDeckData["ramp"]; cards: string[] };
    }
  | {
      type: "UPDATE_INTERACTION_CARDS";
      payload: { type: keyof EditableDeckData["interaction"]; cards: string[] };
    }
  | {
      type: "UPDATE_WINCON_CARDS";
      payload: {
        type: keyof EditableDeckData["wincons"];
        cards: string[] | string;
      };
    }
  | { type: "UPDATE_ARCHETYPE"; payload: Partial<DeckArchetypeInsert> }
  | { type: "START_SAVE" }
  | { type: "SAVE_SUCCESS"; payload: StoredDeckImportResult }
  | { type: "SAVE_ERROR"; payload: string }
  | { type: "RESET_STATE" };

// Context interface
interface DeckImportContextType {
  state: DeckImportState;
  actions: {
    setRawDecklist: (text: string) => void;
    analyzeDeck: () => Promise<void>;
    updateDeckName: (name: string) => void;
    updateOwner: (owner: string) => void;
    updateCardCounts: (counts: Partial<DeckCardCountsInsert>) => void;
    updateManaCurve: (curve: Partial<DeckManaCurveInsert>) => void;
    updateWinconStats: (stats: Partial<DeckWinconSpeedInsert>) => void;
    updateRampCards: (
      type: keyof EditableDeckData["ramp"],
      cards: string[],
    ) => void;
    updateInteractionCards: (
      type: keyof EditableDeckData["interaction"],
      cards: string[],
    ) => void;
    updateWinconCards: (
      type: keyof EditableDeckData["wincons"],
      data: string[] | string,
    ) => void;
    updateArchetype: (archetype: Partial<DeckArchetypeInsert>) => void;
    saveDeck: () => Promise<void>;
    resetState: () => void;
  };
}

// Create initial state
const createInitialState = (): DeckImportState => ({
  rawDecklist: "",
  parsedDecklist: null,
  editableData: {
    deckName: "",
    owner: "",
    cardCounts: {
      num_creatures: 0,
      num_instants: 0,
      num_sorceries: 0,
      num_artifacts: 0,
      num_enchantments: 0,
      num_planeswalkers: 0,
      num_lands: 0,
      total_cards: 100,
    },
    colorIdentity: {
      is_white: 0,
      is_blue: 0,
      is_black: 0,
      is_red: 0,
      is_green: 0,
      num_colors: 1,
      color_identity: "",
    },
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
      rampCards: [],
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
  },
  validationIssues: [],
  isValid: false,
  isAnalyzing: false,
  isSaving: false,
  hasUnsavedChanges: false,
  saveResult: null,
  saveError: null,
});

// Reducer function
const deckImportReducer = (
  state: DeckImportState,
  action: DeckImportAction,
): DeckImportState => {
  switch (action.type) {
    case "SET_RAW_DECKLIST":
      return {
        ...state,
        rawDecklist: action.payload,
        hasUnsavedChanges: true,
        saveResult: null,
        saveError: null,
      };

    case "START_ANALYSIS":
      return {
        ...state,
        isAnalyzing: true,
        validationIssues: [],
        saveError: null,
      };

    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        isAnalyzing: false,
        parsedDecklist: action.payload.parsed,
        editableData: action.payload.editable,
        validationIssues: action.payload.issues,
        isValid: !action.payload.issues.some(
          (issue) => issue.severity === "error",
        ),
        hasUnsavedChanges: true,
      };

    case "ANALYSIS_ERROR":
      return {
        ...state,
        isAnalyzing: false,
        validationIssues: action.payload,
        isValid: false,
      };

    case "UPDATE_DECK_NAME":
      return {
        ...state,
        editableData: {
          ...state.editableData,
          deckName: action.payload,
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_OWNER":
      return {
        ...state,
        editableData: {
          ...state.editableData,
          owner: action.payload,
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_CARD_COUNTS":
      return {
        ...state,
        editableData: {
          ...state.editableData,
          cardCounts: { ...state.editableData.cardCounts, ...action.payload },
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_MANA_CURVE":
      return {
        ...state,
        editableData: {
          ...state.editableData,
          manaCurve: { ...state.editableData.manaCurve, ...action.payload },
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_WINCON_STATS":
      return {
        ...state,
        editableData: {
          ...state.editableData,
          wincons: {
            ...state.editableData.wincons,
            stats: { ...state.editableData.wincons.stats, ...action.payload },
          },
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_RAMP_CARDS":
      if (action.payload.type === "stats") return state;
      return {
        ...state,
        editableData: {
          ...state.editableData,
          ramp: {
            ...state.editableData.ramp,
            [action.payload.type]: action.payload.cards,
          },
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_INTERACTION_CARDS":
      if (action.payload.type === "stats") return state;
      return {
        ...state,
        editableData: {
          ...state.editableData,
          interaction: {
            ...state.editableData.interaction,
            [action.payload.type]: action.payload.cards,
          },
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_WINCON_CARDS":
      if (action.payload.type === "stats") return state;
      return {
        ...state,
        editableData: {
          ...state.editableData,
          wincons: {
            ...state.editableData.wincons,
            [action.payload.type]: action.payload.cards,
          },
        },
        hasUnsavedChanges: true,
      };

    case "UPDATE_ARCHETYPE":
      return {
        ...state,
        editableData: {
          ...state.editableData,
          archetype: { ...state.editableData.archetype, ...action.payload },
        },
        hasUnsavedChanges: true,
      };

    case "START_SAVE":
      return {
        ...state,
        isSaving: true,
        saveError: null,
      };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        hasUnsavedChanges: false,
        saveResult: action.payload,
        saveError: null,
      };

    case "SAVE_ERROR":
      return {
        ...state,
        isSaving: false,
        saveError: action.payload,
      };

    case "RESET_STATE":
      return createInitialState();

    default:
      return state;
  }
};

// Create context
const DeckImportContext = createContext<DeckImportContextType | null>(null);

// Provider component
export function DeckImportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(deckImportReducer, createInitialState());

  const contextValue: DeckImportContextType = {
    state,
    actions: {
      setRawDecklist: (text: string) => {
        dispatch({ type: "SET_RAW_DECKLIST", payload: text });
      },

      analyzeDeck: async () => {
        if (!state.rawDecklist.trim()) {
          return;
        }

        dispatch({ type: "START_ANALYSIS" });

        try {
          // Import helper functions dynamically to avoid circular imports
          const { generateInitialEditableData } =
            await import("../utils/deckImportHelpers");
          const { parseDecklist, validateDecklist } =
            await import("../scripts/add_deck_scripts");

          // Parse and validate the decklist
          const validation = validateDecklist(state.rawDecklist);
          const parsed = parseDecklist(state.rawDecklist);

          // Generate initial editable data with empty lists for user to fill
          const editableData = generateInitialEditableData(parsed);

          dispatch({
            type: "ANALYSIS_SUCCESS",
            payload: {
              parsed,
              editable: editableData,
              issues: validation.issues,
            },
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Analysis failed";
          dispatch({
            type: "ANALYSIS_ERROR",
            payload: [
              {
                severity: "error",
                line_number: 0,
                message: errorMessage,
                raw_line: "",
              },
            ],
          });
        }
      },

      updateDeckName: (name: string) => {
        dispatch({ type: "UPDATE_DECK_NAME", payload: name });
      },

      updateOwner: (owner: string) => {
        dispatch({ type: "UPDATE_OWNER", payload: owner });
      },

      updateCardCounts: (counts: Partial<DeckCardCountsInsert>) => {
        dispatch({ type: "UPDATE_CARD_COUNTS", payload: counts });
      },

      updateManaCurve: (curve: Partial<DeckManaCurveInsert>) => {
        dispatch({ type: "UPDATE_MANA_CURVE", payload: curve });
      },

      updateWinconStats: (stats: Partial<DeckWinconSpeedInsert>) => {
        dispatch({ type: "UPDATE_WINCON_STATS", payload: stats });
      },

      updateRampCards: (
        type: keyof EditableDeckData["ramp"],
        cards: string[],
      ) => {
        dispatch({ type: "UPDATE_RAMP_CARDS", payload: { type, cards } });
      },

      updateInteractionCards: (
        type: keyof EditableDeckData["interaction"],
        cards: string[],
      ) => {
        dispatch({
          type: "UPDATE_INTERACTION_CARDS",
          payload: { type, cards },
        });
      },

      updateWinconCards: (
        type: keyof EditableDeckData["wincons"],
        cards: string[] | string,
      ) => {
        dispatch({ type: "UPDATE_WINCON_CARDS", payload: { type, cards } });
      },

      updateArchetype: (archetype: Partial<DeckArchetypeInsert>) => {
        dispatch({ type: "UPDATE_ARCHETYPE", payload: archetype });
      },

      saveDeck: async () => {
        if (!state.parsedDecklist || !state.isValid) {
          dispatch({
            type: "SAVE_ERROR",
            payload: "Cannot save: invalid deck data",
          });
          return;
        }

        dispatch({ type: "START_SAVE" });

        try {
          // Import helper functions dynamically to avoid circular imports
          const { createBuildOptions } =
            await import("../utils/deckImportHelpers");
          const { buildDeckImportPlan, storeDeckImportPlan } =
            await import("../scripts/add_deck_scripts");

          // Create build options from editable data
          const buildOptions = createBuildOptions(state.editableData);

          // Build the import plan
          const plan = buildDeckImportPlan(state.parsedDecklist, buildOptions);

          // Store the plan in the database
          const result = await storeDeckImportPlan(plan);

          dispatch({ type: "SAVE_SUCCESS", payload: result });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to save deck";
          dispatch({ type: "SAVE_ERROR", payload: errorMessage });
        }
      },

      resetState: () => {
        dispatch({ type: "RESET_STATE" });
      },
    },
  };

  return (
    <DeckImportContext.Provider value={contextValue}>
      {children}
    </DeckImportContext.Provider>
  );
}

// Hook to use the context
export function useDeckImport() {
  const context = useContext(DeckImportContext);
  if (!context) {
    throw new Error("useDeckImport must be used within a DeckImportProvider");
  }
  return context;
}
