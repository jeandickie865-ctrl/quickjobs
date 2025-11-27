import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getMatchedJobs } from "../../utils/jobStore";
import { useAuth } from "../../contexts/AuthContext";

const COLORS = {
  purple: "#4A35D9",
  neon: "#C8FF16",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#8A8A8A",
};

export default function WorkerFeedScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getMatchedJobs();
      setJobs(data);
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        signOut();
        return;
      }
      setError("Fehler beim Laden der Jobs");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, []);

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
    <View
      style={{
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
      }}
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

      {/* Kategorie */}
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
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginLeft: 8, flex: 1 }}>{item.description}</Text>
      </View>

      {/* Adresse */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Ionicons name="location-outline" size={18} color={COLORS.neon} />
        <Text style={{ color: COLORS.white, marginLeft: 8 }}>
          {item.address?.street} {item.address?.houseNumber},{" "}
          {item.address?.postalCode} {item.address?.city}
        </Text>
      </View>

      {/* Optional: Vergütung */}
      {item.workerAmountCents && (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="cash-outline" size={18} color={COLORS.neon} />
          <Text style={{ color: COLORS.white, marginLeft: 8, fontWeight: "700" }}>
            {(item.workerAmountCents / 100).toFixed(2)} €
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={renderJobCard}
      contentContainerStyle={{ paddingVertical: 10 }}
    />
  );
}
