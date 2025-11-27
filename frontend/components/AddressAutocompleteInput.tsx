import React, { useState, useRef, useEffect } from "react"
import { View, TextInput, TouchableOpacity, Text, FlatList, Modal, StyleSheet } from "react-native"

type Suggestion = {
  description: string
  place_id: string
}

type Props = {
  value: string
  onChangeText: (text: string) => void
  onSelect: (item: Suggestion) => void
  fetchSuggestions: (query: string) => Promise<Suggestion[]>
  placeholder?: string
}

export default function AddressAutocompleteInput({
  value,
  onChangeText,
  onSelect,
  fetchSuggestions,
  placeholder
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [visible, setVisible] = useState(false)
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const inputRef = useRef<TextInput>(null)

  // Absichern: value darf nie undefined sein
  const safeValue = value ?? "";

  const handleChange = async (text: string) => {
    onChangeText(text)
    const safeText = text ?? "";
    if (safeText.length < 2) {
      setSuggestions([])
      setVisible(false)
      return
    }

    const res = await fetchSuggestions(safeText)
    setSuggestions(res)
    setVisible(true)
  }

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
        value={value}
        placeholder={placeholder}
        onChangeText={handleChange}
        style={styles.input}
        onFocus={() => {
          if (value.length >= 2) {
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
