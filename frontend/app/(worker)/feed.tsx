import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getMatchedJobs } from "../../utils/jobStore";
import { useAuth } from "../../contexts/AuthContext";
import { getTagLabel } from "../../utils/taxonomy";
import { getWorkerProfile } from "../../utils/profileStore";

const COLORS = {
  purple: "#4A35D9",
  neon: "#C8FF16",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8A8A8A",
};

export default function WorkerFeedScreen() {
  const { user, token, loading, signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpcomingJob = (job) => {
    if (!job.date || !job.startAt || !job.endAt) return false;

    const today = new Date();
    today.setHours(0,0,0,0);

    const jobDate = new Date(job.date);
    if (isNaN(jobDate)) return false;

    // In der Vergangenheit? → raus
    if (jobDate < today) return false;

    // Heute → Endzeit prüfen
    if (jobDate.getTime() === today.getTime()) {
      const now = new Date();
      const [endH, endM] = job.endAt.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(endH, endM, 0, 0);
      if (endTime < now) return false;
    }

    // Status muss 'open' sein
    if (job.status !== 'open') return false;

    return true;
  };

  const hideMatchedJobs = (job) => {
    // Wenn Job ein Match hat, nicht anzeigen
    if (job.status === "matched" || job.status === "done" || job.status === "cancelled") {
      return false;
    }

    // Falls backend ein Feld matchedApplication oder similar zurückgibt:
    if (job.matchedApplication || job.matchedWorkerId || job.chosenApplicationId) {
      return false;
    }

    return true;
  };

  const loadJobs = async () => {
    // Sicherstellen, dass user und token geladen sind
    if (!token || !user) {
      console.log("⏳ Waiting for auth to load...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📋 Loading matched jobs...");
      const data = await getMatchedJobs();
      console.log("✅ Matched jobs loaded:", data.length);
      
      let filtered = data.filter(isUpcomingJob);
      filtered = filtered.filter(hideMatchedJobs);
      setJobs(filtered);
    } catch (err: any) {
      console.error("❌ Error loading jobs:", err);
      if (err.message === "UNAUTHORIZED" || err.message?.includes("no token found")) {
        setIsLoading(false);
        signOut();
        return;
      }
      // Check if it's a "profile not found" error
      if (err.message?.includes("FAILED_TO_FETCH_MATCHED_JOBS")) {
        setError("Du musst zuerst dein Profil vervollständigen, um passende Jobs zu sehen. Bitte gehe zum Profil-Tab.");
        setIsLoading(false);
        return;
      }
      setError(`Fehler beim Laden der Jobs: ${err.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await getWorkerProfile();
      setProfile(data);
    } catch (err) {
      console.log('Profile load error:', err);
    }
  };

  useEffect(() => {
    if (!loading && token && user) {
      loadJobs();
      loadProfile();
    }
  }, [loading, token, user]);

  if (isLoading) {
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator color={COLORS.neon} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Keine passenden Jobs gefunden</Text>
      </View>
    );
  }

  const renderJobCard = ({ item }) => (
    <Pressable
      onPress={() => router.push(`/jobs/${item.id}`)}
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
        <View style={{ marginTop: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
            {(item.workerAmountCents / 100).toFixed(2)} € (Brutto = Netto)
          </Text>

          {!profile?.isSelfEmployed && (
            <Text style={{ fontSize: 11, color: '#666' }}>
              § 40a EStG – keine Abzüge
            </Text>
          )}
        </View>
      )}

      {/* Tags anzeigen */}
      {(item.required_all_tags?.length > 0 || item.required_any_tags?.length > 0) && (
        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.neon, paddingTop: 10 }}>
          {/* Pflicht-Tags */}
          {item.required_all_tags?.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: COLORS.neon, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
                PFLICHT
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.required_all_tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: "#5941FF",
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: COLORS.neon,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: "600" }}>
                      {getTagLabel(item.category, tag)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Optional-Tags (mindestens eine) */}
          {item.required_any_tags?.length > 0 && (
            <View>
              <Text style={{ color: COLORS.gray, fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
                MINDESTENS EINE
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.required_any_tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: "#8A8A8A",
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: "600" }}>
                      {getTagLabel(item.category, tag)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
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
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          backgroundColor: COLORS.purple,
        }}
      >
        <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: "bold" }}>
          Passende Jobs
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
