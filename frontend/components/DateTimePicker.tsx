// components/DateTimePicker.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, TextInput } from 'react-native';
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
  const formatDateTime = (date: Date | undefined) => {
    if (!date) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (mode === 'date') {
      return `${year}-${month}-${day}`;
    } else if (mode === 'time') {
      return `${hours}:${minutes}`;
    } else {
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  };

  const formatDisplayDateTime = (date: Date | undefined) => {
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

  const handleDateChange = (event: any) => {
    const dateString = event.target.value;
    if (!dateString) return;
    
    const newDate = new Date(dateString);
    if (isNaN(newDate.getTime())) return;
    
    // If we have an existing date/time, preserve the time when changing date
    if (value && mode === 'date') {
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
    }
    
    // If we have an existing date, preserve the date when changing time
    if (value && mode === 'time') {
      const existingDate = new Date(value);
      existingDate.setHours(newDate.getHours());
      existingDate.setMinutes(newDate.getMinutes());
      existingDate.setSeconds(0);
      existingDate.setMilliseconds(0);
      onChange(existingDate);
      return;
    }
    
    onChange(newDate);
  };

  const getInputType = () => {
    if (mode === 'date') return 'date';
    if (mode === 'time') return 'time';
    return 'datetime-local';
  };

  const getMinimum = () => {
    if (!minimumDate) return undefined;
    return formatDateTime(minimumDate);
  };

  // For Web: Use native HTML5 input
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.button}>
          <input
            type={getInputType()}
            value={formatDateTime(value)}
            onChange={handleDateChange}
            min={getMinimum()}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              fontSize: 16,
              fontWeight: '600',
              color: '#000',
              padding: 0,
              outline: 'none',
            }}
          />
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color="#C8FF16" 
          />
        </View>
      </View>
    );
  }

  // For Mobile: Use react-native-community/datetimepicker
  const DateTimePickerModal = require('@react-native-community/datetimepicker').default;
  const [show, setShow] = useState(false);

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
          {formatDisplayDateTime(value)}
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
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5941FF',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#5941FF',
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
