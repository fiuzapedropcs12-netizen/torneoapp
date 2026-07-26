import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { AuthProvider, useAuth } from '@/context/AuthContext'
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

/** Redirige a /login si no hay sesión, y a / si ya la hay y está en login/register. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (cargando) return
    const enAuth = segments[0] === 'login' || segments[0] === 'register'

    if (!usuario && !enAuth) {
      router.replace('/login')
    } else if (usuario && enAuth) {
      router.replace('/')
    }
  }, [usuario, cargando, segments, router])

  return children as React.ReactElement
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
      <AuthProvider>
        <AuthGate>
          <Stack>
            {/* Auth */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Crear cuenta', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFFFFF' }} />

            {/* Pantalla principal: lista de clubes */}
            <Stack.Screen
              name="index"
              options={{
                title: 'TorneoApp',
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
              }}
            />

            {/* Detalle de club: lista de torneos */}
            <Stack.Screen
              name="club/[clubId]"
              options={{
                headerStyle: { backgroundColor: colors.primary },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '700' },
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
        </AuthGate>
      </AuthProvider>
    </PaperProvider>
  )
}
