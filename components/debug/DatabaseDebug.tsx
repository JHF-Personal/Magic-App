import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDeck } from '../../contexts/DeckContext';
import { databaseService } from '../../services/databaseService';

export default function DatabaseDebug() {
  const { decks, isLoading, error, refreshDecks } = useDeck();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Reset Database',
      'This will delete all data and recreate the database with sample data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              addLog('Resetting database...');
              await databaseService.resetDatabase();
              await refreshDecks();
              addLog('Database reset successfully');
            } catch (err) {
              addLog(`Error resetting database: ${err}`);
            }
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    try {
      addLog('Refreshing decks...');
      await refreshDecks();
      addLog('Decks refreshed successfully');
    } catch (err) {
      addLog(`Error refreshing: ${err}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Debug</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Status</Text>
        <Text style={styles.info}>Total Decks: {decks.length}</Text>
        <Text style={styles.info}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Refresh Decks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleResetDatabase}>
          <Text style={styles.buttonText}>Reset Database</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Decks</Text>
        {decks.map(deck => (
          <View key={deck.id} style={styles.deckItem}>
            <Text style={styles.deckName}>{deck.name}</Text>
            <Text style={styles.deckInfo}>ID: {deck.id} | Cards: {deck.cards?.length || 0}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logItem}>{log}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deckItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  deckName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deckInfo: {
    fontSize: 14,
    color: '#666',
  },
  logItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
  },
});