import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { searchAddress, AddressSuggestion } from '../services/geocoding';

type AddressAutocompleteInputProps = {
  street: string;
  postalCode?: string;
  city?: string;
  onStreetChange: (value: string) => void;
  onPostalCodeChange?: (value: string) => void;
  onCityChange?: (value: string) => void;
  onLatChange?: (value: number) => void;
  onLonChange?: (value: number) => void;
  onGeocodingError?: (error: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  street,
  postalCode,
  city,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onLatChange,
  onLonChange,
  onGeocodingError,
  placeholder = 'Straße und Hausnummer',
  disabled = false,
}) => {
  const { colors, spacing } = useTheme();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const geocodingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!street || street.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Nur suchen, wenn wir mindestens Stadt oder PLZ haben
    const hasLocationContext =
      (postalCode && postalCode.trim().length > 0) ||
      (city && city.trim().length > 0);

    if (!hasLocationContext) {
      // Keine Suche ohne Kontext → Dropdown bleibt leer
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Address search start', { street, postalCode, city });
        
        const result = await searchAddress(street.trim(), postalCode, city);
        
        console.log('✅ Address search result', result.length, 'suggestions');
        
        if (!active) return;
        setSuggestions(result);
        setShowDropdown(result.length > 0);
      } catch (e) {
        console.error('❌ searchAddress error', e);
        if (!active) return;
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [street, postalCode, city]);

  const handleSuggestionPress = (suggestion: AddressSuggestion) => {
    console.log('🎯 Selected suggestion', suggestion);
    
    if (suggestion.street && onStreetChange) {
      onStreetChange(suggestion.street);
    }
    if (suggestion.postalCode && onPostalCodeChange) {
      onPostalCodeChange(suggestion.postalCode);
    }
    if (suggestion.city && onCityChange) {
      onCityChange(suggestion.city);
    }
    if (typeof suggestion.lat === 'number' && onLatChange) {
      onLatChange(suggestion.lat);
      console.log('📍 Address geocoded - Lat:', suggestion.lat);
    }
    if (typeof suggestion.lon === 'number' && onLonChange) {
      onLonChange(suggestion.lon);
      console.log('📍 Address geocoded - Lon:', suggestion.lon);
    }
    
    setShowDropdown(false);
    setSuggestions([]);
  };

  // Auto-geocode when user stops typing or blurs
  const triggerAutoGeocode = async () => {
    console.log('🔄 Auto-geocoding triggered', { street, postalCode, city });
    
    // Clear any existing timer
    if (geocodingTimerRef.current) {
      clearTimeout(geocodingTimerRef.current);
    }

    // Need all address components
    if (!street || !postalCode || !city) {
      console.log('⚠️ Auto-geocoding skipped - missing address components');
      return;
    }

    try {
      setIsLoading(true);
      const results = await searchAddress(street.trim(), postalCode, city);
      
      if (results.length === 0) {
        console.log('❌ Auto-geocoding - no results found');
        if (onGeocodingError) {
          onGeocodingError('Adresse konnte nicht gefunden werden. Bitte aus Vorschlägen auswählen.');
        }
        setIsLoading(false);
        return;
      }

      // If exactly one match, auto-set coordinates
      if (results.length === 1) {
        const match = results[0];
        console.log('✅ Auto-geocoding success (1 match)', match);
        
        if (typeof match.lat === 'number' && onLatChange) {
          onLatChange(match.lat);
          console.log('📍 Address geocoded - Lat:', match.lat);
        }
        if (typeof match.lon === 'number' && onLonChange) {
          onLonChange(match.lon);
          console.log('📍 Address geocoded - Lon:', match.lon);
        }
      } else {
        // Multiple matches - show dropdown
        console.log(`⚠️ Auto-geocoding - ${results.length} matches, showing dropdown`);
        setSuggestions(results);
        setShowDropdown(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Auto-geocoding error', error);
      if (onGeocodingError) {
        onGeocodingError('Fehler beim Geocoding. Bitte erneut versuchen.');
      }
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    // Close dropdown after a delay to allow suggestion clicks
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
    
    // Trigger auto-geocode
    triggerAutoGeocode();
  };

  const handleChangeWithAutoGeocode = (text: string) => {
    onStreetChange(text);
    
    if (text.length < 3) {
      setShowDropdown(false);
      return;
    }

    // Clear existing timer
    if (geocodingTimerRef.current) {
      clearTimeout(geocodingTimerRef.current);
    }

    // Set new timer for auto-geocode after 600ms
    geocodingTimerRef.current = setTimeout(() => {
      triggerAutoGeocode();
    }, 600);
  };

  return (
    <View style={[styles.container, { zIndex: 100 }]}>
      <View style={styles.inputContainer}>
        <TextInput
          value={street}
          onChangeText={handleChangeWithAutoGeocode}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          editable={!disabled}
          style={[
            styles.input,
            {
              backgroundColor: colors.white,
              borderColor: showDropdown ? colors.black : colors.gray200,
              color: colors.black,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        />
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.gray500} />
          </View>
        )}
      </View>

      {showDropdown && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.white,
              borderColor: colors.gray200,
              marginTop: 4,
              zIndex: 200,
            },
          ]}
        >
          <ScrollView 
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            style={styles.scrollView}
          >
            {suggestions.map((item, index) => (
              <Pressable
                key={`suggestion-${index}`}
                onPress={() => handleSuggestionPress(item)}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  {
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderBottomColor: colors.gray100,
                    backgroundColor: pressed ? colors.gray50 : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.suggestionMain, { color: colors.black }]}>
                  {item.street || 'Straße unbekannt'}
                </Text>
                <Text style={[styles.suggestionSecondary, { color: colors.gray600 }]}>
                  {[item.postalCode, item.city].filter(Boolean).join(' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 14,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    maxHeight: 250,
  },
  suggestionItem: {
    borderBottomWidth: 1,
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionSecondary: {
    fontSize: 12,
    marginTop: 2,
  },
});
