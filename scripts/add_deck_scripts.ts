// ============================================================================
// Deck Import Script Contracts
// Defines the parsing and persistence surface for plain text decklists.
//
// Supported format:
// - "qty Card Name"
// - Mainboard only
// - Total quantity must equal exactly 100 cards
//
// Implementations will be added later.
// ============================================================================

import type { IDatabaseProvider } from "../services/databaseService";
import databaseService from "../services/databaseService";
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

export type DeckSection = "mainboard";

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

let is_database_initialized = false;

const CARD_LINE_REGEX = /^(\d+)\s+(.+?)\s*$/;
const PRINTING_SUFFIX_REGEX =
  /\s+\([A-Za-z0-9]{2,10}\)\s+[^\s]+(?:\s+\*[^*]+\*)?$/;

interface ParsedDecklistInternal {
  parsed_decklist: ParsedDecklist;
  issues: DecklistValidationIssue[];
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
  const formatted_message =
    line_number > 0 ? `Line ${line_number}: ${message}` : message;

  return {
    severity,
    line_number,
    message: formatted_message,
    raw_line,
  };
}

function parseCardLine(line: string): DecklistCard | null {
  const match = line.match(CARD_LINE_REGEX);
  if (!match) {
    return null;
  }

  const quantity = Number.parseInt(match[1], 10);
  const card_name = normalizeCardName(match[2]);

  if (!Number.isInteger(quantity) || quantity <= 0 || !card_name) {
    return null;
  }

  return {
    quantity,
    card_name,
    section: "mainboard",
    raw_line: line,
  };
}

function parseDecklistInternal(raw_decklist: string): ParsedDecklistInternal {
  const normalized_decklist = normalizeDecklist(raw_decklist);
  const issues: DecklistValidationIssue[] = [];
  const mainboard: DecklistCard[] = [];
  let last_non_empty_line_number = 1;

  if (!normalized_decklist) {
    issues.push(createIssue("error", 0, "Decklist is empty.", ""));
  }

  for (const [index, raw_line] of normalized_decklist.split("\n").entries()) {
    const line_number = index + 1;
    const trimmed_line = raw_line.trim();

    if (!trimmed_line) {
      continue;
    }

    last_non_empty_line_number = line_number;

    const parsed_card = parseCardLine(trimmed_line);
    if (!parsed_card) {
      issues.push(
        createIssue(
          "error",
          line_number,
          "Line must match the format 'qty Card Name'.",
          raw_line,
        ),
      );
      continue;
    }

    mainboard.push(parsed_card);
  }

  if (mainboard.length === 0) {
    issues.push(
      createIssue(
        "error",
        1,
        "No mainboard cards were found in the decklist.",
        normalized_decklist,
      ),
    );
  }

  const total_card_count = mainboard.reduce(
    (total, card) => total + card.quantity,
    0,
  );

  if (total_card_count > 0 && total_card_count !== 100) {
    issues.push(
      createIssue(
        "error",
        last_non_empty_line_number,
        `Decklist must contain exactly 100 total cards; found ${total_card_count}.`,
        normalized_decklist,
      ),
    );
  }

  return {
    parsed_decklist: {
      raw_decklist,
      normalized_decklist,
      commander: null,
      companion: null,
      mainboard,
      sideboard: [],
      ignored_lines: [],
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

/**
 * Returns a sorted list of unique mainboard card names from a parsed decklist.
 */
export function getParsedMainboardCardNames(
  parsed_decklist: ParsedDecklist | null,
): string[] {
  if (!parsed_decklist?.mainboard) {
    return [];
  }

  const unique_card_names = new Set(
    parsed_decklist.mainboard.map((card) => card.card_name),
  );

  return Array.from(unique_card_names).sort((left, right) =>
    left.localeCompare(right),
  );
}

/**
 * Filters available card names by selected cards and an optional search query.
 */
export function getSelectableCardNames(
  available_card_names: string[],
  selected_card_names: string[],
  search_query: string,
): string[] {
  const normalized_query = search_query.trim().toLowerCase();

  return available_card_names.filter((card_name) => {
    if (selected_card_names.includes(card_name)) {
      return false;
    }

    if (!normalized_query) {
      return true;
    }

    return card_name.toLowerCase().includes(normalized_query);
  });
}

async function ensureDatabaseInitialized(
  database: IDatabaseProvider,
): Promise<void> {
  if (is_database_initialized) {
    return;
  }

  await database.initialize();
  is_database_initialized = true;
}

function getCommanderName(
  parsed_decklist: ParsedDecklist,
  metadata?: DeckMetadata,
): string {
  const commander_name = metadata?.commander_override?.trim();

  if (commander_name) {
    return commander_name;
  }

  if (parsed_decklist.commander?.card_name?.trim()) {
    return parsed_decklist.commander.card_name.trim();
  }

  throw new Error(
    "Commander name is required. Choose a commander before saving.",
  );
}

export function buildCommanderInsert(
  parsed_decklist: ParsedDecklist,
  metadata?: DeckMetadata,
): CommanderInsert {
  const commander_name = getCommanderName(parsed_decklist, metadata);

  return {
    name: commander_name,
    color_identity: null,
    cmc: null,
    power: null,
    toughness: null,
    card_types: null,
    subtypes: null,
  };
}

export function buildDeckImportPlan(
  parsed_decklist: ParsedDecklist,
  options?: BuildDeckImportPlanOptions,
): DeckImportPlan {
  const commander = buildCommanderInsert(parsed_decklist, options);

  return {
    parsed_decklist,
    commander,
    deck: {
      deck_name: options?.deck_name ?? null,
      owner: options?.owner ?? null,
      created_date: options?.created_date ?? new Date().toISOString(),
    },
    features: options?.features,
  };
}

export async function ensureCommanderRecord(
  commander: CommanderInsert,
  options?: StoreDeckPlanOptions,
): Promise<Commander> {
  const database = options?.database ?? databaseService;
  await ensureDatabaseInitialized(database);

  const should_reuse = options?.reuse_existing_commander ?? true;

  if (should_reuse) {
    const existing = await database.getCommanderByName(commander.name);
    if (existing) {
      return existing;
    }
  }

  const commander_id = await database.createCommander(commander);
  const created_commander = await database.getCommander(commander_id);

  if (!created_commander) {
    throw new Error("Commander record could not be loaded after creation.");
  }

  return created_commander;
}

export async function storeDeckFeatures(
  deck_id: number,
  features: DeckFeatureInput,
  options?: StoreDeckPlanOptions,
): Promise<void> {
  const database = options?.database ?? databaseService;
  await ensureDatabaseInitialized(database);

  if (features.card_counts) {
    await database.upsertDeckCardCounts({
      deck_id,
      ...features.card_counts,
    });
  }

  if (features.color_identity) {
    await database.upsertDeckColorIdentity({
      deck_id,
      ...features.color_identity,
    });
  }

  if (features.mana_curve) {
    await database.upsertDeckManaCurve({
      deck_id,
      ...features.mana_curve,
    });
  }

  if (features.ramp) {
    await database.upsertDeckRamp({
      deck_id,
      ...features.ramp,
    });
  }

  if (features.interaction) {
    await database.upsertDeckInteraction({
      deck_id,
      ...features.interaction,
    });
  }

  if (features.wincon_speed) {
    await database.upsertDeckWinconSpeed({
      deck_id,
      ...features.wincon_speed,
    });
  }

  if (features.archetype) {
    await database.upsertDeckArchetype({
      deck_id,
      ...features.archetype,
    });
  }
}

export async function storeDeckImportPlan(
  plan: DeckImportPlan,
  options?: StoreDeckPlanOptions,
): Promise<StoredDeckImportResult> {
  const database = options?.database ?? databaseService;
  await ensureDatabaseInitialized(database);

  const commander = await ensureCommanderRecord(plan.commander, {
    ...options,
    database,
  });

  const deck_id = await database.createDeck({
    commander_id: commander.commander_id,
    ...plan.deck,
  });

  const deck = await database.getDeck(deck_id);
  if (!deck) {
    throw new Error("Deck record could not be loaded after creation.");
  }

  if (plan.features) {
    await storeDeckFeatures(deck_id, plan.features, {
      ...options,
      database,
    });
  }

  const deck_profile = await database.getDeckProfile(deck_id);

  return {
    commander,
    deck,
    deck_profile,
  };
}

export async function importDecklist(
  raw_decklist: string,
  options?: ImportDecklistOptions,
): Promise<StoredDeckImportResult> {
  const validation = validateDecklist(raw_decklist);
  if (!validation.is_valid) {
    const error_text = validation.issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => issue.message)
      .join("\n");

    throw new Error(error_text || "Decklist validation failed.");
  }

  const parsed_decklist = parseDecklist(raw_decklist);
  const plan = buildDeckImportPlan(parsed_decklist, options);

  return storeDeckImportPlan(plan, options);
}
