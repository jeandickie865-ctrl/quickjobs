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
    const inputValue = event.target.value;
    console.log('📅 Input changed:', { mode, inputValue, currentValue: value });
    
    if (!inputValue) return;
    
    // MODE: TIME - nur Uhrzeit ändern
    if (mode === 'time') {
      // Split "HH:MM" format
      const [hours, minutes] = inputValue.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        console.error('❌ Invalid time format:', inputValue);
        return;
      }
      
      // Nutze existierendes Datum oder heute
      const baseDate = value ? new Date(value) : new Date();
      baseDate.setHours(hours);
      baseDate.setMinutes(minutes);
      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);
      
      console.log('🕐 Time updated:', baseDate.toISOString(), { hours, minutes });
      onChange(baseDate);
      return;
    }
    
    // MODE: DATE - nur Datum ändern
    if (mode === 'date') {
      const newDate = new Date(inputValue);
      
      if (isNaN(newDate.getTime())) {
        console.error('❌ Invalid date:', inputValue);
        return;
      }
      
      // Behalte die Uhrzeit vom vorherigen Wert
      if (value) {
        newDate.setHours(value.getHours());
        newDate.setMinutes(value.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
      }
      
      console.log('📅 Date updated:', newDate.toISOString());
      onChange(newDate);
      return;
    }
    
    // MODE: DATETIME (Fallback)
    const newDate = new Date(inputValue);
    if (!isNaN(newDate.getTime())) {
      onChange(newDate);
    }
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
    const inputRef = React.useRef<any>(null);
    
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable 
          style={styles.button}
          onPress={() => {
            inputRef.current?.click();
            inputRef.current?.focus();
          }}
        >
          <Text style={styles.buttonText}>
            {formatDisplayDateTime(value)}
          </Text>
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color="#5941FF" 
          />
        </Pressable>
        {/* Hidden HTML input for web - positioned absolute outside view */}
        <input
          ref={inputRef}
          type={getInputType()}
          value={formatDateTime(value) || ''}
          onChange={handleDateChange}
          min={getMinimum()}
          style={{
            position: 'absolute',
            left: 0,
            top: 30,
            opacity: 0,
            width: '100%',
            height: 44,
            zIndex: -1,
            pointerEvents: 'auto',
          }}
        />
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
