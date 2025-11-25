// components/DateTimePicker.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import DateTimePickerModal from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
}) => {
  const [show, setShow] = useState(false);

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'Bitte wählen';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (mode === 'date') {
      return `${day}.${month}.${year}`;
    } else if (mode === 'time') {
      return `${hours}:${minutes}`;
    } else {
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {formatDateTime(value)}
        </Text>
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color="#C8FF16" 
        />
      </Pressable>

      {show && (
        <DateTimePickerModal
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          locale="de-DE"
        />
      )}
      
      {show && Platform.OS === 'ios' && (
        <Pressable
          onPress={() => setShow(false)}
          style={styles.doneButton}
        >
          <Text style={styles.doneButtonText}>Fertig</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C8FF16',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#C8FF16',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#C8FF16',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});

export default DateTimePicker;
