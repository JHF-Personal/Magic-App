import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import { Text, View, StyleSheet, ScrollView, Pressable, Modal, TouchableOpacity } from "react-native";
import { useDeck } from "../../contexts/DeckContext";
import { Deck } from "../../types/deck";

type SortOption = 'name' | 'winrate' | 'lastPlayed' | 'totalGames' | 'bracketLevel';
type SortDirection = 'asc' | 'desc';
type ColorMatchMode = 'including' | 'exactly';

interface FilterOptions {
  colors: string[];
  colorMatchMode: ColorMatchMode;
  bracketLevels: number[];
  minWinrate?: number;
}

export default function DeckListTab() {
    const router = useRouter();
    const { decks } = useDeck();
    
    // State for filtering and sorting
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
      colors: [],
      colorMatchMode: 'including',
      bracketLevels: [],
    });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    
    const handleDeckPress = (deckId: number) => {
        router.push(`/deck?id=${deckId}` as any);
    };

    // Available filter options
    const allColors = ['White', 'Blue', 'Black', 'Red', 'Green'];
    const allBracketLevels = [1, 2, 3, 4, 5];
    
    // Filtered and sorted decks
    const filteredAndSortedDecks = useMemo(() => {
      let filtered = [...decks];
      
      // Apply color filter
      if (filterOptions.colors.length > 0) {
        filtered = filtered.filter(deck => {
          if (filterOptions.colorMatchMode === 'exactly') {
            // Exactly matching: deck must have exactly the selected colors (no more, no less)
            return deck.colors.length === filterOptions.colors.length &&
                   filterOptions.colors.every(color => deck.colors.includes(color));
          } else {
            // Including: deck must contain at least one of the selected colors
            return filterOptions.colors.some(color => deck.colors.includes(color));
          }
        });
      }
      
      // Apply bracket level filter
      if (filterOptions.bracketLevels.length > 0) {
        filtered = filtered.filter(deck => 
          deck.bracket_level && filterOptions.bracketLevels.includes(deck.bracket_level)
        );
      }
      
      // Apply minimum winrate filter
      if (filterOptions.minWinrate !== undefined) {
        filtered = filtered.filter(deck => deck.winrate >= filterOptions.minWinrate!);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'winrate':
            aValue = a.winrate;
            bValue = b.winrate;
            break;
          case 'totalGames':
            aValue = a.total_games;
            bValue = b.total_games;
            break;
          case 'bracketLevel':
            aValue = a.bracket_level || 0;
            bValue = b.bracket_level || 0;
            break;
          case 'lastPlayed':
            aValue = a.last_played ? new Date(a.last_played).getTime() : 0;
            bValue = b.last_played ? new Date(b.last_played).getTime() : 0;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      return filtered;
    }, [decks, filterOptions, sortBy, sortDirection]);
    
    const toggleColorFilter = (color: string) => {
      setFilterOptions(prev => ({
        ...prev,
        colors: prev.colors.includes(color)
          ? prev.colors.filter(c => c !== color)
          : [...prev.colors, color]
      }));
    };
    
    const toggleBracketFilter = (bracket: number) => {
      setFilterOptions(prev => ({
        ...prev,
        bracketLevels: prev.bracketLevels.includes(bracket)
          ? prev.bracketLevels.filter(b => b !== bracket)
          : [...prev.bracketLevels, bracket]
      }));
    };
    
    const toggleColorMatchMode = () => {
      setFilterOptions(prev => ({
        ...prev,
        colorMatchMode: prev.colorMatchMode === 'including' ? 'exactly' : 'including'
      }));
    };
    
    const clearFilters = () => {
      setFilterOptions({
        colors: [],
        colorMatchMode: 'including',
        bracketLevels: [],
      });
    };
    
    const setSortOption = (option: SortOption) => {
      if (sortBy === option) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortBy(option);
        setSortDirection('asc');
      }
      setShowSortModal(false);
    };

    return (
    <View style={styles.container}>
      {/* Header with Filter and Sort buttons */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Decks ({filteredAndSortedDecks.length})</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, filterOptions.colors.length > 0 || filterOptions.bracketLevels.length > 0 ? styles.activeFilter : null]}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.headerButtonText}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.headerButtonText}>
              Sort {sortDirection === 'asc' ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Deck List --- */}
        <ScrollView style={styles.scrollView}>
            {filteredAndSortedDecks.map((deck) => (
            <Pressable 
                key={deck.id} 
                style={({ pressed }) => [
                styles.deckCard,
                pressed && styles.deckCardPressed
                ]}
                onPress={() => handleDeckPress(deck.id)}
            >
                <Text style={styles.deckName}>{deck.name}</Text>
                <Text style={styles.deckColors}>Colors: {deck.colors.join(", ")}</Text>
                <Text style={styles.deckWinrate}>Winrate: {deck.winrate.toFixed(1)}%</Text>
            </Pressable>
            ))}
        </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Decks</Text>
            
            {/* Color Filters */}
            <Text style={styles.filterSectionTitle}>Colors</Text>
            
            {/* Color Match Mode Toggle */}
            <View style={styles.colorModeToggle}>
              <TouchableOpacity
                style={[
                  styles.colorModeButton,
                  filterOptions.colorMatchMode === 'including' && styles.colorModeButtonActive
                ]}
                onPress={() => setFilterOptions(prev => ({ ...prev, colorMatchMode: 'including' }))}
              >
                <Text style={[
                  styles.colorModeButtonText,
                  filterOptions.colorMatchMode === 'including' && styles.colorModeButtonTextActive
                ]}>
                  Including
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.colorModeButton,
                  filterOptions.colorMatchMode === 'exactly' && styles.colorModeButtonActive
                ]}
                onPress={() => setFilterOptions(prev => ({ ...prev, colorMatchMode: 'exactly' }))}
              >
                <Text style={[
                  styles.colorModeButtonText,
                  filterOptions.colorMatchMode === 'exactly' && styles.colorModeButtonTextActive
                ]}>
                  Exactly
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.colorModeHint}>
              {filterOptions.colorMatchMode === 'including' 
                ? 'Shows decks containing any of the selected colors' 
                : 'Shows decks with exactly the selected colors (no more, no less)'}
            </Text>
            
            <View style={styles.filterRow}>
              {allColors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.filterChip,
                    filterOptions.colors.includes(color) && styles.filterChipActive
                  ]}
                  onPress={() => toggleColorFilter(color)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterOptions.colors.includes(color) && styles.filterChipTextActive
                  ]}>
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bracket Level Filters */}
            <Text style={styles.filterSectionTitle}>Power Level</Text>
            <View style={styles.filterRow}>
              {allBracketLevels.map(bracket => (
                <TouchableOpacity
                  key={bracket}
                  style={[
                    styles.filterChip,
                    filterOptions.bracketLevels.includes(bracket) && styles.filterChipActive
                  ]}
                  onPress={() => toggleBracketFilter(bracket)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filterOptions.bracketLevels.includes(bracket) && styles.filterChipTextActive
                  ]}>
                    Level {bracket}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Decks</Text>
            
            {[
              { key: 'name', label: 'Name' },
              { key: 'winrate', label: 'Win Rate' },
              { key: 'totalGames', label: 'Total Games' },
              { key: 'bracketLevel', label: 'Power Level' },
              { key: 'lastPlayed', label: 'Last Played' },
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive
                ]}
                onPress={() => setSortOption(option.key as SortOption)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive
                ]}>
                  {option.label}
                  {sortBy === option.key && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.applyButton]}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.applyButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  deckCard: {
    margin: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  deckCardPressed: {
    backgroundColor: '#e0e0e0',
    transform: [{ scale: 0.98 }],
  },
  deckName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  deckColors: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  deckWinrate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionActive: {
    backgroundColor: '#f8f9fa',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  sortOptionTextActive: {
    fontWeight: '600',
    color: '#007AFF',
  },
  // Color mode toggle styles
  colorModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  colorModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  colorModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  colorModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  colorModeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  colorModeHint: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
});