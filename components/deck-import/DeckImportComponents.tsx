import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useDeckImport } from "../contexts/DeckImportContext";
import { useDeckImportHelpers } from "../hooks/useDeckImportHelpers";

/**
 * Example components showing how to use the DeckImportContext
 * These can be integrated into the existing add_deck.tsx page
 */

// Component for managing the raw decklist input and analysis
export function DecklistInput() {
  const { state, actions } = useDeckImport();
  const { canAnalyze, isProcessing, getValidationErrors } =
    useDeckImportHelpers();

  const handleAnalyze = async () => {
    await actions.analyzeDeck();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Decklist</Text>
      <TextInput
        multiline
        placeholder="Paste Plain Text decklist here"
        placeholderTextColor="#8A907C"
        style={styles.decklistInput}
        textAlignVertical="top"
        value={state.rawDecklist}
        onChangeText={actions.setRawDecklist}
        editable={!isProcessing}
      />

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.button, !canAnalyze && styles.buttonDisabled]}
          onPress={handleAnalyze}
          disabled={!canAnalyze || isProcessing}
        >
          <Text style={styles.buttonText}>
            {state.isAnalyzing ? "Analyzing..." : "Analyze Deck"}
          </Text>
        </Pressable>

        {getValidationErrors().length > 0 && (
          <Text style={styles.errorText}>
            {getValidationErrors().length} error(s) found
          </Text>
        )}
      </View>
    </View>
  );
}

// Component for editing ramp cards
export function RampCardEditor() {
  const { state, actions } = useDeckImport();
  const { getAllCardNames } = useDeckImportHelpers();

  const [newRampCard, setNewRampCard] = React.useState("");

  const addRampCard = () => {
    if (newRampCard.trim()) {
      const currentCards = state.editableData.ramp.rampCards;
      if (!currentCards.includes(newRampCard.trim())) {
        actions.updateRampCards("rampCards", [
          ...currentCards,
          newRampCard.trim(),
        ]);
      }
      setNewRampCard("");
    }
  };

  const removeRampCard = (cardName: string) => {
    const updatedCards = state.editableData.ramp.rampCards.filter(
      (name) => name !== cardName,
    );
    actions.updateRampCards("rampCards", updatedCards);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Ramp Cards</Text>

      {/* Display current ramp cards */}
      <View style={styles.cardList}>
        {state.editableData.ramp.rampCards.map((cardName, index) => (
          <View key={index} style={styles.cardItem}>
            <Text style={styles.cardName}>{cardName}</Text>
            <Pressable
              onPress={() => removeRampCard(cardName)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Add new ramp card */}
      <View style={styles.addCardRow}>
        <TextInput
          placeholder="Add ramp card name"
          placeholderTextColor="#8A907C"
          style={styles.addCardInput}
          value={newRampCard}
          onChangeText={setNewRampCard}
          onSubmitEditing={addRampCard}
        />
        <Pressable onPress={addRampCard} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <Text style={styles.statsText}>
        Total ramp cards: {state.editableData.ramp.stats.num_ramp_cards}
      </Text>
    </View>
  );
}

// Component for editing interaction cards
export function InteractionCardEditor() {
  const { state, actions } = useDeckImport();
  const [newInteractionCard, setNewInteractionCard] = React.useState("");
  const [interactionType, setInteractionType] = React.useState<
    keyof typeof state.editableData.interaction
  >("singleTargetRemovalCards");

  const addInteractionCard = () => {
    if (newInteractionCard.trim() && interactionType !== "stats") {
      const currentCards = state.editableData.interaction[
        interactionType
      ] as string[];
      if (!currentCards.includes(newInteractionCard.trim())) {
        actions.updateInteractionCards(interactionType, [
          ...currentCards,
          newInteractionCard.trim(),
        ]);
      }
      setNewInteractionCard("");
    }
  };

  const removeInteractionCard = (
    cardName: string,
    type: keyof typeof state.editableData.interaction,
  ) => {
    if (type !== "stats") {
      const currentCards = state.editableData.interaction[type] as string[];
      const updatedCards = currentCards.filter((name) => name !== cardName);
      actions.updateInteractionCards(type, updatedCards);
    }
  };

  const interactionTypes = [
    { key: "singleTargetRemovalCards", label: "Single Target Removal" },
    { key: "boardWipeCards", label: "Board Wipes" },
    { key: "counterspellCards", label: "Counterspells" },
    { key: "stackInteractionCards", label: "Stack Interaction" },
  ] as const;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Interaction Cards</Text>

      {interactionTypes.map(({ key, label }) => (
        <View key={key} style={styles.subsection}>
          <Text style={styles.subsectionLabel}>{label}</Text>

          <View style={styles.cardList}>
            {(state.editableData.interaction[key] as string[]).map(
              (cardName, index) => (
                <View key={index} style={styles.cardItem}>
                  <Text style={styles.cardName}>{cardName}</Text>
                  <Pressable
                    onPress={() => removeInteractionCard(cardName, key)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </Pressable>
                </View>
              ),
            )}
          </View>
        </View>
      ))}

      {/* Add new interaction card */}
      <View style={styles.addCardRow}>
        <TextInput
          placeholder="Add interaction card name"
          placeholderTextColor="#8A907C"
          style={styles.addCardInput}
          value={newInteractionCard}
          onChangeText={setNewInteractionCard}
          onSubmitEditing={addInteractionCard}
        />
        <Pressable onPress={addInteractionCard} style={styles.addButton}>
          <Text style={styles.addButtonText}>
            Add to{" "}
            {interactionTypes.find((t) => t.key === interactionType)?.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Component for deck metadata
export function DeckMetadataEditor() {
  const { state, actions } = useDeckImport();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Deck Information</Text>

      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Deck Name:</Text>
        <TextInput
          placeholder="Enter deck name"
          placeholderTextColor="#8A907C"
          style={styles.metadataInput}
          value={state.editableData.deckName}
          onChangeText={actions.updateDeckName}
        />
      </View>

      <View style={styles.metadataRow}>
        <Text style={styles.metadataLabel}>Owner:</Text>
        <TextInput
          placeholder="Enter owner name"
          placeholderTextColor="#8A907C"
          style={styles.metadataInput}
          value={state.editableData.owner}
          onChangeText={actions.updateOwner}
        />
      </View>

      {state.parsedDecklist?.commander && (
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Commander:</Text>
          <Text style={styles.commanderName}>
            {state.parsedDecklist.commander.card_name}
          </Text>
        </View>
      )}
    </View>
  );
}

// Component for save controls
export function SaveControls() {
  const { state, actions } = useDeckImport();
  const { canSave, hasUnsavedChanges } = useDeckImportHelpers();

  const handleSave = async () => {
    await actions.saveDeck();
  };

  return (
    <View style={styles.section}>
      <Pressable
        style={[styles.primaryButton, !canSave && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.primaryButtonText}>
          {state.isSaving ? "Saving..." : "Save Deck"}
        </Text>
      </Pressable>

      {hasUnsavedChanges && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  subsection: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2c3e50",
  },
  subsectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#34495e",
  },
  decklistInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    minHeight: 120,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  addCardInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  cardList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f4fd",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    margin: 2,
  },
  cardName: {
    fontSize: 12,
    color: "#2c3e50",
    marginRight: 4,
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#2c3e50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  primaryButton: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#95a5a6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metadataLabel: {
    width: 80,
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  metadataInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#fff",
  },
  commanderName: {
    flex: 1,
    fontSize: 14,
    color: "#e67e22",
    fontWeight: "500",
  },
  statsText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
    marginTop: 4,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
  },
  successText: {
    color: "#27ae60",
    fontSize: 12,
  },
  unsavedText: {
    color: "#f39c12",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
