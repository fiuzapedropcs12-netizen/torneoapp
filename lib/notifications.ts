import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import type { Partido } from '@/types/torneo'

// RF-12: recordatorio local (por dispositivo, sin push) de próximos partidos.
const ANTICIPACION_MS = 60 * 60 * 1000 // 1 hora antes de la fecha del partido

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function configurarNotificaciones() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('partidos', {
      name: 'Próximos partidos',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync()
  }
}

function idNotificacion(partidoId: string) {
  return `partido-${partidoId}`
}

/**
 * Cancela/reprograma las notificaciones locales de partidos según su estado y fecha.
 * Se llama cada vez que se refresca un torneo, para cualquier usuario (organizador o jugador)
 * que tenga la app abierta en su celular — no depende de infraestructura de push.
 */
export async function sincronizarNotificacionesPartidos(partidos: Partido[]) {
  const programadas = await Notifications.getAllScheduledNotificationsAsync()
  const idsProgramados = new Set(programadas.map((n) => n.identifier))
  const ahora = Date.now()

  for (const partido of partidos) {
    const identifier = idNotificacion(partido.id)
    const debeEstarProgramado =
      partido.estado === 'pendiente' &&
      !!partido.fecha &&
      new Date(partido.fecha).getTime() - ANTICIPACION_MS > ahora

    if (idsProgramados.has(identifier)) {
      await Notifications.cancelScheduledNotificationAsync(identifier)
    }

    if (!debeEstarProgramado) continue

    const fechaAviso = new Date(new Date(partido.fecha!).getTime() - ANTICIPACION_MS)

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: 'Próximo partido',
        body: `${partido.local.nombre} vs ${partido.visitante.nombre} — jornada ${partido.jornada}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fechaAviso,
      },
    })
  }
}
