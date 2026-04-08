import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DecklistInput,
  DeckMetadataEditor,
  InteractionCardEditor,
  RampCardEditor,
  SaveControls,
} from "../components/deck-import/DeckImportComponents";
import { DeckImportProvider } from "../contexts/DeckImportContext";

/**
 * Updated AddDeckPage that uses the DeckImportContext system
 * This replaces the existing add_deck.tsx with the new context-based structure
 */
export default function AddDeckPageWithContext() {
  return (
    <DeckImportProvider>
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

          {/* Step 1: Decklist Input & Analysis */}
          <DecklistInput />

          {/* Step 2: Deck Metadata */}
          <DeckMetadataEditor />

          {/* Step 3: Manual Card Categorization */}
          <RampCardEditor />
          <InteractionCardEditor />

          {/* Additional components would go here for:
              - WinconCardEditor (similar to RampCardEditor)
              - ArchetypeSelector 
              - ManaCurveEditor
              - ColorIdentityDisplay
          */}

          {/* Step 4: Save Controls */}
          <SaveControls />
        </ScrollView>
      </SafeAreaView>
    </DeckImportProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  heroHeader: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    lineHeight: 20,
  },
});

/**
 * Example of how to use the context in your main App.tsx or _layout.tsx
 * You can wrap your entire app or just the add deck section
 */
export function AppWithDeckImport() {
  return (
    <DeckImportProvider>
      {/* Your existing app content */}
      {/* The context will be available to all child components */}
    </DeckImportProvider>
  );
}

/**
 * Example of accessing the context in any component
 */
export function ExampleContextUsage() {
  const { state, actions } = useDeckImport();

  return (
    <View>
      <Text>Raw decklist length: {state.rawDecklist.length}</Text>
      <Text>Is analyzing: {state.isAnalyzing.toString()}</Text>
      <Text>Has unsaved changes: {state.hasUnsavedChanges.toString()}</Text>

      {/* Access any part of the editable data */}
      <Text>Deck name: {state.editableData.deckName}</Text>
      <Text>Ramp cards: {state.editableData.ramp.rampCards.join(", ")}</Text>
    </View>
  );
}

import { useDeckImport } from "../contexts/DeckImportContext";

