import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getJobs } from "../../../utils/jobStore";
import { useAuth } from "../../../contexts/AuthContext";
import { getWorkerProfile } from "../../../utils/profileStore";

const COLORS = {
  purple: "#4A35D9",
  neon: "#C8FF16",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8A8A8A",
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
      console.log("⏳ [ALL JOBS] Waiting for auth to load...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📍 [ALL JOBS] Step 1: Loading worker profile for user:", user.userId);
      // 1. Worker-Profil laden (für Radius und Position)
      const profile = await getWorkerProfile(user.userId);
      
      if (!profile) {
        console.error("❌ [ALL JOBS] Worker profile not found");
        setError("Kein Worker-Profil gefunden");
        setIsLoading(false);
        return;
      }
      console.log("✅ [ALL JOBS] Profile loaded:", { homeLat: profile.homeLat, homeLon: profile.homeLon, radiusKm: profile.radiusKm });

      const { homeLat, homeLon, radiusKm } = profile;

      if (!homeLat || !homeLon) {
        console.error("❌ [ALL JOBS] No coordinates in profile");
        setError("Position im Profil nicht gesetzt");
        setIsLoading(false);
        return;
      }

      console.log("📍 [ALL JOBS] Step 2: Loading all jobs...");
      // 2. Alle Jobs laden
      const allJobs = await getJobs();
      console.log("✅ [ALL JOBS] Loaded", allJobs.length, "jobs from backend");

      // 3. Nur Jobs im Radius filtern (KEINE Kategorie oder Tags)
      const jobsInRadius = allJobs.filter((job) => {
        // Job muss Position haben
        if (!job.lat || !job.lon) {
          return false;
        }

        // Job muss offen sein
        if (job.status !== "open") {
          return false;
        }

        // Distanz berechnen
        const distanceKm = haversine(homeLat, homeLon, job.lat, job.lon);

        // Nur Jobs im Radius
        return distanceKm <= radiusKm;
      });

      console.log("✅ [ALL JOBS] Filtered", jobsInRadius.length, "jobs within", radiusKm, "km radius");

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.white }}>
        <ActivityIndicator color={COLORS.neon} size="large" />
        <Text style={{ marginTop: 16, color: COLORS.gray }}>Lade alle Jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.white, padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.gray} />
        <Text style={{ marginTop: 16, color: COLORS.gray, fontSize: 16, textAlign: "center" }}>{error}</Text>
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
          <Text style={{ color: COLORS.white, fontWeight: "600" }}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: COLORS.purple,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: "bold" }}>
            Alle Jobs
          </Text>
        </View>

        {/* Leer-Zustand */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="briefcase-outline" size={64} color={COLORS.gray} />
          <Text style={{ marginTop: 16, color: COLORS.gray, fontSize: 16, textAlign: "center" }}>
            Keine Jobs in deinem Umkreis gefunden
          </Text>
        </View>
      </View>
    );
  }

  const renderJobCard = ({ item }) => (
    <Pressable
      onPress={() => router.push(`/(worker)/jobs/${item.id}`)}
      style={({ pressed }) => ({
        backgroundColor: COLORS.purple,
        borderRadius: 14,
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: COLORS.neon,
        shadowColor: COLORS.neon,
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
          color: COLORS.white,
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
          backgroundColor: COLORS.neon,
          alignSelf: "flex-start",
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: COLORS.black,
            fontWeight: "700",
            fontSize: 12,
          }}
        >
          {item.category}
        </Text>
      </View>

      {/* Beschreibung */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginLeft: 8, flex: 1 }}>{item.description}</Text>
      </View>

      {/* Adresse */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Ionicons name="location-outline" size={18} color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginLeft: 8 }}>
          {item.address?.street} {item.address?.houseNumber},{" "}
          {item.address?.postalCode} {item.address?.city}
        </Text>
      </View>

      {/* Vergütung */}
      {item.workerAmountCents && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="cash-outline" size={18} color={COLORS.neon} />
          <Text style={{ color: COLORS.white, marginLeft: 8, fontWeight: "700" }}>
            {(item.workerAmountCents / 100).toFixed(2)} €
          </Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: COLORS.purple,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: "bold", flex: 1 }}>
          Alle Jobs
        </Text>
        <Text style={{ color: COLORS.neon, fontSize: 14, fontWeight: "600" }}>
          {jobs.length} Jobs
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
