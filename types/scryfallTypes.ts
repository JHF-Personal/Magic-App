// ============================================================================
// Scryfall REST API Types
// Covers common request and response shapes used when interacting with the
// public Scryfall API.
// ============================================================================

export type ScryfallUuid = string;
export type ScryfallUri = string;
export type ScryfallDate = string;

export type ScryfallColor = "W" | "U" | "B" | "R" | "G";
export type ScryfallColors = ScryfallColor[];

export type ScryfallObjectType =
	| "card"
	| "card_face"
	| "related_card"
	| "list"
	| "catalog"
	| "set"
	| "ruling"
	| "card_symbol"
	| "mana_cost"
	| "error";

export type ScryfallCardLayout =
	| "normal"
	| "split"
	| "flip"
	| "transform"
	| "modal_dfc"
	| "meld"
	| "leveler"
	| "class"
	| "case"
	| "saga"
	| "adventure"
	| "mutate"
	| "prototype"
	| "planar"
	| "scheme"
	| "vanguard"
	| "token"
	| "double_faced_token"
	| "emblem"
	| "augment"
	| "host"
	| "art_series"
	| "reversible_card";

export type ScryfallImageStatus =
	| "missing"
	| "placeholder"
	| "lowres"
	| "highres_scan";

export type ScryfallBorderColor =
	| "black"
	| "white"
	| "borderless"
	| "yellow"
	| "silver"
	| "gold";

export type ScryfallFrame = "1993" | "1997" | "2003" | "2015" | "future";

export type ScryfallFinish = "nonfoil" | "foil" | "etched";

export type ScryfallGame = "paper" | "arena" | "mtgo" | "astral" | "sega";

export type ScryfallRarity =
	| "common"
	| "uncommon"
	| "rare"
	| "special"
	| "mythic"
	| "bonus";

export type ScryfallSecurityStamp =
	| "oval"
	| "triangle"
	| "acorn"
	| "circle"
	| "arena"
	| "heart";

export type ScryfallLegality =
	| "legal"
	| "not_legal"
	| "restricted"
	| "banned";

export type ScryfallSetType =
	| "core"
	| "expansion"
	| "masters"
	| "alchemy"
	| "masterpiece"
	| "arsenal"
	| "from_the_vault"
	| "spellbook"
	| "premium_deck"
	| "duel_deck"
	| "draft_innovation"
	| "treasure_chest"
	| "commander"
	| "planechase"
	| "archenemy"
	| "vanguard"
	| "funny"
	| "starter"
	| "box"
	| "promo"
	| "token"
	| "memorabilia"
	| "minigame"
	| "eternal";

export type ScryfallRelatedCardComponent =
	| "token"
	| "meld_part"
	| "meld_result"
	| "combo_piece";

export type ScryfallRulingSource = "wotc" | "scryfall";

export type ScryfallSearchUniqueMode = "cards" | "art" | "prints";

export type ScryfallSearchOrder =
	| "name"
	| "set"
	| "released"
	| "rarity"
	| "color"
	| "usd"
	| "tix"
	| "eur"
	| "cmc"
	| "power"
	| "toughness"
	| "edhrec"
	| "penny"
	| "artist"
	| "review";

export type ScryfallSortDirection = "auto" | "asc" | "desc";

export interface ScryfallList<T> {
	object: "list";
	has_more: boolean;
	data: T[];
	next_page?: ScryfallUri;
	total_cards?: number;
	warnings?: string[];
}

export interface ScryfallCatalog {
	object: "catalog";
	uri: ScryfallUri;
	total_values: number;
	data: string[];
}

export interface ScryfallError {
	object: "error";
	status: number;
	code: string;
	details: string;
	type?: string | null;
	warnings?: string[] | null;
}

export interface ScryfallImageUris {
	small?: ScryfallUri;
	normal?: ScryfallUri;
	large?: ScryfallUri;
	png?: ScryfallUri;
	art_crop?: ScryfallUri;
	border_crop?: ScryfallUri;
}

export interface ScryfallPrices {
	usd: string | null;
	usd_foil: string | null;
	usd_etched?: string | null;
	eur: string | null;
	eur_foil: string | null;
	eur_etched?: string | null;
	tix: string | null;
}

export interface ScryfallLegalities {
	standard: ScryfallLegality;
	future: ScryfallLegality;
	historic: ScryfallLegality;
	timeless: ScryfallLegality;
	gladiator: ScryfallLegality;
	pioneer: ScryfallLegality;
	explorer: ScryfallLegality;
	modern: ScryfallLegality;
	legacy: ScryfallLegality;
	pauper: ScryfallLegality;
	vintage: ScryfallLegality;
	penny: ScryfallLegality;
	commander: ScryfallLegality;
	oathbreaker: ScryfallLegality;
	standardbrawl: ScryfallLegality;
	brawl: ScryfallLegality;
	alchemy: ScryfallLegality;
	paupercommander: ScryfallLegality;
	duel: ScryfallLegality;
	oldschool: ScryfallLegality;
	premodern: ScryfallLegality;
	predh?: ScryfallLegality;
}

export interface ScryfallPreview {
	previewed_at?: ScryfallDate | null;
	source_uri?: ScryfallUri | null;
	source?: string | null;
}

export interface ScryfallPurchaseUris {
	tcgplayer?: ScryfallUri;
	cardmarket?: ScryfallUri;
	cardhoarder?: ScryfallUri;
}

export interface ScryfallRelatedUris {
	gatherer?: ScryfallUri;
	tcgplayer_infinite_articles?: ScryfallUri;
	tcgplayer_infinite_decks?: ScryfallUri;
	edhrec?: ScryfallUri;
	mtgtop8?: ScryfallUri;
}

export interface ScryfallRelatedCard {
	object: "related_card";
	id: ScryfallUuid;
	component: ScryfallRelatedCardComponent;
	name: string;
	type_line: string;
	uri: ScryfallUri;
}

export interface ScryfallCardFace {
	object: "card_face";
	artist?: string | null;
	artist_id?: ScryfallUuid | null;
	cmc?: number | null;
	color_indicator?: ScryfallColors | null;
	colors?: ScryfallColors | null;
	defense?: string | null;
	flavor_text?: string | null;
	illustration_id?: ScryfallUuid | null;
	image_uris?: ScryfallImageUris | null;
	layout?: ScryfallCardLayout | null;
	loyalty?: string | null;
	mana_cost: string;
	name: string;
	oracle_id?: ScryfallUuid | null;
	oracle_text?: string | null;
	power?: string | null;
	printed_name?: string | null;
	printed_text?: string | null;
	printed_type_line?: string | null;
	toughness?: string | null;
	type_line?: string | null;
	watermark?: string | null;
}

export interface ScryfallCard {
	object: "card";
	id: ScryfallUuid;
	oracle_id?: ScryfallUuid | null;
	prints_search_uri: ScryfallUri;
	rulings_uri: ScryfallUri;
	scryfall_uri: ScryfallUri;
	uri: ScryfallUri;

	arena_id?: number | null;
	cardmarket_id?: number | null;
	mtgo_id?: number | null;
	mtgo_foil_id?: number | null;
	multiverse_ids?: number[] | null;
	resource_id?: string | null;
	tcgplayer_id?: number | null;
	tcgplayer_etched_id?: number | null;

	lang: string;
	layout: ScryfallCardLayout;
	cmc: number;
	name: string;
	oracle_text?: string | null;
	mana_cost?: string | null;
	type_line: string;
	power?: string | null;
	toughness?: string | null;
	loyalty?: string | null;
	defense?: string | null;
	keywords: string[];
	legalities: ScryfallLegalities;
	color_identity: ScryfallColors;
	colors?: ScryfallColors | null;
	color_indicator?: ScryfallColors | null;
	produced_mana?: ScryfallColors | null;
	all_parts?: ScryfallRelatedCard[] | null;
	card_faces?: ScryfallCardFace[] | null;
	edhrec_rank?: number | null;
	game_changer?: boolean | null;
	hand_modifier?: string | null;
	life_modifier?: string | null;
	penny_rank?: number | null;
	reserved: boolean;

	artist?: string | null;
	artist_ids?: ScryfallUuid[] | null;
	attraction_lights?: number[] | null;
	booster: boolean;
	border_color: ScryfallBorderColor;
	card_back_id: ScryfallUuid;
	collector_number: string;
	content_warning?: boolean | null;
	digital: boolean;
	finishes: ScryfallFinish[];
	flavor_name?: string | null;
	flavor_text?: string | null;
	frame: ScryfallFrame;
	frame_effects?: string[] | null;
	full_art: boolean;
	games: ScryfallGame[];
	highres_image: boolean;
	illustration_id?: ScryfallUuid | null;
	image_status: ScryfallImageStatus;
	image_uris?: ScryfallImageUris | null;
	oversized: boolean;
	prices: ScryfallPrices;
	printed_name?: string | null;
	printed_text?: string | null;
	printed_type_line?: string | null;
	promo: boolean;
	promo_types?: string[] | null;
	purchase_uris?: ScryfallPurchaseUris | null;
	rarity: ScryfallRarity;
	related_uris: ScryfallRelatedUris;
	released_at: ScryfallDate;
	reprint: boolean;
	scryfall_set_uri: ScryfallUri;
	security_stamp?: ScryfallSecurityStamp | null;
	set: string;
	set_id: ScryfallUuid;
	set_name: string;
	set_search_uri: ScryfallUri;
	set_type: ScryfallSetType;
	set_uri: ScryfallUri;
	story_spotlight: boolean;
	textless: boolean;
	variation: boolean;
	variation_of?: ScryfallUuid | null;
	watermark?: string | null;
	preview?: ScryfallPreview | null;
}

export interface ScryfallSet {
	object: "set";
	id: ScryfallUuid;
	code: string;
	mtgo_code?: string | null;
	arena_code?: string | null;
	tcgplayer_id?: number | null;
	name: string;
	set_type: ScryfallSetType;
	released_at?: ScryfallDate | null;
	block_code?: string | null;
	block?: string | null;
	parent_set_code?: string | null;
	card_count: number;
	printed_size?: number | null;
	digital: boolean;
	foil_only: boolean;
	nonfoil_only: boolean;
	scryfall_uri: ScryfallUri;
	uri: ScryfallUri;
	icon_svg_uri: ScryfallUri;
	search_uri: ScryfallUri;
}

export interface ScryfallRuling {
	object: "ruling";
	oracle_id: ScryfallUuid;
	source: ScryfallRulingSource;
	published_at: ScryfallDate;
	comment: string;
}

export interface ScryfallCardSymbol {
	object: "card_symbol";
	symbol: string;
	svg_uri?: ScryfallUri | null;
	loose_variant?: string | null;
	english: string;
	transposable: boolean;
	represents_mana: boolean;
	appears_in_mana_costs: boolean;
	mana_value: number | null;
	hybrid: boolean;
	phyrexian: boolean;
	cmc: number | null;
	funny: boolean;
	colors: ScryfallColors;
	gatherer_alternates?: string[] | null;
}

export interface ScryfallParseManaResult {
	object: "mana_cost";
	cost: string;
	colors: ScryfallColors;
	cmc: number;
	costs?: string[];
	colorless: boolean;
	monocolored: boolean;
	multicolored: boolean;
}

export interface ScryfallCollectionIdentifier {
	id?: ScryfallUuid;
	mtgo_id?: number;
	multiverse_id?: number;
	oracle_id?: ScryfallUuid;
	illustration_id?: ScryfallUuid;
	name?: string;
	set?: string;
	collector_number?: string;
}

export interface ScryfallCollectionRequest {
	identifiers: ScryfallCollectionIdentifier[];
}

export interface ScryfallNamedCardRequest {
	exact?: string;
	fuzzy?: string;
	set?: string;
	format?: "json" | "text" | "image";
	face?: "front" | "back";
	version?: "small" | "normal" | "large" | "png" | "art_crop" | "border_crop";
}

export interface ScryfallSearchCardsRequest {
	q: string;
	unique?: ScryfallSearchUniqueMode;
	order?: ScryfallSearchOrder;
	dir?: ScryfallSortDirection;
	include_extras?: boolean;
	include_multilingual?: boolean;
	include_variations?: boolean;
	page?: number;
}

export interface ScryfallAutocompleteRequest {
	q: string;
	include_extras?: boolean;
}

export type ScryfallCardList = ScryfallList<ScryfallCard>;
export type ScryfallSetList = ScryfallList<ScryfallSet>;
export type ScryfallRulingList = ScryfallList<ScryfallRuling>;
export type ScryfallCardSymbolList = ScryfallList<ScryfallCardSymbol>;
export type ScryfallNamedCardResponse = ScryfallCard;
export type ScryfallSearchCardsResponse = ScryfallCardList;
export type ScryfallCollectionResponse = ScryfallCardList;
export type ScryfallAutocompleteResponse = ScryfallCatalog;
export type ScryfallParseManaResponse = ScryfallParseManaResult;

export type ScryfallApiResponse =
	| ScryfallCard
	| ScryfallCardList
	| ScryfallCatalog
	| ScryfallSet
	| ScryfallSetList
	| ScryfallRulingList
	| ScryfallCardSymbolList
	| ScryfallParseManaResult
	| ScryfallError;
