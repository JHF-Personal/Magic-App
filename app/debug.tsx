import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  DeckUpdate,
  DeckWinconSpeedInsert,
  Game,
  GameInsert,
  GameRecord,
  PlayerGameInstanceInsert,
} from "../types/databaseTypes";

interface DatabaseStats {
  games: number;
  commanders: number;
  decks: number;
  instances: number;
}

const DEBUG_COMMANDER_NAME = "Debug Commander";
const DEBUG_OWNER = "debug-user";

function formatValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "N/A" : String(value);
}

function seatLabel(position: number | null | undefined): string {
  return position === null || position === undefined
    ? "N/A"
    : `Seat ${position + 1}`;
}

function ActionButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState("Unknown");
  const [statusMessage, setStatusMessage] = useState("Preparing database...");
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [commanders, setCommanders] = useState<Commander[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedDeckProfile, setSelectedDeckProfile] =
    useState<DeckProfile | null>(null);
  const [latestGameRecord, setLatestGameRecord] =
    useState<GameRecord | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((current) => [`${timestamp} • ${message}`, ...current].slice(0, 10));
  }, []);

  const loadDatabaseState = useCallback(async () => {
    const [nextStats, nextCommanders, nextDecks, nextGames] =
      await Promise.all([
        databaseService.getStats(),
        databaseService.getAllCommanders(),
        databaseService.getAllDecks(),
        databaseService.getAllGames(),
      ]);

    setStats(nextStats);
    setCommanders(nextCommanders);
    setDecks(nextDecks);
    setGames(nextGames);
    setProvider(databaseService.getCurrentProvider());

    const latestDeck = nextDecks[0];
    setSelectedDeckProfile(
      latestDeck
        ? await databaseService.getDeckProfile(latestDeck.deck_id)
        : null,
    );

    const latestGame = nextGames[0];
    setLatestGameRecord(
      latestGame ? await databaseService.getGameRecord(latestGame.game_id) : null,
    );
  }, []);

  const runAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      setIsLoading(true);
      setStatusMessage(label);

      try {
        await action();
        addLog(`${label} completed`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown database error";
        setStatusMessage(message);
        addLog(`${label} failed: ${message}`);
        Alert.alert("Database action failed", message);
      } finally {
        setIsLoading(false);
      }
    },
    [addLog],
  );

  const initializeDatabase = useCallback(async () => {
    await runAction("Initializing database...", async () => {
      await databaseService.initialize();
      await loadDatabaseState();
      setStatusMessage("Database ready for testing.");
    });
  }, [loadDatabaseState, runAction]);

  useEffect(() => {
    void initializeDatabase();
  }, [initializeDatabase]);

  const refreshDatabase = useCallback(async () => {
    await runAction("Refreshing database snapshot...", async () => {
      await databaseService.initialize();
      await loadDatabaseState();
      setStatusMessage("Database snapshot refreshed.");
    });
  }, [loadDatabaseState, runAction]);

  const seedSampleData = useCallback(async () => {
    await runAction("Creating typed sample data...", async () => {
      await databaseService.initialize();

      let commander = await databaseService.getCommanderByName(
        DEBUG_COMMANDER_NAME,
      );

      if (!commander) {
        const commanderInsert: CommanderInsert = {
          name: DEBUG_COMMANDER_NAME,
          color_identity: "UR",
          cmc: 4,
          power: 3,
          toughness: 3,
          card_types: "Legendary Creature",
          subtypes: "Human Wizard",
        };

        const commanderId = await databaseService.createCommander(
          commanderInsert,
        );
        commander = await databaseService.getCommander(commanderId);
      }

      if (!commander) {
        throw new Error("Failed to create or load the debug commander.");
      }

      const deckInsert: DeckInsert = {
        commander_id: commander.commander_id,
        deck_name: `Debug Deck ${new Date().toLocaleTimeString()}`,
        owner: DEBUG_OWNER,
      };

      const deckId = await databaseService.createDeck(deckInsert);

      const cardCounts: DeckCardCountsInsert = {
        deck_id: deckId,
        num_creatures: 24,
        num_instants: 14,
        num_sorceries: 12,
        num_artifacts: 15,
        num_enchantments: 5,
        num_planeswalkers: 1,
        num_lands: 29,
        total_cards: 100,
      };

      const colorIdentity: DeckColorIdentityInsert = {
        deck_id: deckId,
        is_white: 0,
        is_blue: 1,
        is_black: 0,
        is_red: 1,
        is_green: 0,
        num_colors: 2,
        color_identity: "UR",
      };

      const manaCurve: DeckManaCurveInsert = {
        deck_id: deckId,
        avg_cmc: 3.2,
        median_cmc: 3,
        cmc_0_1_count: 8,
        cmc_2_count: 16,
        cmc_3_count: 22,
        cmc_4_count: 18,
        cmc_5_count: 12,
        cmc_6_plus_count: 6,
        curve_skewness: 0.14,
        curve_std: 1.1,
      };

      const ramp: DeckRampInsert = {
        deck_id: deckId,
        num_ramp_cards: 10,
        num_fast_mana: 2,
        num_land_ramp: 3,
        num_mana_dorks: 1,
        num_rocks: 4,
        avg_ramp_cmc: 2.1,
        ramp_early_game_ratio: 0.7,
      };

      const interaction: DeckInteractionInsert = {
        deck_id: deckId,
        num_single_target_removal: 8,
        num_board_wipes: 2,
        num_counterspells: 5,
        num_stack_interaction: 6,
        interaction_density: 0.21,
        instant_speed_interaction_ratio: 0.78,
      };

      const wincon: DeckWinconSpeedInsert = {
        deck_id: deckId,
        num_combo_pieces: 4,
        num_known_combos: 1,
        num_finishers: 3,
        goldfish_turn_estimate: 7,
        wincon_speed_score: 7.5,
      };

      const archetype: DeckArchetypeInsert = {
        deck_id: deckId,
        primary_archetype: "midrange",
        secondary_archetype: "combo",
        archetype_confidence: 0.82,
      };

      await Promise.all([
        databaseService.upsertDeckCardCounts(cardCounts),
        databaseService.upsertDeckColorIdentity(colorIdentity),
        databaseService.upsertDeckManaCurve(manaCurve),
        databaseService.upsertDeckRamp(ramp),
        databaseService.upsertDeckInteraction(interaction),
        databaseService.upsertDeckWinconSpeed(wincon),
        databaseService.upsertDeckArchetype(archetype),
      ]);

      const gameInsert: GameInsert = {
        winner_position: 0,
        game_duration_minutes: 75,
        notes: `Debug game for deck ${deckId}`,
      };

      const gameId = await databaseService.createGame(gameInsert);

      const instanceInsert: PlayerGameInstanceInsert = {
        game_id: gameId,
        deck_id: deckId,
        seat_position: 0,
        finished_position: 1,
      };

      await databaseService.createPlayerGameInstance(instanceInsert);
      await loadDatabaseState();

      setStatusMessage(`Created debug deck #${deckId} and game #${gameId}.`);
    });
  }, [loadDatabaseState, runAction]);

  const updateLatestDeck = useCallback(async () => {
    await runAction("Updating the latest deck...", async () => {
      await databaseService.initialize();

      const latestDeck = decks[0];
      if (!latestDeck) {
        throw new Error("There is no deck available to update.");
      }

      const deckUpdate: DeckUpdate = {
        deck_id: latestDeck.deck_id,
        deck_name: `${latestDeck.deck_name ?? "Debug Deck"} ✓`,
        owner: latestDeck.owner ?? DEBUG_OWNER,
      };

      await databaseService.updateDeck(deckUpdate);
      await loadDatabaseState();
      setStatusMessage(`Updated deck #${latestDeck.deck_id}.`);
    });
  }, [decks, loadDatabaseState, runAction]);

  const clearDebugData = useCallback(async () => {
    await runAction("Clearing debug records...", async () => {
      await databaseService.initialize();

      const allGames = await databaseService.getAllGames();
      for (const game of allGames) {
        if (!game.notes?.includes("Debug game")) {
          continue;
        }

        const instances = await databaseService.getInstancesByGame(game.game_id);
        for (const instance of instances) {
          await databaseService.deletePlayerGameInstance(instance.instance_id);
        }

        await databaseService.deleteGame(game.game_id);
      }

      const allDecks = await databaseService.getAllDecks();
      for (const deck of allDecks) {
        const isDebugDeck =
          deck.owner === DEBUG_OWNER || deck.deck_name?.includes("Debug Deck");

        if (isDebugDeck) {
          await databaseService.deleteDeck(deck.deck_id);
        }
      }

      const allCommanders = await databaseService.getAllCommanders();
      for (const commander of allCommanders) {
        if (commander.name !== DEBUG_COMMANDER_NAME) {
          continue;
        }

        const commanderDecks = await databaseService.getDecksByCommander(
          commander.commander_id,
        );

        if (commanderDecks.length === 0) {
          await databaseService.deleteCommander(commander.commander_id);
        }
      }

      await loadDatabaseState();
      setStatusMessage("Removed debug data from the database.");
    });
  }, [loadDatabaseState, runAction]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Database Debug</Text>
      <Text style={styles.subtitle}>
        Use this page to initialize, test, inspect, and clean up database data
        through the shared database service.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connection</Text>
        <Text style={styles.metaText}>Provider: {provider}</Text>
        <Text style={styles.metaText}>Status: {statusMessage}</Text>
        {isLoading ? <ActivityIndicator color="#1F5C47" /> : null}
      </View>

      <View style={styles.buttonGrid}>
        <ActionButton
          label="Initialize"
          onPress={() => void initializeDatabase()}
          disabled={isLoading}
        />
        <ActionButton
          label="Refresh"
          onPress={() => void refreshDatabase()}
          disabled={isLoading}
        />
        <ActionButton
          label="Create Sample"
          onPress={() => void seedSampleData()}
          disabled={isLoading}
        />
        <ActionButton
          label="Update Latest Deck"
          onPress={() => void updateLatestDeck()}
          disabled={isLoading || decks.length === 0}
        />
        <ActionButton
          label="Clear Debug Data"
          onPress={() => void clearDebugData()}
          disabled={isLoading}
        />
      </View>

      {stats ? (
        <View style={styles.statsRow}>
          <StatCard label="Games" value={stats.games} />
          <StatCard label="Commanders" value={stats.commanders} />
          <StatCard label="Decks" value={stats.decks} />
          <StatCard label="Instances" value={stats.instances} />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Commanders</Text>
        {commanders.length === 0 ? (
          <Text style={styles.emptyText}>No commanders found.</Text>
        ) : (
          commanders.slice(0, 5).map((commander) => (
            <Text key={commander.commander_id} style={styles.rowText}>
              #{commander.commander_id} • {commander.name} • {formatValue(commander.color_identity)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Decks</Text>
        {decks.length === 0 ? (
          <Text style={styles.emptyText}>No decks found.</Text>
        ) : (
          decks.slice(0, 5).map((deck) => (
            <Text key={deck.deck_id} style={styles.rowText}>
              #{deck.deck_id} • {formatValue(deck.deck_name)} • owner: {formatValue(deck.owner)}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Games</Text>
        {games.length === 0 ? (
          <Text style={styles.emptyText}>No games found.</Text>
        ) : (
          games.slice(0, 5).map((game) => (
            <Text key={game.game_id} style={styles.rowText}>
              #{game.game_id} • winner: {seatLabel(game.winner_position)} • duration: {formatValue(game.game_duration_minutes)} min
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest Deck Profile</Text>
        {selectedDeckProfile ? (
          <>
            <Text style={styles.rowText}>
              Deck: {formatValue(selectedDeckProfile.deck.deck_name)}
            </Text>
            <Text style={styles.rowText}>
              Commander: {selectedDeckProfile.commander.name}
            </Text>
            <Text style={styles.rowText}>
              Colors: {formatValue(selectedDeckProfile.color_identity?.color_identity)}
            </Text>
            <Text style={styles.rowText}>
              Avg CMC: {formatValue(selectedDeckProfile.mana_curve?.avg_cmc)}
            </Text>
            <Text style={styles.rowText}>
              Interaction density: {formatValue(selectedDeckProfile.interaction?.interaction_density)}
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>No deck profile loaded yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest Game Record</Text>
        {latestGameRecord ? (
          <>
            <Text style={styles.rowText}>
              Game #{latestGameRecord.game.game_id} • winner: {seatLabel(latestGameRecord.game.winner_position)}
            </Text>
            <Text style={styles.rowText}>
              Notes: {formatValue(latestGameRecord.game.notes)}
            </Text>
            <Text style={styles.rowText}>
              Instance count: {latestGameRecord.instances.length}
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>No game record loaded yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activity Log</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No actions logged yet.</Text>
        ) : (
          logs.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={styles.logText}>
              {entry}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#F7F3E8",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#171612",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5F5A50",
  },
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8D0BF",
    backgroundColor: "#FFFDF7",
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171612",
  },
  metaText: {
    fontSize: 14,
    color: "#2D2A24",
  },
  buttonGrid: {
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1F5C47",
    borderWidth: 1,
    borderColor: "#174434",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#F7F3E8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    minWidth: 78,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#E6F0EC",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B1B18",
  },
  statLabel: {
    fontSize: 12,
    color: "#355549",
  },
  rowText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2D2A24",
  },
  emptyText: {
    fontSize: 14,
    color: "#7A756A",
    fontStyle: "italic",
  },
  logText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4F4A41",
  },
});
