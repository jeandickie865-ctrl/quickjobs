import React, { useEffect, useState } from "react"
import { View, Text, ActivityIndicator, FlatList } from "react-native"
import { getMatchedJobs } from "../../utils/jobStore"
import { useAuth } from "../../contexts/AuthContext"

export default function WorkerFeedScreen() {
  const { signOut } = useAuth()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadJobs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getMatchedJobs()
      setJobs(data)
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        signOut()
        return
      }
      setError("Fehler beim Laden der Jobs")
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadJobs()
  }, [])

  if (isLoading) {
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text>{error}</Text>
      </View>
    )
  }

  if (jobs.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Keine passenden Jobs gefunden</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.title}</Text>
          <Text>{item.description}</Text>
          <Text>{item.category}</Text>
          <Text>{item.address}</Text>
        </View>
      )}
    />
  )
}
