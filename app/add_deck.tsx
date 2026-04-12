import React from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	DeckImportProvider,
	useDeckImport,
} from "../contexts/DeckImportContext";
import {
	getParsedMainboardCardNames,
	getSelectableCardNames,
} from "../scripts/add_deck_scripts";
import {
	Archetype,
	DeckArchetypeInsert,
	DeckWinconSpeedInsert,
} from "../types/databaseTypes";

const COLOR_IDENTITY = ["W", "U", "B", "R", "G"];

const MANA_CURVE_BARS = [0.3, 0.55, 0.9, 0.78, 0.52, 0.28];

const SUMMARY_ITEMS = [
  "Num combo pieces:",
  "Num known combos:",
  "Num finishers:",
  "Est win turn:",
];

const ARCHETYPE_OPTIONS: Archetype[] = [
  "aggro",
  "control",
  "combo",
  "midrange",
  "stax",
  "hybrid",
];

type ArchetypeLabelValue = Exclude<
  DeckArchetypeInsert["primary_archetype"],
  undefined
>;

function formatArchetypeLabel(archetype: ArchetypeLabelValue): string {
  if (!archetype) return "None";
  return archetype.charAt(0).toUpperCase() + archetype.slice(1);
}

interface CardSelectionPanelProps {
  availableCards: string[];
  selectedCards: string[];
  onSelectCard: (cardName: string) => void;
  title: string;
}

function CardSelectionPanel({
  availableCards,
  selectedCards,
  onSelectCard,
  title,
}: CardSelectionPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectableCards = React.useMemo(() => {
    return getSelectableCardNames(availableCards, selectedCards, search);
  }, [availableCards, selectedCards, search]);

  return (
    <View style={styles.selectorPanel}>
      <View style={styles.selectorHeaderRow}>
        <Text style={styles.selectorTitle}>{title}</Text>
        <Pressable
          style={[
            styles.selectorToggleButton,
            availableCards.length === 0 && styles.buttonDisabled,
          ]}
          onPress={() => setIsOpen((current) => !current)}
          disabled={availableCards.length === 0}
        >
          <Text style={styles.selectorToggleButtonText}>
            {isOpen ? "Hide" : "Select"}
          </Text>
        </Pressable>
      </View>

      {isOpen && (
        <>
          <TextInput
            placeholder="Search analyzed cards"
            placeholderTextColor="#8A907C"
            style={styles.selectorSearchInput}
            value={search}
            onChangeText={setSearch}
          />

          <ScrollView style={styles.selectorList} nestedScrollEnabled>
            {selectableCards.map((cardName) => (
              <Pressable
                key={cardName}
                style={styles.selectorItem}
                onPress={() => onSelectCard(cardName)}
              >
                <Text style={styles.selectorItemText}>{cardName}</Text>
              </Pressable>
            ))}

            {selectableCards.length === 0 && (
              <View style={styles.selectorEmptyState}>
                <Text style={styles.selectorEmptyStateText}>
                  No available cards to select.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

// Decklist input component using context
function DecklistSection() {
  const { state, actions } = useDeckImport();

  const handleAnalyze = async () => {
    await actions.analyzeDeck();
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>Decklist</Text>
      <TextInput
        multiline
        placeholder="Paste decklist here. Decklist should be in the form: qty Card Name"
        placeholderTextColor="#8A907C"
        style={[styles.inputPanel, styles.decklistInput]}
        textAlignVertical="top"
        value={state.rawDecklist}
        onChangeText={actions.setRawDecklist}
        editable={!state.isAnalyzing}
      />

      <View style={styles.inlineActionRow}>
        <Pressable
          onPress={handleAnalyze}
          style={[
            styles.secondaryButton,
            state.isAnalyzing && styles.buttonDisabled,
          ]}
          disabled={state.isAnalyzing || !state.rawDecklist.trim()}
        >
          <Text style={styles.secondaryButtonText}>
            {state.isAnalyzing ? "Analyzing..." : "Analyze Deck"}
          </Text>
        </Pressable>
        {state.validationIssues.filter((issue) => issue.severity === "error")
          .length > 0 && (
          <View style={styles.errorContainer}>
            {state.validationIssues
              .filter((issue) => issue.severity === "error")
              .map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  {error.message}
                </Text>
              ))}
          </View>
        )}
      </View>
    </View>
  );
}

// Commander and color identity section
function CommanderSection() {
  const { state, actions } = useDeckImport();
  const [showCommanderSelect, setShowCommanderSelect] = React.useState(false);

  const potentialCommanders = React.useMemo(() => {
    if (!state.parsedDecklist?.mainboard) return [];

    const candidates = new Set(
      state.parsedDecklist.mainboard.map((card) => card.card_name),
    );

    if (state.parsedDecklist.commander?.card_name) {
      candidates.add(state.parsedDecklist.commander.card_name);
    }

    return Array.from(candidates).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [state.parsedDecklist]);

  React.useEffect(() => {
    setShowCommanderSelect(false);
  }, [state.parsedDecklist?.normalized_decklist]);

  return (
    <View style={styles.sectionCard}>
      <View style={styles.commanderRow}>
        <Text style={styles.sectionLabel}>
          Commander: {state.editableData.selectedCommander || "Choose after analysis"}
        </Text>
        {state.parsedDecklist && potentialCommanders.length > 0 && (
          <Pressable
            style={styles.commanderSelectButton}
            onPress={() => setShowCommanderSelect(!showCommanderSelect)}
          >
            <Text style={styles.commanderSelectButtonText}>
              {showCommanderSelect ? "Hide" : state.editableData.selectedCommander ? "Change" : "Choose"}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.helperText}>
        Analyze a 100-card mainboard, then choose the commander before saving.
      </Text>

      {showCommanderSelect && potentialCommanders.length > 0 && (
        <View style={styles.commanderOptions}>
          <Text style={styles.commanderOptionsLabel}>Select Commander:</Text>
          <ScrollView style={styles.commanderList} nestedScrollEnabled>
            {potentialCommanders.map((commanderName, index) => (
              <Pressable
                key={index}
                style={[
                  styles.commanderOption,
                  state.editableData.selectedCommander === commanderName &&
                    styles.commanderOptionSelected,
                ]}
                onPress={() => {
                  actions.updateSelectedCommander(commanderName);
                  setShowCommanderSelect(false);
                }}
              >
                <Text style={styles.commanderOptionText}>{commanderName}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <Text style={styles.sectionLabel}>Color Identity</Text>
      <View style={styles.colorRow}>
        {COLOR_IDENTITY.map((color) => {
          const isActive =
            state.editableData.colorIdentity[
              `is_${color.toLowerCase()}` as keyof typeof state.editableData.colorIdentity
            ] === 1;
          return (
            <View
              key={color}
              style={[styles.colorPill, isActive && styles.colorPillActive]}
            >
              <Text style={styles.colorPillText}>{color}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>CMC graph</Text>
      <View style={styles.chartFrame}>
        <View style={styles.chartGrid}>
          {MANA_CURVE_BARS.map((height, index) => (
            <View key={index} style={styles.chartBarColumn}>
              <View style={[styles.chartBar, { height: `${height * 100}%` }]} />
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.avgText}>
        Avg CMC: {state.editableData.manaCurve.avg_cmc?.toFixed(2) || "0.00"}
      </Text>
    </View>
  );
}

// Ramp cards section
function RampSection() {
  const { state, actions } = useDeckImport();
  const analyzedCardNames = React.useMemo(
    () => getParsedMainboardCardNames(state.parsedDecklist),
    [state.parsedDecklist],
  );

  const removeRampCard = (cardName: string) => {
    const updatedCards = state.editableData.ramp.rampCards.filter(
      (name) => name !== cardName,
    );
    actions.updateRampCards("rampCards", updatedCards);
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>Ramp cards</Text>

      <CardSelectionPanel
        availableCards={analyzedCardNames}
        selectedCards={state.editableData.ramp.rampCards}
        onSelectCard={(cardName) =>
          actions.updateRampCards("rampCards", [
            ...state.editableData.ramp.rampCards,
            cardName,
          ])
        }
        title="Select from analyzed cards"
      />

      {/* Display current ramp cards */}
      <View style={styles.cardChipsContainer}>
        {state.editableData.ramp.rampCards.map((cardName, index) => (
          <View key={index} style={styles.cardChip}>
            <Text style={styles.cardChipText}>{cardName}</Text>
            <Pressable
              onPress={() => removeRampCard(cardName)}
              style={styles.cardChipRemove}
            >
              <Text style={styles.cardChipRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

// Interaction cards section
function InteractionSection() {
  const { state, actions } = useDeckImport();
  const analyzedCardNames = React.useMemo(
    () => getParsedMainboardCardNames(state.parsedDecklist),
    [state.parsedDecklist],
  );

  const removeInteractionCard = (cardName: string) => {
    const updatedCards = state.editableData.interaction.singleTargetRemovalCards
      .filter((name) => name !== cardName);
    actions.updateInteractionCards("singleTargetRemovalCards", updatedCards);
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>Interaction cards</Text>

      <CardSelectionPanel
        availableCards={analyzedCardNames}
        selectedCards={state.editableData.interaction.singleTargetRemovalCards}
        onSelectCard={(cardName) =>
          actions.updateInteractionCards("singleTargetRemovalCards", [
            ...state.editableData.interaction.singleTargetRemovalCards,
            cardName,
          ])
        }
        title="Select from analyzed cards"
      />

      {/* Display current interaction cards */}
      <View style={styles.cardChipsContainer}>
        {state.editableData.interaction.singleTargetRemovalCards.map(
          (cardName, index) => (
            <View key={index} style={styles.cardChip}>
              <Text style={styles.cardChipText}>{cardName}</Text>
              <Pressable
                onPress={() => removeInteractionCard(cardName)}
                style={styles.cardChipRemove}
              >
                <Text style={styles.cardChipRemoveText}>×</Text>
              </Pressable>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

// Wincons section
function WinconsSection() {
  const { state, actions } = useDeckImport();
  const analyzedCardNames = React.useMemo(
    () => getParsedMainboardCardNames(state.parsedDecklist),
    [state.parsedDecklist],
  );
  const [showPrimaryArchetypeSelect, setShowPrimaryArchetypeSelect] =
    React.useState(false);
  const [showSecondaryArchetypeSelect, setShowSecondaryArchetypeSelect] =
    React.useState(false);

  const removeWinconCard = (cardName: string) => {
    const updatedCards = state.editableData.wincons.comboPieceCards.filter(
      (name) => name !== cardName,
    );
    actions.updateWinconCards("comboPieceCards", updatedCards);
  };

  const updateStat = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const updatedStats: Partial<DeckWinconSpeedInsert> = {};

    if (field === "combo_pieces") {
      updatedStats.num_combo_pieces = numValue;
    } else if (field === "known_combos") {
      updatedStats.num_known_combos = numValue;
    } else if (field === "finishers") {
      updatedStats.num_finishers = numValue;
    } else if (field === "win_turn") {
      updatedStats.goldfish_turn_estimate = numValue;
    }

    actions.updateWinconStats(updatedStats);
  };

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>Wincons / combo pieces</Text>

      <CardSelectionPanel
        availableCards={analyzedCardNames}
        selectedCards={state.editableData.wincons.comboPieceCards}
        onSelectCard={(cardName) =>
          actions.updateWinconCards("comboPieceCards", [
            ...state.editableData.wincons.comboPieceCards,
            cardName,
          ])
        }
        title="Select from analyzed cards"
      />

      {/* Display current wincon cards */}
      <View style={styles.cardChipsContainer}>
        {state.editableData.wincons.comboPieceCards.map((cardName, index) => (
          <View key={index} style={styles.cardChip}>
            <Text style={styles.cardChipText}>{cardName}</Text>
            <Pressable
              onPress={() => removeWinconCard(cardName)}
              style={styles.cardChipRemove}
            >
              <Text style={styles.cardChipRemoveText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.summaryList}>
        {SUMMARY_ITEMS.map((item) => (
          <View key={item} style={styles.summaryRow}>
            <Text style={styles.summaryText}>{item}</Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#8A907C"
              style={styles.summaryInput}
              keyboardType="numeric"
              returnKeyType="done"
              value={(() => {
                if (item === "Num combo pieces:")
                  return (
                    state.editableData.wincons.stats.num_combo_pieces?.toString() ||
                    "0"
                  );
                if (item === "Num known combos:")
                  return (
                    state.editableData.wincons.stats.num_known_combos?.toString() ||
                    "0"
                  );
                if (item === "Num finishers:")
                  return (
                    state.editableData.wincons.stats.num_finishers?.toString() ||
                    "0"
                  );
                if (item === "Est win turn:")
                  return (
                    state.editableData.wincons.stats.goldfish_turn_estimate?.toString() ||
                    "0"
                  );
                return "0";
              })()}
              onChangeText={(value) => {
                if (item === "Num combo pieces:")
                  updateStat("combo_pieces", value);
                if (item === "Num known combos:")
                  updateStat("known_combos", value);
                if (item === "Num finishers:") updateStat("finishers", value);
                if (item === "Est win turn:") updateStat("win_turn", value);
              }}
            />
          </View>
        ))}
      </View>

      <View style={styles.archetypeRow}>
        <View style={styles.archetypeField}>
          <Text style={styles.archetypeLabel}>Primary Archetype</Text>
          <Pressable
            style={styles.archetypeSelectButton}
            onPress={() => {
              setShowPrimaryArchetypeSelect((current) => !current);
              setShowSecondaryArchetypeSelect(false);
            }}
          >
            <Text style={styles.archetypeValue}>
              {formatArchetypeLabel(
                state.editableData.archetype.primary_archetype ?? null,
              )}
            </Text>
          </Pressable>

          {showPrimaryArchetypeSelect && (
            <View style={styles.archetypeOptions}>
              {ARCHETYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.archetypeOption,
                    state.editableData.archetype.primary_archetype === option &&
                      styles.archetypeOptionSelected,
                  ]}
                  onPress={() => {
                    actions.updateArchetype({ primary_archetype: option });
                    setShowPrimaryArchetypeSelect(false);
                  }}
                >
                  <Text style={styles.archetypeOptionText}>
                    {formatArchetypeLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.archetypeField}>
          <Text style={styles.archetypeLabel}>Secondary Archetype</Text>
          <Pressable
            style={styles.archetypeSelectButton}
            onPress={() => {
              setShowSecondaryArchetypeSelect((current) => !current);
              setShowPrimaryArchetypeSelect(false);
            }}
          >
            <Text style={styles.archetypeValue}>
              {formatArchetypeLabel(
                state.editableData.archetype.secondary_archetype ?? null,
              )}
            </Text>
          </Pressable>

          {showSecondaryArchetypeSelect && (
            <View style={styles.archetypeOptions}>
              <Pressable
                style={[
                  styles.archetypeOption,
                  state.editableData.archetype.secondary_archetype === null &&
                    styles.archetypeOptionSelected,
                ]}
                onPress={() => {
                  actions.updateArchetype({ secondary_archetype: null });
                  setShowSecondaryArchetypeSelect(false);
                }}
              >
                <Text style={styles.archetypeOptionText}>None</Text>
              </Pressable>

              {ARCHETYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.archetypeOption,
                    state.editableData.archetype.secondary_archetype === option &&
                      styles.archetypeOptionSelected,
                  ]}
                  onPress={() => {
                    actions.updateArchetype({ secondary_archetype: option });
                    setShowSecondaryArchetypeSelect(false);
                  }}
                >
                  <Text style={styles.archetypeOptionText}>
                    {formatArchetypeLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Main deck metadata section
function DeckMetadataSection() {
  const { state, actions } = useDeckImport();

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>Deck Information</Text>

      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Deck Name:</Text>
        <TextInput
          placeholder="Enter deck name"
          placeholderTextColor="#8A907C"
          style={[styles.inputPanel, styles.metadataInput]}
          value={state.editableData.deckName}
          onChangeText={actions.updateDeckName}
        />
      </View>

      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Owner:</Text>
        <TextInput
          placeholder="Enter owner name"
          placeholderTextColor="#8A907C"
          style={[styles.inputPanel, styles.metadataInput]}
          value={state.editableData.owner}
          onChangeText={actions.updateOwner}
        />
      </View>
    </View>
  );
}

// Save section
function SaveSection() {
  const { state, actions } = useDeckImport();

  const handleSave = async () => {
    await actions.saveDeck();
  };

  const canSave =
    state.isValid &&
    !!state.parsedDecklist &&
    !!state.editableData.selectedCommander.trim() &&
    !state.isSaving;

  return (
    <>
      {state.hasUnsavedChanges && (
        <Text style={styles.unsavedText}>You have unsaved changes</Text>
      )}

      {state.saveError && (
        <Text style={styles.errorText}>Error: {state.saveError}</Text>
      )}

      {state.saveResult && (
        <Text style={styles.successText}>
          Deck saved successfully! ID: {state.saveResult.deck.deck_id}
        </Text>
      )}

      <Pressable
        onPress={handleSave}
        style={[styles.primaryButton, !canSave && styles.buttonDisabled]}
        disabled={!canSave}
      >
        <Text style={styles.primaryButtonText}>
          {state.isSaving ? "Saving..." : "Add Deck"}
        </Text>
      </Pressable>
    </>
  );
}

// Main component wrapped with provider
export default function AddDeckPage() {
  return (
    <DeckImportProvider>
      <AddDeckPageContent />
    </DeckImportProvider>
  );
}

// Main component content
function AddDeckPageContent() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Add Deck</Text>
          <Text style={styles.heroSubtitle}>
            Import and analyze your deck, then manually edit the data before
            saving.
          </Text>
        </View>

        <DecklistSection />
        <DeckMetadataSection />
        <CommanderSection />
        <RampSection />
        <InteractionSection />
        <WinconsSection />
        <SaveSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4EFDF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F4EFDF",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 18,
  },
  heroHeader: {
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: "#1B1B18",
    gap: 6,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#171612",
    letterSpacing: 0.4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5E5A4B",
    maxWidth: 320,
  },
  sectionCard: {
    backgroundColor: "#FFFBEF",
    borderWidth: 2,
    borderColor: "#1B1B18",
    borderRadius: 22,
    padding: 16,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171612",
  },
  inputPanel: {
    borderWidth: 2,
    borderColor: "#1B1B18",
    borderRadius: 18,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#171612",
    lineHeight: 22,
  },
  decklistInput: {
    minHeight: 164,
  },
  inlineActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#1B1B18",
    backgroundColor: "#E8DFC6",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171612",
  },
  errorText: {
    fontSize: 14,
    color: "#8A2D2D",
    fontWeight: "700",
  },
  errorContainer: {
    gap: 4,
    flexShrink: 1,
    maxWidth: 250,
  },
  addedCardsInput: {
    minHeight: 128,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  colorPill: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#1B1B18",
    backgroundColor: "#F1E9D3",
    alignItems: "center",
    justifyContent: "center",
  },
  colorPillText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#171612",
  },
  chartFrame: {
    minHeight: 184,
    borderWidth: 2,
    borderColor: "#1B1B18",
    borderRadius: 18,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 18,
  },
  chartGrid: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  chartBarColumn: {
    flex: 1,
    height: 132,
    justifyContent: "flex-end",
  },
  chartBar: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#B88943",
    borderWidth: 2,
    borderColor: "#1B1B18",
  },
  avgText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171612",
  },
  helperText: {
    color: "#D8D0B1",
    fontSize: 12,
    marginBottom: 10,
  },
  analysisInput: {
    minHeight: 112,
    borderWidth: 2,
    borderColor: "#1B1B18",
    borderRadius: 18,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#171612",
    lineHeight: 22,
  },
  summaryList: {
    gap: 4,
    paddingTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#171612",
    fontWeight: "700",
    flex: 1,
  },
  summaryInput: {
    width: 80,
    height: 40,
    borderWidth: 2,
    borderColor: "#1B1B18",
    borderRadius: 12,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#171612",
    textAlign: "center",
    fontWeight: "600",
  },
  archetypeRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  archetypeField: {
    flex: 1,
    minWidth: 140,
    borderWidth: 2,
    borderColor: "#1B1B18",
    borderRadius: 18,
    backgroundColor: "#F1E9D3",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  archetypeLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6D6859",
    fontWeight: "800",
  },
  archetypeValue: {
    fontSize: 16,
    color: "#171612",
    fontWeight: "800",
  },
  archetypeSelectButton: {
    borderWidth: 1,
    borderColor: "#1B1B18",
    borderRadius: 12,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  archetypeOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#C5BDA6",
    borderRadius: 10,
    backgroundColor: "#FFFCF5",
    overflow: "hidden",
  },
  archetypeOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8D2",
  },
  archetypeOptionSelected: {
    backgroundColor: "#E8DFC6",
  },
  archetypeOptionText: {
    fontSize: 14,
    color: "#171612",
    fontWeight: "600",
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#1B1B18",
    backgroundColor: "#1F5C47",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#F7F3E8",
    letterSpacing: 0.4,
  },
  buttonDisabled: {
    backgroundColor: "#8A907C",
    opacity: 0.6,
  },
  colorPillActive: {
    backgroundColor: "#B88943",
  },
  cardChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1E9D3",
    borderWidth: 1,
    borderColor: "#1B1B18",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  cardChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#171612",
  },
  cardChipRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#8A2D2D",
    alignItems: "center",
    justifyContent: "center",
  },
  cardChipRemoveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F7F3E8",
  },
  metadataRow: {
    gap: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171612",
  },
  metadataInput: {
    minHeight: 44,
  },
  unsavedText: {
    fontSize: 14,
    color: "#8A5D00",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  successText: {
    fontSize: 14,
    color: "#1F5C47",
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  commanderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  commanderSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1B1B18",
    backgroundColor: "#E8DFC6",
  },
  commanderSelectButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171612",
  },
  commanderOptions: {
    gap: 8,
    marginTop: 4,
  },
  commanderOptionsLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5E5A4B",
  },
  commanderList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#C5BDA6",
    borderRadius: 12,
    backgroundColor: "#FFFCF5",
  },
  commanderOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8D2",
  },
  commanderOptionSelected: {
    backgroundColor: "#E8DFC6",
  },
  commanderOptionText: {
    fontSize: 14,
    color: "#171612",
    fontWeight: "600",
  },
  selectorPanel: {
    gap: 8,
  },
  selectorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5E5A4B",
  },
  selectorToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1B1B18",
    backgroundColor: "#E8DFC6",
  },
  selectorToggleButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#171612",
  },
  selectorSearchInput: {
    borderWidth: 1,
    borderColor: "#C5BDA6",
    borderRadius: 12,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#171612",
  },
  selectorList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "#C5BDA6",
    borderRadius: 12,
    backgroundColor: "#FFFCF5",
  },
  selectorItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8D2",
  },
  selectorItemText: {
    fontSize: 14,
    color: "#171612",
    fontWeight: "600",
  },
  selectorEmptyState: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorEmptyStateText: {
    fontSize: 13,
    color: "#8A907C",
    fontWeight: "600",
  },
});
