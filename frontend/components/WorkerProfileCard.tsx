import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { WorkerProfile } from '../types/profile';
import { formatAddress } from '../types/address';
import { getReviewsForWorker, calculateAverageRating } from '../utils/reviewStore';
import { StarRating } from './StarRating';

type WorkerProfileCardProps = {
  profile: WorkerProfile;
  isMatched: boolean; // Nach Match: Zeige Kontaktdaten
};

export const WorkerProfileCard: React.FC<WorkerProfileCardProps> = ({
  profile,
  isMatched,
}) => {
  const { colors, spacing } = useTheme();
  
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    (async () => {
      const reviews = await getReviewsForWorker(profile.userId);
      setReviewCount(reviews.length);
      if (reviews.length > 0) {
        setAverageRating(calculateAverageRating(reviews));
      }
    })();
  }, [profile.userId]);

  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return (profile.firstName[0] + profile.lastName[0]).toUpperCase();
    }
    if (profile.firstName) {
      return profile.firstName.substring(0, 2).toUpperCase();
    }
    return 'AN'; // Arbeitnehmer
  };

  const getDisplayName = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile.firstName) {
      return profile.firstName;
    }
    return 'Arbeitnehmer';
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.white,
          borderColor: colors.gray200,
          padding: spacing.md,
        },
      ]}
    >
      {/* Foto und Name */}
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.gray200 }]}>
          {profile.profilePhotoUri ? (
            <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.gray300 }]}>
              <Text style={[styles.initials, { color: colors.black }]}>
                {getInitials()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.black }]}>
            {getDisplayName()}
          </Text>
          <Text style={[styles.location, { color: colors.gray600 }]}>
            {formatAddress(profile.homeAddress, true) || 'Standort nicht angegeben'}
          </Text>
          
          {/* Rating */}
          {reviewCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <StarRating rating={averageRating} size={14} />
              <Text style={{ color: colors.gray700, fontSize: 13, fontWeight: '600' }}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={{ color: colors.gray500, fontSize: 12 }}>
                ({reviewCount})
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Steckbrief (immer sichtbar) */}
      {profile.shortBio && (
        <View style={[styles.section, { marginTop: spacing.sm }]}>
          <Text style={[styles.sectionTitle, { color: colors.gray600 }]}>
            Über mich
          </Text>
          <Text style={[styles.bioText, { color: colors.gray700 }]}>
            {profile.shortBio}
          </Text>
        </View>
      )}

      {/* Qualifikationen (immer sichtbar) */}
      <View style={[styles.section, { marginTop: spacing.sm }]}>
        <Text style={[styles.sectionTitle, { color: colors.gray600 }]}>
          Qualifikationen
        </Text>
        <View style={styles.tagsContainer}>
          {profile.categories.map((cat) => (
            <View
              key={cat}
              style={[
                styles.tag,
                {
                  backgroundColor: colors.beige100,
                  borderColor: colors.gray300,
                },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.black }]}>{cat}</Text>
            </View>
          ))}
        </View>
        {profile.selectedTags.length > 0 && (
          <Text style={[styles.tagsList, { color: colors.gray600, marginTop: 4 }]}>
            {profile.selectedTags.slice(0, 5).join(', ')}
            {profile.selectedTags.length > 5 ? '...' : ''}
          </Text>
        )}
      </View>

      {/* Kontaktdaten (nur nach Match) */}
      {isMatched && (
        <View
          style={[
            styles.contactSection,
            {
              marginTop: spacing.md,
              backgroundColor: colors.beige50,
              padding: spacing.sm,
              borderRadius: 8,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.black, marginBottom: 6 }]}>
            📞 Kontaktdaten
          </Text>
          
          {profile.contactPhone && (
            <View style={styles.contactItem}>
              <Text style={[styles.contactLabel, { color: colors.gray600 }]}>
                Telefon:
              </Text>
              <Text style={[styles.contactValue, { color: colors.black }]}>
                {profile.contactPhone}
              </Text>
            </View>
          )}
          
          {profile.contactEmail && (
            <View style={styles.contactItem}>
              <Text style={[styles.contactLabel, { color: colors.gray600 }]}>
                E-Mail:
              </Text>
              <Text style={[styles.contactValue, { color: colors.black }]}>
                {profile.contactEmail}
              </Text>
            </View>
          )}
          
          {!profile.contactPhone && !profile.contactEmail && (
            <Text style={[styles.noContactText, { color: colors.gray600 }]}>
              Keine Kontaktdaten hinterlegt
            </Text>
          )}
        </View>
      )}

      {/* Hinweis wenn nicht matched */}
      {!isMatched && (
        <View style={[styles.lockNotice, { marginTop: spacing.sm }]}>
          <Text style={[styles.lockText, { color: colors.gray500 }]}>
            🔒 Kontaktdaten werden nach dem Match freigeschaltet
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 20,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  location: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsList: {
    fontSize: 12,
  },
  contactSection: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    gap: 8,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 60,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  noContactText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  lockNotice: {
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
