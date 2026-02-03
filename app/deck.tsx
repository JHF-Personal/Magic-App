import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDeck } from '../contexts/DeckContext';
import DeckView from '../components/deck/DeckView';

export default function DeckPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { selectedDeck, selectDeck, isLoading, clearSelection } = useDeck();

  useEffect(() => {
    if (id && typeof id === 'string') {
      const deckId = parseInt(id, 10);
      if (!isNaN(deckId)) {
        selectDeck(deckId);
      }
    }

    // Cleanup when component unmounts
    return () => {
      clearSelection();
    };
  }, [id]);

  {/* --- Loading State --- */}
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading deck...</Text>
      </View>
    );
  }

  {/* --- Deck Not Found State --- */}
  if (!selectedDeck) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Deck not found</Text>
      </View>
    );
  }

  {/* --- Deck Found State --- */}
  return (
    <View style={styles.container}>
      <DeckView deck={selectedDeck} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
  },
});