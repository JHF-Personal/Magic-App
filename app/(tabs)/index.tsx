import { useRouter } from "expo-router";
import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useDeck } from "../../contexts/DeckContext";

export default function HomeTab() {
  const router = useRouter();
  const { decks } = useDeck();

  const recentDecks = decks
    .filter(deck => deck.last_played)
    .sort((a, b) => new Date(b.last_played!).getTime() - new Date(a.last_played!).getTime())
    .slice(0, 3);

  const topPerformingDecks = decks
    .filter(deck => deck.total_games && deck.total_games >= 3)
    .sort((a, b) => b.winrate - a.winrate)
    .slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{decks.length}</Text>
            <Text style={styles.statLabel}>Total Decks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {decks.reduce((sum, deck) => sum + (deck.total_games || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {decks.length > 0 
                ? (decks.reduce((sum, deck) => sum + deck.winrate, 0) / decks.length * 100).toFixed(1) + '%'
                : '0%'}
            </Text>
            <Text style={styles.statLabel}>Avg Win Rate</Text>
          </View>
        </View>
      </View>

      {/* Recently Played */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
        {recentDecks.length > 0 ? (
          recentDecks.map((deck) => (
            <TouchableOpacity 
              key={deck.id} 
              style={styles.deckCard}
              onPress={() => router.push(`/deck?id=${deck.id}` as any)}
            >
              <Text style={styles.deckName}>{deck.name}</Text>
              <Text style={styles.deckInfo}>
                Last played: {deck.last_played ? new Date(deck.last_played).toLocaleDateString() : 'Never'}
              </Text>
              <Text style={styles.deckWinrate}>Win rate: {(deck.winrate * 100).toFixed(1)}%</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent games found</Text>
        )}
      </View>

      {/* Top Performing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Decks</Text>
        {topPerformingDecks.length > 0 ? (
          topPerformingDecks.map((deck, index) => (
            <TouchableOpacity 
              key={deck.id} 
              style={styles.deckCard}
              onPress={() => router.push(`/deck?id=${deck.id}` as any)}
            >
              <View style={styles.deckHeader}>
                <Text style={styles.rankBadge}>#{index + 1}</Text>
                <Text style={styles.deckName}>{deck.name}</Text>
              </View>
              <Text style={styles.deckInfo}>
                {deck.wins}/{deck.total_games} wins • Win rate: {deck.winrate.toFixed(1)}%
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Play some games to see top performers</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => router.push('/track-game' as any)}
        >
          <Text style={styles.actionButtonText}>Track New Game</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => router.push('/add-deck' as any)}
        >
          <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Add New Deck</Text>
        </TouchableOpacity>
      </View>

      {/* Debug button for development */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={() => router.push('/debug' as any)}
      >
        <Text style={styles.debugButtonText}>🔧 Debug DB</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  deckCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rankBadge: {
    backgroundColor: '#0066cc',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 24,
    textAlign: 'center',
  },
  deckName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deckInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  deckWinrate: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  quickActions: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#0066cc',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryActionText: {
    color: '#0066cc',
  },
  debugButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#6c757d',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});