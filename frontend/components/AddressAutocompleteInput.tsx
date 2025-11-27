import React, { useState, useRef, useEffect } from "react"
import { View, TextInput, TouchableOpacity, Text, FlatList, Modal, StyleSheet } from "react-native"

type Suggestion = {
  description: string
  place_id: string
}

interface Props {
  street: string
  postalCode: string
  city: string
  houseNumber?: string
  onStreetChange?: (text: string) => void
  onPostalCodeChange?: (text: string) => void
  onCityChange?: (text: string) => void
  onHouseNumberChange?: (text: string) => void
  onLatChange?: (lat: number) => void
  onLonChange?: (lon: number) => void
  placeholder?: string
}

export default function AddressAutocompleteInput({
  street,
  postalCode,
  city,
  houseNumber,
  onStreetChange,
  onPostalCodeChange,
  onCityChange,
  onHouseNumberChange,
  onLatChange,
  onLonChange,
  placeholder
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [visible, setVisible] = useState(false)

  // Absichern: alle values dürfen nie undefined sein
  const safeStreet = street ?? "";
  const safePostalCode = postalCode ?? "";
  const safeCity = city ?? "";
  const safeHouseNumber = houseNumber ?? "";

  const handleSelect = (item: Suggestion) => {
    onSelect(item)
    setVisible(false)
  }

  const measureInput = () => {
    inputRef.current?.measureInWindow((x, y, width, height) => {
      setInputLayout({ x, y, width, height })
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (visible) measureInput()
    }, 50)
    return () => clearTimeout(timer)
  }, [visible])

  return (
    <View>
      <TextInput
        ref={inputRef}
        value={safeValue}
        placeholder={placeholder}
        onChangeText={handleChange}
        style={styles.input}
        onFocus={() => {
          if (safeValue.length >= 2) {
            setVisible(true)
            measureInput()
          }
        }}
      />

      <Modal transparent visible={visible} animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)}>
          <View
            style={[
              styles.dropdown,
              {
                position: "absolute",
                top: inputLayout.y + inputLayout.height,
                left: inputLayout.x,
                width: inputLayout.width
              }
            ]}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)} style={styles.item}>
                  <Text style={styles.text}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd"
  },
  overlay: {
    flex: 1
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 220
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  text: {
    color: "#333"
  }
})
