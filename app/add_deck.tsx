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

const COLOR_IDENTITY = ["W", "U", "B", "R", "G"];

const MANA_CURVE_BARS = [0.3, 0.55, 0.9, 0.78, 0.52, 0.28];

const SUMMARY_ITEMS = [
  "Num combo pieces:",
  "Num known combos:",
  "Num finishers:",
  "Est win turn:",
];

export default function AddDeckPage() {
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
            Build the deck profile layout before wiring import and analysis.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Decklist</Text>
          <TextInput
            multiline
            placeholder="Paste Plain Text decklist here"
            placeholderTextColor="#8A907C"
            style={[styles.inputPanel, styles.decklistInput]}
            textAlignVertical="top"
          />

          <View style={styles.inlineActionRow}>
            <Pressable disabled style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Analyze Deck</Text>
            </Pressable>
            <Text style={styles.errorText}>Error text</Text>
          </View>

          {/* <Text style={styles.sectionLabel}>Added cards</Text>
					<TextInput
						multiline
						placeholder="Added cards"
						placeholderTextColor="#8A907C"
						style={[styles.inputPanel, styles.addedCardsInput]}
						textAlignVertical="top"
					/> */}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Commander: </Text>
          <Text style={styles.sectionLabel}>Color Identity</Text>
          <View style={styles.colorRow}>
            {COLOR_IDENTITY.map((color) => (
              <View key={color} style={styles.colorPill}>
                <Text style={styles.colorPillText}>{color}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>CMC graph</Text>
          <View style={styles.chartFrame}>
            <View style={styles.chartGrid}>
              {MANA_CURVE_BARS.map((height, index) => (
                <View key={index} style={styles.chartBarColumn}>
                  <View
                    style={[styles.chartBar, { height: `${height * 100}%` }]}
                  />
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.avgText}>Avg CMC:</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Ramp cards</Text>
          <TextInput
            multiline
            placeholder="Ramp cards"
            placeholderTextColor="#8A907C"
            style={styles.analysisInput}
            textAlignVertical="top"
          />

          <Text style={styles.sectionLabel}>Interaction cards</Text>
          <TextInput
            multiline
            placeholder="Interaction cards"
            placeholderTextColor="#8A907C"
            style={styles.analysisInput}
            textAlignVertical="top"
          />

          <Text style={styles.sectionLabel}>Wincons / combo pieces</Text>
          <TextInput
            multiline
            placeholder="Wincons / combo pieces"
            placeholderTextColor="#8A907C"
            style={styles.analysisInput}
            textAlignVertical="top"
          />

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
                />
              </View>
            ))}
          </View>

          <View style={styles.archetypeRow}>
            <View style={styles.archetypeField}>
              <Text style={styles.archetypeLabel}>Primary Archetype</Text>
              <Text style={styles.archetypeValue}>Primary</Text>
            </View>
            <View style={styles.archetypeField}>
              <Text style={styles.archetypeLabel}>Secondary Archetype</Text>
              <Text style={styles.archetypeValue}>Secondary</Text>
            </View>
          </View>
        </View>

        <Pressable disabled style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Add Deck</Text>
        </Pressable>
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
});
