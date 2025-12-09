import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getJobs } from "../../../utils/jobStore";
import { useAuth } from "../../../contexts/AuthContext";
import { getWorkerProfile } from "../../../utils/profileStore";
import { AppHeader } from '../../../components/AppHeader';

const COLORS = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#9333EA',      // Lila
  primaryLight: '#C084FC', // Helles Lila
  secondary: '#FF773D',    // Orange
  accent: '#EFABFF',       // Rosa
  accentLight: '#FCE7FF',  // Sehr helles Rosa
  border: '#E9D5FF',       // Lila Border
  inputBg: '#FAF5FF',      // Sehr helles Lila für Inputs
  inputBorder: '#DDD6FE',  // Lila Border für Inputs
  text: '#1A1A1A',         // Dunkelgrau für Text
  textMuted: '#6B7280',    // Grau für sekundären Text
  error: '#EF4444',        // Rot für Fehler
};

// Haversine-Formel zur Berechnung der Distanz zwischen zwei Koordinaten
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Erdradius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AllJobsScreen() {
  const { user, token, loading, signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllJobsInRadius = async () => {
    // Warten bis Auth geladen ist
    if (!token || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Worker-Profil laden (für Radius und Position)
      const profile = await getWorkerProfile(user.userId);
      
      if (!profile) {
        console.error("❌ [ALL JOBS] Worker profile not found");
        setError("Kein Worker-Profil gefunden");
        setIsLoading(false);
        return;
      }

      const { homeLat, homeLon, radiusKm } = profile;

      if (!homeLat || !homeLon) {
        console.error("❌ [ALL JOBS] No coordinates in profile");
        setError("Position im Profil nicht gesetzt");
        setIsLoading(false);
        return;
      }

      // 2. Alle Jobs laden
      const allJobs = await getJobs();

      // 3. Nur Jobs im Radius filtern (KEINE Kategorie oder Tags)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const jobsInRadius = allJobs.filter((job) => {
        // Job muss Position haben
        if (!job.lat || !job.lon) {
          return false;
        }

        // Job muss offen sein
        if (job.status !== "open") {
          return false;
        }

        // Job darf nicht vergeben sein
        if (job.matchedWorkerId) {
          return false;
        }

        // Job darf nicht abgelaufen sein (date >= heute)
        if (job.date) {
          const jobDate = new Date(job.date);
          if (isNaN(jobDate.getTime())) {
            return false; // Ungültiges Datum
          }
          if (jobDate < today) {
            return false; // Abgelaufener Job
          }
        }

        // Distanz berechnen
        const distanceKm = haversine(homeLat, homeLon, job.lat, job.lon);

        // Nur Jobs im Radius
        return distanceKm <= radiusKm;
      });


      // Nach Distanz sortieren (nächste zuerst)
      jobsInRadius.sort((a, b) => {
        const distA = haversine(homeLat, homeLon, a.lat, a.lon);
        const distB = haversine(homeLat, homeLon, b.lat, b.lon);
        return distA - distB;
      });

      setJobs(jobsInRadius);
    } catch (err: any) {
      console.error("❌ [ALL JOBS] Error:", err);
      if (err.message === "UNAUTHORIZED") {
        signOut();
        return;
      }
      setError(`Fehler beim Laden der Jobs: ${err.message || 'Unbekannt'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && token && user) {
      loadAllJobsInRadius();
    }
  }, [loading, token, user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={{ marginTop: 16, color: COLORS.textMuted }}>Lade alle Jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg, padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray} />
        <Text style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 16, textAlign: "center" }}>{error}</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: COLORS.purple,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "600" }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <AppHeader />

        {/* Leer-Zustand */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="briefcase-outline" size={64} color={COLORS.textMuted} />
          <Text style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 16, textAlign: "center" }}>
            Keine Jobs in deinem Umkreis gefunden
          </Text>
        </View>
      </View>
    );
  }

  const renderJobCard = ({ item }) => (
    <Pressable
      onPress={() => router.push(`/(worker)/alljobs/${item.id}`)}
      style={({ pressed }) => ({
        backgroundColor: COLORS.purple,
        borderRadius: 14,
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: COLORS.accent,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {/* Titel */}
      <Text
        style={{
          color: COLORS.text,
          fontSize: 18,
          fontWeight: "800",
          marginBottom: 6,
        }}
      >
        {item.title}
      </Text>

      {/* Kategorie Badge */}
      <View
        style={{
          backgroundColor: COLORS.accent,
          alignSelf: "flex-start",
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: COLORS.bg,
            fontWeight: "700",
            fontSize: 12,
          }}
        >
          {item.category}
        </Text>
      </View>

      {/* Beschreibung */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
        <Text style={{ color: COLORS.text, marginLeft: 8, flex: 1 }}>{item.description}</Text>
      </View>

      {/* Adresse */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Ionicons name="location-outline" size={18} color={COLORS.accent} />
        <Text style={{ color: COLORS.text, marginLeft: 8 }}>
          {item.address?.street}, {item.address?.postalCode} {item.address?.city}
        </Text>
      </View>

      {/* Vergütung */}
      {item.workerAmountCents && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="cash-outline" size={18} color={COLORS.accent} />
          <Text style={{ color: COLORS.text, marginLeft: 8, fontWeight: "700" }}>
            {(item.workerAmountCents / 100).toFixed(2)} €
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <AppHeader />
      
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "bold" }}>
          Alle Jobs
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
          {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} gefunden
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobCard}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
}
