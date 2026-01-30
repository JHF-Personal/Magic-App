import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Deck } from '../../types/deck';

interface DeckStatsProps {
  deck: Deck;
}

export default function DeckStats({ deck }: DeckStatsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{(deck.winrate * 100).toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{deck.total_games || 0}</Text>
          <Text style={styles.statLabel}>Total Games</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round((deck.winrate * (deck.total_games || 0)))}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
      </View>
      
      {deck.last_played && (
        <View style={styles.lastPlayedContainer}>
          <Text style={styles.lastPlayedLabel}>Last Played: </Text>
          <Text style={styles.lastPlayedValue}>
            {deck.last_played.toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  lastPlayedContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
  },
  lastPlayedLabel: {
    fontSize: 14,
    color: '#666',
  },
  lastPlayedValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});