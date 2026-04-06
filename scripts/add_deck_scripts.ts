// ============================================================================
// MTGO Deck Import Script Contracts
// Defines the parsing and persistence surface for MTGO-formatted decklists.
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

export type MtgoDeckSection =
	| "commander"
	| "mainboard"
	| "sideboard"
	| "companion"
	| "unknown";

export type DecklistIssueSeverity = "error" | "warning";

export interface MtgoDecklistCard {
	quantity: number;
	card_name: string;
	section: MtgoDeckSection;
	raw_line: string;
}

export interface DecklistValidationIssue {
	severity: DecklistIssueSeverity;
	line_number: number;
	message: string;
	raw_line: string;
}

export interface MtgoDecklistValidationResult {
	is_valid: boolean;
	issues: DecklistValidationIssue[];
}

export interface ParsedMtgoDecklist {
	raw_decklist: string;
	normalized_decklist: string;
	commander: MtgoDecklistCard | null;
	companion: MtgoDecklistCard | null;
	mainboard: MtgoDecklistCard[];
	sideboard: MtgoDecklistCard[];
	ignored_lines: string[];
	total_card_count: number;
}

export interface MtgoDeckMetadata {
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

export interface BuildDeckImportPlanOptions extends MtgoDeckMetadata {
	features?: DeckFeatureInput;
}

export interface DeckImportPlan {
	parsed_decklist: ParsedMtgoDecklist;
	commander: CommanderInsert;
	deck: Omit<DeckInsert, "commander_id">;
	features?: DeckFeatureInput;
}

export interface StoreDeckPlanOptions {
	database?: IDatabaseProvider;
	reuse_existing_commander?: boolean;
}

export interface ImportMtgoDecklistOptions
	extends BuildDeckImportPlanOptions,
		StoreDeckPlanOptions {}

export interface StoredDeckImportResult {
	commander: Commander;
	deck: Deck;
	deck_profile: DeckProfile | null;
}

export declare function normalizeMtgoDecklist(
	raw_decklist: string,
): string;

export declare function validateMtgoDecklist(
	raw_decklist: string,
): MtgoDecklistValidationResult;

export declare function parseMtgoDecklist(
	raw_decklist: string,
): ParsedMtgoDecklist;

export declare function buildCommanderInsert(
	parsed_decklist: ParsedMtgoDecklist,
	metadata?: MtgoDeckMetadata,
): CommanderInsert;

export declare function buildDeckImportPlan(
	parsed_decklist: ParsedMtgoDecklist,
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

export declare function importMtgoDecklist(
	raw_decklist: string,
	options?: ImportMtgoDecklistOptions,
): Promise<StoredDeckImportResult>;
