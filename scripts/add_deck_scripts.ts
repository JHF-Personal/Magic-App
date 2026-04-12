// ============================================================================
// Deck Import Script Contracts
// Defines the parsing and persistence surface for plain text decklists.
//
// Supported formats:
// - "1 Card Name" (quantity + card name)
// - "Card Name" (assumes quantity of 1)
// - "Commander: Card Name" or "Commander: 1 Card Name"
// - Section headers: "Commander", "Creatures", "Spells", "Lands", etc.
// - Comments: Lines starting with "//" or "#"
//
// Implementations will be added later.
// ============================================================================

import type { IDatabaseProvider } from "../services/databaseService";
import type {
  Commander,
  CommanderInsert,
  Deck,
  DeckArchetypeInsert,
  DeckCardCountsInsert,
  DeckColorIdentityInsert,
  DeckInsert,
  DeckInteractionInsert,
  DeckManaCurveInsert,
  DeckProfile,
  DeckRampInsert,
  DeckWinconSpeedInsert,
} from "../types/databaseTypes";

export type DeckSection =
  | "commander"
  | "mainboard"
  | "sideboard"
  | "companion"
  | "unknown";

export type DecklistIssueSeverity = "error" | "warning";

export interface DecklistCard {
  quantity: number;
  card_name: string;
  section: DeckSection;
  raw_line: string;
}

export interface DecklistValidationIssue {
  severity: DecklistIssueSeverity;
  line_number: number;
  message: string;
  raw_line: string;
}

export interface DecklistValidationResult {
  is_valid: boolean;
  issues: DecklistValidationIssue[];
}

export interface ParsedDecklist {
  raw_decklist: string;
  normalized_decklist: string;
  commander: DecklistCard | null;
  companion: DecklistCard | null;
  mainboard: DecklistCard[];
  sideboard: DecklistCard[];
  ignored_lines: string[];
  total_card_count: number;
}

export interface DeckMetadata {
  deck_name?: string | null;
  owner?: string | null;
  created_date?: string;
  commander_override?: string | null;
}

export interface DeckFeatureInput {
  card_counts?: Omit<DeckCardCountsInsert, "deck_id">;
  color_identity?: Omit<DeckColorIdentityInsert, "deck_id">;
  mana_curve?: Omit<DeckManaCurveInsert, "deck_id">;
  ramp?: Omit<DeckRampInsert, "deck_id">;
  interaction?: Omit<DeckInteractionInsert, "deck_id">;
  wincon_speed?: Omit<DeckWinconSpeedInsert, "deck_id">;
  archetype?: Omit<DeckArchetypeInsert, "deck_id">;
}

export interface BuildDeckImportPlanOptions extends DeckMetadata {
  features?: DeckFeatureInput;
}

export interface DeckImportPlan {
  parsed_decklist: ParsedDecklist;
  commander: CommanderInsert;
  deck: Omit<DeckInsert, "commander_id">;
  features?: DeckFeatureInput;
}

export interface StoreDeckPlanOptions {
  database?: IDatabaseProvider;
  reuse_existing_commander?: boolean;
}

export interface ImportDecklistOptions
  extends BuildDeckImportPlanOptions, StoreDeckPlanOptions {}

export interface StoredDeckImportResult {
  commander: Commander;
  deck: Deck;
  deck_profile: DeckProfile | null;
}

const CARD_LINE_REGEX = /^(\d+)\s+(.+?)\s*$/;
const CARD_LINE_WITHOUT_QUANTITY_REGEX = /^([a-zA-Z].+?)\s*$/;
const PREFIXED_CARD_LINE_REGEX =
  /^(SB|SIDEBOARD|CMDR|CMD|COMMANDER|COMPANION):\s*(\d+)?\s*(.+?)\s*$/i;
const PRINTING_SUFFIX_REGEX =
  /\s+\([A-Za-z0-9]{2,10}\)\s+[^\s]+(?:\s+\*[^*]+\*)?$/;

interface ParsedDecklistInternal {
  parsed_decklist: ParsedDecklist;
  issues: DecklistValidationIssue[];
}

function getSectionFromHeader(line: string): DeckSection | null {
  const normalized_line = line.trim().replace(/:$/, "").toLowerCase();

  switch (normalized_line) {
    case "deck":
    case "main":
    case "maindeck":
    case "mainboard":
    case "creatures":
    case "spells":
    case "lands":
    case "artifacts":
    case "enchantments":
    case "planeswalkers":
    case "instants":
    case "sorceries":
      return "mainboard";
    case "commander":
    case "cmdr":
    case "cmd":
    case "general":
      return "commander";
    case "companion":
      return "companion";
    case "side":
    case "sideboard":
    case "sb":
      return "sideboard";
    default:
      return null;
  }
}

function getSectionFromPrefix(prefix: string): DeckSection {
  switch (prefix.toUpperCase()) {
    case "SB":
    case "SIDEBOARD":
      return "sideboard";
    case "COMPANION":
      return "companion";
    case "CMDR":
    case "CMD":
    case "COMMANDER":
    default:
      return "commander";
  }
}

function normalizeCardName(card_name: string): string {
  return (
    card_name
      .trim()
      // Remove set codes and collector numbers (if present)
      .replace(PRINTING_SUFFIX_REGEX, "")
      // Remove extra whitespace characters and normalize
      .replace(/\s+/g, " ")
      // Remove common formatting characters
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .trim()
  );
}

function createIssue(
  severity: DecklistIssueSeverity,
  line_number: number,
  message: string,
  raw_line: string,
): DecklistValidationIssue {
  return {
    severity,
    line_number,
    message,
    raw_line,
  };
}

function parseCardLine(
  line: string,
  current_section: DeckSection,
): DecklistCard | null {
  const prefixed_match = line.match(PREFIXED_CARD_LINE_REGEX);
  if (prefixed_match) {
    const quantity = prefixed_match[2]
      ? Number.parseInt(prefixed_match[2], 10)
      : 1;
    const card_name = normalizeCardName(prefixed_match[3]);

    if (!Number.isInteger(quantity) || quantity <= 0 || !card_name) {
      return null;
    }

    return {
      quantity,
      card_name,
      section: getSectionFromPrefix(prefixed_match[1]),
      raw_line: line,
    };
  }

  const match = line.match(CARD_LINE_REGEX);
  if (match) {
    const quantity = Number.parseInt(match[1], 10);
    const card_name = normalizeCardName(match[2]);

    if (!Number.isInteger(quantity) || quantity <= 0 || !card_name) {
      return null;
    }

    return {
      quantity,
      card_name,
      section: current_section,
      raw_line: line,
    };
  }

  // Handle card names without explicit quantity (assume 1)
  const no_quantity_match = line.match(CARD_LINE_WITHOUT_QUANTITY_REGEX);
  if (no_quantity_match) {
    const card_name = normalizeCardName(no_quantity_match[1]);

    if (!card_name) {
      return null;
    }

    return {
      quantity: 1,
      card_name,
      section: current_section,
      raw_line: line,
    };
  }

  return null;
}

function parseDecklistInternal(raw_decklist: string): ParsedDecklistInternal {
  const normalized_decklist = normalizeDecklist(raw_decklist);
  const issues: DecklistValidationIssue[] = [];
  const ignored_lines: string[] = [];
  const commander_cards: DecklistCard[] = [];
  const companion_cards: DecklistCard[] = [];
  const mainboard: DecklistCard[] = [];
  const sideboard: DecklistCard[] = [];
  let current_section: DeckSection = "mainboard";

  if (!normalized_decklist) {
    issues.push(createIssue("error", 0, "Decklist is empty.", ""));
  }

  for (const [index, raw_line] of normalized_decklist.split("\n").entries()) {
    const line_number = index + 1;
    const trimmed_line = raw_line.trim();

    if (!trimmed_line) {
      continue;
    }

    const section = getSectionFromHeader(trimmed_line);
    if (section) {
      current_section = section;
      continue;
    }

    if (trimmed_line.startsWith("//") || trimmed_line.startsWith("#")) {
      ignored_lines.push(raw_line);
      continue;
    }

    const parsed_card = parseCardLine(trimmed_line, current_section);
    if (!parsed_card) {
      ignored_lines.push(raw_line);
      issues.push(
        createIssue(
          "warning",
          line_number,
          "Line does not match expected card format (try '1 Card Name' or 'Card Name').",
          raw_line,
        ),
      );
      continue;
    }

    switch (parsed_card.section) {
      case "commander":
        commander_cards.push(parsed_card);
        break;
      case "companion":
        companion_cards.push(parsed_card);
        break;
      case "sideboard":
        sideboard.push(parsed_card);
        break;
      case "mainboard":
      case "unknown":
      default:
        mainboard.push(parsed_card);
        break;
    }
  }

  if (commander_cards.length > 1) {
    issues.push(
      createIssue(
        "warning",
        0,
        "Multiple commander entries were found. Analysis will ignore the commander slot until you choose one.",
        commander_cards.map((card) => card.raw_line).join("\n"),
      ),
    );
  }

  if (companion_cards.length > 1) {
    issues.push(
      createIssue(
        "error",
        0,
        "Multiple companion entries were found. Expected at most one companion.",
        companion_cards.map((card) => card.raw_line).join("\n"),
      ),
    );
  }

  let commander = commander_cards[0] ?? null;
  let resolved_sideboard = sideboard;

  if (!commander && sideboard.length === 1) {
    commander = {
      ...sideboard[0],
      section: "commander",
    };
    resolved_sideboard = [];
  }

  const companion = companion_cards[0] ?? null;

  if (!commander) {
    issues.push(
      createIssue(
        "warning",
        0,
        "No commander entry was found in the decklist. Choose a commander after analysis before saving.",
        normalized_decklist,
      ),
    );
  } else if (commander.quantity !== 1) {
    issues.push(
      createIssue(
        "warning",
        0,
        "Commander entry should have a quantity of 1. Analysis will ignore the commander slot until you choose one.",
        commander.raw_line,
      ),
    );
  }

  if (companion && companion.quantity !== 1) {
    issues.push(
      createIssue(
        "error",
        0,
        "Companion entry must have a quantity of 1.",
        companion.raw_line,
      ),
    );
  }

  if (mainboard.length === 0) {
    issues.push(
      createIssue(
        "error",
        0,
        "No mainboard cards were found in the decklist.",
        normalized_decklist,
      ),
    );
  }

  const total_card_count = mainboard.reduce(
    (total, card) => total + card.quantity,
    0,
  );

  if (total_card_count > 0 && total_card_count !== 99) {
    issues.push(
      createIssue(
        "warning",
        0,
        `Commander mainboard usually contains 99 cards; found ${total_card_count}.`,
        normalized_decklist,
      ),
    );
  }

  if (resolved_sideboard.length > 0) {
    issues.push(
      createIssue(
        "warning",
        0,
        "Additional sideboard cards were found after commander extraction.",
        resolved_sideboard.map((card) => card.raw_line).join("\n"),
      ),
    );
  }

  return {
    parsed_decklist: {
      raw_decklist,
      normalized_decklist,
      commander,
      companion,
      mainboard,
      sideboard: resolved_sideboard,
      ignored_lines,
      total_card_count,
    },
    issues,
  };
}

export function normalizeDecklist(raw_decklist: string): string {
  return raw_decklist
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").replace(/\s+$/g, ""))
    .join("\n")
    .trim();
}

export function validateDecklist(
  raw_decklist: string,
): DecklistValidationResult {
  const { issues } = parseDecklistInternal(raw_decklist);

  return {
    is_valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}

export function parseDecklist(raw_decklist: string): ParsedDecklist {
  return parseDecklistInternal(raw_decklist).parsed_decklist;
}

export declare function buildCommanderInsert(
  parsed_decklist: ParsedDecklist,
  metadata?: DeckMetadata,
): CommanderInsert;

export declare function buildDeckImportPlan(
  parsed_decklist: ParsedDecklist,
  options?: BuildDeckImportPlanOptions,
): DeckImportPlan;

export declare function ensureCommanderRecord(
  commander: CommanderInsert,
  options?: StoreDeckPlanOptions,
): Promise<Commander>;

export declare function storeDeckFeatures(
  deck_id: number,
  features: DeckFeatureInput,
  options?: StoreDeckPlanOptions,
): Promise<void>;

export declare function storeDeckImportPlan(
  plan: DeckImportPlan,
  options?: StoreDeckPlanOptions,
): Promise<StoredDeckImportResult>;

export declare function importDecklist(
  raw_decklist: string,
  options?: ImportDecklistOptions,
): Promise<StoredDeckImportResult>;
