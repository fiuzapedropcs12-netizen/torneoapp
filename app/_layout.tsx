import { Stack } from 'expo-router'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { TorneoProvider } from '@/context/TorneoContext'
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
      <TorneoProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="fixture/[id]"
            options={{
              presentation: 'modal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </TorneoProvider>
    </PaperProvider>
  )
}
