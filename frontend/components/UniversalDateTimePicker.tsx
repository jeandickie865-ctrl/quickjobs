// components/UniversalDateTimePicker.tsx - Funktioniert auf ALLEN Geräten!
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface UniversalDateTimePickerProps {
  mode: 'date' | 'time' | 'datetime';
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
  minimumDate?: Date;
}

const COLORS = {
  purple: '#5941FF',
  neon: '#C8FF16',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F5F5F5',
};

export default function UniversalDateTimePicker({
  mode,
  value,
  onChange,
  label,
  minimumDate,
}: UniversalDateTimePickerProps) {
  
  const getDateFormat = () => {
    if (mode === 'date') return 'dd.MM.yyyy';
    if (mode === 'time') return 'HH:mm';
    return 'dd.MM.yyyy HH:mm';
  };

  const getPlaceholder = () => {
    if (mode === 'date') return 'TT.MM.JJJJ';
    if (mode === 'time') return 'HH:MM';
    return 'TT.MM.JJJJ HH:MM';
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={{ position: 'relative' }}>
        <div style={{ width: '100%' }}>
          <DatePicker
            selected={value}
            onChange={(date) => onChange(date || undefined)}
            showTimeSelect={mode === 'time' || mode === 'datetime'}
            showTimeSelectOnly={mode === 'time'}
            timeIntervals={15}
            timeFormat="HH:mm"
            dateFormat={getDateFormat()}
            placeholderText={getPlaceholder()}
            minDate={minimumDate}
            locale="de"
            className="custom-datepicker"
            wrapperClassName="datepicker-wrapper"
            calendarClassName="datepicker-calendar"
            popperPlacement="bottom-start"
            popperModifiers={[
              {
                name: 'offset',
                options: {
                  offset: [0, 8],
                },
              },
            ]}
            customInput={
              <input
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  border: '2px solid #E0E0E0',
                  fontSize: 16,
                  fontFamily: 'system-ui',
                  backgroundColor: COLORS.white,
                  color: COLORS.black,
                  cursor: 'pointer',
                }}
              />
            }
          />
        </div>
      </View>

      <style>{`
        .custom-datepicker {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 2px solid #E0E0E0;
          font-size: 16px;
          font-family: system-ui;
          background-color: ${COLORS.white};
          color: ${COLORS.black};
          cursor: pointer;
        }
        
        .custom-datepicker:focus {
          outline: none;
          border-color: ${COLORS.neon};
        }
        
        .datepicker-wrapper {
          width: 100%;
          position: relative;
        }
        
        /* Kalender Overlay - schwebt über allem */
        .react-datepicker-popper {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          z-index: 9999 !important;
          margin-top: 8px !important;
        }
        
        .react-datepicker {
          font-family: system-ui;
          border: 2px solid ${COLORS.purple};
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          background-color: ${COLORS.white} !important;
          position: relative !important;
        }
        
        .react-datepicker__portal {
          z-index: 9999 !important;
        }
        
        /* Verhindere Layout-Verschiebung */
        .react-datepicker-wrapper {
          display: block !important;
          width: 100% !important;
        }
        
        .react-datepicker__input-container {
          display: block !important;
          width: 100% !important;
        }
        
        .react-datepicker__header {
          background-color: ${COLORS.purple};
          border-bottom: none;
          padding-top: 12px;
        }
        
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker-year-header {
          color: ${COLORS.white};
          font-weight: 700;
          font-size: 16px;
        }
        
        .react-datepicker__day-name {
          color: ${COLORS.white};
          font-weight: 600;
        }
        
        .react-datepicker__day:hover {
          background-color: ${COLORS.neon};
          color: ${COLORS.black};
        }
        
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: ${COLORS.neon};
          color: ${COLORS.black};
          font-weight: 700;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
          background-color: ${COLORS.neon};
          color: ${COLORS.black};
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: ${COLORS.white};
        }
        
        .react-datepicker__navigation:hover *::before {
          border-color: ${COLORS.neon};
        }
      `}</style>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 8,
  },
});
