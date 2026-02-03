import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Switch
} from "react-native";
import { useRouter } from "expo-router";
import { useDeck } from "../../contexts/DeckContext";
import { Deck } from "../../types/deck";

interface GameParticipant {
  deck: Deck;
  isWinner: boolean;
}

export default function TrackGameTab() {
  const router = useRouter();
  const { decks, updateDeck } = useDeck();
  
  const [selectedDecks, setSelectedDecks] = useState<GameParticipant[]>([]);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addDeckToGame = (deck: Deck) => {
    if (selectedDecks.find(p => p.deck.id === deck.id)) {
      Alert.alert('Error', 'This deck is already in the game');
      return;
    }

    if (!isMultiplayer && selectedDecks.length >= 2) {
      Alert.alert('Error', 'Maximum 2 decks for 1v1 games');
      return;
    }

    if (isMultiplayer && selectedDecks.length >= 6) {
      Alert.alert('Error', 'Maximum 6 decks for multiplayer games');
      return;
    }

    setSelectedDecks(prev => [...prev, { deck, isWinner: false }]);
  };

  const removeDeckFromGame = (deckId: number) => {
    setSelectedDecks(prev => prev.filter(p => p.deck.id !== deckId));
  };

  const toggleWinner = (deckId: number) => {
    setSelectedDecks(prev => prev.map(p => 
      p.deck.id === deckId 
        ? { ...p, isWinner: !p.isWinner }
        : isMultiplayer ? p : { ...p, isWinner: false } // In 1v1, only one winner
    ));
  };

  const handleSubmitGame = async () => {
    if (selectedDecks.length < 2) {
      Alert.alert('Error', 'Please select at least 2 decks for the game');
      return;
    }

    const winners = selectedDecks.filter(p => p.isWinner);
    if (winners.length === 0) {
      Alert.alert('Error', 'Please select at least one winner');
      return;
    }

    if (!isMultiplayer && winners.length > 1) {
      Alert.alert('Error', 'Only one winner allowed in 1v1 games');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update stats for each participating deck
      for (const participant of selectedDecks) {
        const deck = participant.deck;
        const won = participant.isWinner;
        
        // Calculate new stats
        const currentTotalGames = deck.total_games || 0;
        const newTotalGames = currentTotalGames + 1;
        const currentWins = deck.wins || 0;
        const newWins = won ? currentWins + 1 : currentWins;
        const newLosses = won ? deck.losses : (deck.losses || 0) + 1;
        const newWinrate = newTotalGames > 0 ? Math.round((newWins / newTotalGames) * 100) : 0;

        const updatedDeck: Deck = {
          ...deck,
          total_games: newTotalGames,
          wins: newWins,
          losses: newLosses,
          winrate: newWinrate,
          last_played: new Date(),
        };

        await updateDeck(updatedDeck);
      }

      const gameType = isMultiplayer ? 'multiplayer' : '1v1';
      const winnerNames = winners.map(w => w.deck.name).join(', ');
      
      Alert.alert(
        'Game Recorded!', 
        `${gameType} game recorded successfully.\nWinner(s): ${winnerNames}`,
        [
          {
            text: 'View Stats',
            onPress: () => router.push('/(tabs)/decklist'),
          },
          {
            text: 'Record Another',
            onPress: () => {
              setSelectedDecks([]);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record game. Please try again.');
      console.error('Error recording game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableDecks = decks.filter(deck => 
    !selectedDecks.find(p => p.deck.id === deck.id)
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Track Game Results</Text>

        {/* Game Type Toggle */}
        <View style={styles.gameTypeSection}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Game Type:</Text>
            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, !isMultiplayer && styles.activeToggleLabel]}>
                1v1
              </Text>
              <Switch
                value={isMultiplayer}
                onValueChange={setIsMultiplayer}
                trackColor={{ false: '#0066cc', true: '#0066cc' }}
                thumbColor="#fff"
              />
              <Text style={[styles.toggleLabel, isMultiplayer && styles.activeToggleLabel]}>
                Multiplayer
              </Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            {isMultiplayer 
              ? 'Select 2-6 decks, multiple winners allowed' 
              : 'Select exactly 2 decks, one winner'
            }
          </Text>
        </View>

        {/* Selected Decks */}
        {selectedDecks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game Participants</Text>
            {selectedDecks.map((participant) => (
              <View key={participant.deck.id} style={styles.participantCard}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{participant.deck.name}</Text>
                  <Text style={styles.participantStats}>
                    {participant.deck.winrate}% WR • {participant.deck.total_games} games
                  </Text>
                  <View style={styles.colorIndicators}>
                    {participant.deck.colors.map((color) => (
                      <View 
                        key={color} 
                        style={[styles.colorDot, { backgroundColor: getColorCode(color) }]} 
                      />
                    ))}
                  </View>
                </View>
                
                <View style={styles.participantActions}>
                  <TouchableOpacity
                    style={[
                      styles.winnerButton,
                      participant.isWinner && styles.winnerButtonActive
                    ]}
                    onPress={() => toggleWinner(participant.deck.id)}
                  >
                    <Text style={[
                      styles.winnerButtonText,
                      participant.isWinner && styles.winnerButtonTextActive
                    ]}>
                      {participant.isWinner ? '👑 Winner' : 'Set Winner'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDeckFromGame(participant.deck.id)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Decks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Decks ({availableDecks.length})
          </Text>
          
          {availableDecks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {selectedDecks.length > 0 
                  ? 'All available decks have been added to the game'
                  : 'No decks available. Create some decks first!'
                }
              </Text>
              {selectedDecks.length === 0 && (
                <TouchableOpacity
                  style={styles.createDeckButton}
                  onPress={() => router.push('/(tabs)/add-deck')}
                >
                  <Text style={styles.createDeckButtonText}>Create New Deck</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.deckGrid}>
              {availableDecks.map((deck) => (
                <TouchableOpacity
                  key={deck.id}
                  style={styles.deckCard}
                  onPress={() => addDeckToGame(deck)}
                >
                  <Text style={styles.deckName}>{deck.name}</Text>
                  <Text style={styles.deckStats}>
                    {deck.winrate}% WR • {deck.total_games} games
                  </Text>
                  <View style={styles.colorIndicators}>
                    {deck.colors.map((color) => (
                      <View 
                        key={color} 
                        style={[styles.colorDot, { backgroundColor: getColorCode(color) }]} 
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Submit Button */}
        {selectedDecks.length >= 2 && (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitGame}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Recording Game...' : 'Record Game Results'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{decks.length}</Text>
              <Text style={styles.statLabel}>Total Decks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {decks.reduce((sum, deck) => sum + (deck.total_games || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {decks.length > 0 
                  ? Math.round(decks.reduce((sum, deck) => sum + deck.winrate, 0) / decks.length)
                  : 0
                }%
              </Text>
              <Text style={styles.statLabel}>Avg Win Rate</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function getColorCode(color: string): string {
  const colorMap: { [key: string]: string } = {
    white: '#FFFBD5',
    blue: '#0E68AB',
    black: '#150B00',
    red: '#D3202A',
    green: '#00733E',
  };
  return colorMap[color] || '#ccc';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  gameTypeSection: {
    marginBottom: 30,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
  },
  activeToggleLabel: {
    color: '#0066cc',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  participantCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  participantStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  participantActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  winnerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  winnerButtonActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  winnerButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  winnerButtonTextActive: {
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deckCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '48%',
    minHeight: 100,
  },
  deckName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deckStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  colorIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createDeckButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  createDeckButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});