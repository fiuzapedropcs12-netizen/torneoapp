import { Stack } from 'expo-router'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { AppProvider } from '@/context/AppContext'
import { colors } from '@/theme/colors'

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
  },
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <PaperProvider theme={paperTheme}>
      <AppProvider>
        <Stack>
          {/* Pantalla principal: lista de torneos */}
          <Stack.Screen
            name="index"
            options={{
              title: 'TorneoApp',
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '700', fontSize: 18 },
            }}
          />

          {/* Crear / editar torneo */}
          <Stack.Screen
            name="torneo/crear"
            options={{
              title: 'Nuevo torneo',
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />

          {/* Detalle de torneo (sub-stack: tabla, fixture, equipos) */}
          <Stack.Screen
            name="torneo/[torneoId]/index"
            options={{
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />

          {/* Plantel de un equipo */}
          <Stack.Screen
            name="torneo/[torneoId]/equipo/[equipoId]"
            options={{
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '700' },
            }}
          />
        </Stack>
      </AppProvider>
    </PaperProvider>
  )
}
