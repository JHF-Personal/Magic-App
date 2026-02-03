import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Switch,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import { useDeck } from "../../contexts/DeckContext";
import { Deck, CreateDeckRequest } from "../../types/deck";

const COLORS = [
  { name: 'White', value: 'white', color: '#FFFBD5' },
  { name: 'Blue', value: 'blue', color: '#0E68AB' },
  { name: 'Black', value: 'black', color: '#150B00' },
  { name: 'Red', value: 'red', color: '#D3202A' },
  { name: 'Green', value: 'green', color: '#00733E' },
];

const BRACKET_LEVELS = [
  { level: 1, name: 'Precon Power', description: 'Preconstructed decks' },
  { level: 2, name: 'Casual', description: 'Lightly modified' },
  { level: 3, name: 'Focused', description: 'Optimized with clear strategy' },
  { level: 4, name: 'Optimized', description: 'High-power' },
  { level: 5, name: 'cEDH', description: 'Competitive EDH' },
];

export default function AddDeckTab() {
  const router = useRouter();
  const { createDeck } = useDeck();
  
  const [deckName, setDeckName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [commanderName, setCommanderName] = useState('');
  const [commanderCMC, setCommanderCMC] = useState('');
  const [averageManaValue, setAverageManaValue] = useState('');
  const [bracketLevel, setBracketLevel] = useState<number | null>(null);
  const [showPowerLevelModal, setShowPowerLevelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleColor = (colorValue: string) => {
    setSelectedColors(prev => 
      prev.includes(colorValue)
        ? prev.filter(c => c !== colorValue)
        : [...prev, colorValue]
    );
  };

  const handleSubmit = async () => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }

    if (!commanderName.trim()) {
      Alert.alert('Error', 'Please enter a commander name');
      return;
    }

    if (selectedColors.length === 0) {
      Alert.alert('Error', 'Please select at least one color');
      return;
    }

    if (!commanderCMC || isNaN(Number(commanderCMC)) || Number(commanderCMC) < 0) {
      Alert.alert('Error', 'Please enter a valid commander CMC');
      return;
    }

    if (!averageManaValue || isNaN(Number(averageManaValue)) || Number(averageManaValue) < 0) {
      Alert.alert('Error', 'Please enter a valid average mana value');
      return;
    }

    if (!bracketLevel) {
      Alert.alert('Error', 'Please select a power level');
      return;
    }

    setIsSubmitting(true);

    try {
      const newDeck: CreateDeckRequest = {
        user_id: 1, // Default user
        name: deckName.trim(),
        colors: selectedColors,
        commander_name: commanderName.trim(),
        commander_cmc: Number(commanderCMC),
        average_mana_value: Number(averageManaValue),
        bracket_level: bracketLevel,
        winrate: 0,
        description: description.trim() || undefined,
        cards: [],
      };

      const createdDeck = await createDeck(newDeck);
      
      Alert.alert(
        'Success!', 
        `${deckName} has been created successfully.`,
        [
          {
            text: 'View Deck',
            onPress: () => router.push(`/deck?id=${createdDeck.id}` as any),
          },
          {
            text: 'Create Another',
            onPress: () => {
              setDeckName('');
              setDescription('');
              setSelectedColors([]);
              setCommanderName('');
              setCommanderCMC('');
              setAverageManaValue('');
              setBracketLevel(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create deck. Please try again.');
      console.error('Error creating deck:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Create New Deck</Text>

        {/* Deck Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deck Name *</Text>
          <TextInput
            style={styles.textInput}
            value={deckName}
            onChangeText={setDeckName}
            placeholder="Enter deck name (e.g., Lightning Aggro)"
            placeholderTextColor="#999"
          />
        </View>

        {/* Commander Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commander *</Text>
          <TextInput
            style={styles.textInput}
            value={commanderName}
            onChangeText={setCommanderName}
            placeholder="Enter commander name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Color Identity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color Identity *</Text>
          <Text style={styles.helperText}>Select all colors in your deck</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.color },
                  selectedColors.includes(color.value) && styles.selectedColor,
                ]}
                onPress={() => toggleColor(color.value)}
              >
                <Text 
                  style={[
                    styles.colorButtonText,
                    { color: color.value === 'white' ? '#333' : '#fff' }
                  ]}
                >
                  {color.name[0]}
                </Text>
                {selectedColors.includes(color.value) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          {selectedColors.length > 0 && (
            <Text style={styles.selectedColorsText}>
              Selected: {selectedColors.map(c => COLORS.find(col => col.value === c)?.name).join(', ')}
            </Text>
          )}
        </View>

        {/* Commander CMC */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commander CMC *</Text>
          <TextInput
            style={styles.textInput}
            value={commanderCMC}
            onChangeText={setCommanderCMC}
            placeholder="e.g., 4"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>Converted mana cost of your commander</Text>
        </View>

        {/* Average Mana Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Average Mana Value *</Text>
          <TextInput
            style={styles.textInput}
            value={averageManaValue}
            onChangeText={setAverageManaValue}
            placeholder="e.g., 3.2"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
          <Text style={styles.helperText}>Average converted mana cost of all cards in your deck</Text>
        </View>

        {/* Power Level / Bracket */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Power Level *</Text>
          <Text style={styles.helperText}>Select your deck's competitive bracket (1-5)</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowPowerLevelModal(true)}
          >
            <Text style={[
              styles.dropdownText,
              !bracketLevel && styles.dropdownPlaceholder
            ]}>
              {bracketLevel 
                ? `Level ${bracketLevel} - ${BRACKET_LEVELS.find(b => b.level === bracketLevel)?.name}`
                : 'Select power level...'
              }
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your deck's strategy and key cards..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating Deck...' : 'Create Deck'}
          </Text>
        </TouchableOpacity>

        {/* Enhanced Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Deck Building Tips:</Text>
          <Text style={styles.helpText}>• All fields except Description are required</Text>
          <Text style={styles.helpText}>• Commander info helps track deck performance by archetype</Text>
          <Text style={styles.helpText}>• Power Level helps match against similar strength decks</Text>
          <Text style={styles.helpText}>• Average Mana Value indicates deck speed (lower = faster)</Text>
          
          <Text style={[styles.helpTitle, { marginTop: 15 }]}>Next Steps:</Text>
          <Text style={styles.helpText}>• Add cards to your deck from the deck details page</Text>
          <Text style={styles.helpText}>• Start tracking games to build performance statistics</Text>
          <Text style={styles.helpText}>• Use analytics to optimize your deck over time</Text>
        </View>

      </View>

      {/* Power Level Selection Modal */}
      <Modal
        visible={showPowerLevelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPowerLevelModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPowerLevelModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Power Level</Text>
            {BRACKET_LEVELS.map((bracket) => (
              <TouchableOpacity
                key={bracket.level}
                style={[
                  styles.modalOption,
                  bracketLevel === bracket.level && styles.selectedModalOption
                ]}
                onPress={() => {
                  setBracketLevel(bracket.level);
                  setShowPowerLevelModal(false);
                }}
              >
                <View style={styles.modalOptionContent}>
                  <Text style={[
                    styles.modalOptionNumber,
                    bracketLevel === bracket.level && styles.selectedModalText
                  ]}>
                    {bracket.level}
                  </Text>
                  <View style={styles.modalOptionDetails}>
                    <Text style={[
                      styles.modalOptionName,
                      bracketLevel === bracket.level && styles.selectedModalText
                    ]}>
                      {bracket.name}
                    </Text>
                    <Text style={[
                      styles.modalOptionDescription,
                      bracketLevel === bracket.level && styles.selectedModalText
                    ]}>
                      {bracket.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
  },
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedColor: {
    borderColor: '#0066cc',
    borderWidth: 3,
  },
  colorButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#0066cc',
    color: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
  },
  selectedColorsText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  // Dropdown styles
  dropdownButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
  },
  selectedModalOption: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f8ff',
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOptionNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  modalOptionDetails: {
    flex: 1,
  },
  modalOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  selectedModalText: {
    color: '#0066cc',
  },
});