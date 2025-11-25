// Tabs code for employer layout - to be copied into _layout.tsx

      {/* Tab 2: Matches */}
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 70,
              height: 48,
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              marginTop: -6,
            }}>
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                size={focused ? 38 : 34}
                color={focused ? COLORS.purple : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: 13,
              fontWeight: '800',
              color: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.6)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
              Matches
            </Text>
          ),
        }}
      />

      {/* Tab 3: Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 70,
              height: 48,
              backgroundColor: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              marginTop: -6,
            }}>
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={focused ? 38 : 34}
                color={focused ? COLORS.purple : color}
              />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: 13,
              fontWeight: '800',
              color: focused ? COLORS.neon : 'rgba(255, 255, 255, 0.6)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
              Profil
            </Text>
          ),
        }}
      />

      {/* Tab 4: Erstellen */}
      <Tabs.Screen
        name="jobs/create"
        options={{
          title: 'Erstellen',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 70,
              height: 48,
              backgroundColor: focused ? COLORS.neon : 'rgba(200, 255, 22, 0.2)',
              borderRadius: 16,
              marginTop: -6,
              borderWidth: 2,
              borderColor: focused ? COLORS.neon : 'rgba(200, 255, 22, 0.4)',
            }}>
              <Ionicons
                name="add-circle"
                size={40}
                color={focused ? COLORS.purple : COLORS.neon}
              />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: 13,
              fontWeight: '800',
              color: focused ? COLORS.neon : 'rgba(200, 255, 22, 0.8)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
              Erstellen
            </Text>
          ),
        }}
      />
