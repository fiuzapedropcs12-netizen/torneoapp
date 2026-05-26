import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { useTorneo } from '@/context/TorneoContext'
import { colors } from '@/theme/colors'

export default function CargarResultadoModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { state, dispatch } = useTorneo()
  const router = useRouter()

  const [inputLocal, setInputLocal] = useState('')
  const [inputVisitante, setInputVisitante] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const partido = state.partidos.find((p) => p.id === id)

  // Guard: si el partido no existe, redirigir al fixture
  if (!partido) {
    return <Redirect href="/(tabs)/fixture" />
  }

  const handleConfirmar = async () => {
    const gl = parseInt(inputLocal, 10)
    const gv = parseInt(inputVisitante, 10)

    if (inputLocal.trim() === '' || inputVisitante.trim() === '' || isNaN(gl) || isNaN(gv)) {
      setError('El resultado no puede estar vacío')
      return
    }

    setError(null)
    setEnviando(true)

    // Simular latencia de red (500ms)
    await new Promise<void>((resolve) => setTimeout(resolve, 500))

    dispatch({
      type: 'CARGAR_RESULTADO',
      payload: { partidoId: id, golesLocal: gl, golesVisitante: gv },
    })

    router.back()
  }

  const handleCancelar = () => {
    router.back()
  }

  const inputLocalBorde = error && inputLocal.trim() === '' ? colors.error : colors.border
  const inputVisitanteBorde = error && inputVisitante.trim() === '' ? colors.error : colors.border

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fondo semitransparente tappeable para cerrar */}
      <TouchableOpacity style={styles.backdrop} onPress={handleCancelar} activeOpacity={1} />

      <View style={styles.modal}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Encabezado */}
        <Text style={styles.titulo}>Cargar Resultado</Text>
        <Text style={styles.subtitulo}>
          {partido.local.nombre} vs {partido.visitante.nombre}
        </Text>

        {/* Inputs de goles */}
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{partido.local.nombre.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { borderColor: inputLocalBorde }]}
              value={inputLocal}
              onChangeText={(v) => {
                setInputLocal(v)
                setError(null)
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.border}
              textAlign="center"
              maxLength={3}
              editable={!enviando}
            />
          </View>

          <Text style={styles.separador}>—</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{partido.visitante.nombre.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { borderColor: inputVisitanteBorde }]}
              value={inputVisitante}
              onChangeText={(v) => {
                setInputVisitante(v)
                setError(null)
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.border}
              textAlign="center"
              maxLength={3}
              editable={!enviando}
            />
          </View>
        </View>

        {/* Mensaje de error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Botón confirmar */}
        <TouchableOpacity
          style={[styles.botonConfirmar, enviando && styles.botonDeshabilitado]}
          onPress={handleConfirmar}
          disabled={enviando}
          activeOpacity={0.8}
        >
          {enviando ? (
            <>
              <ActivityIndicator size="small" color={colors.surface} />
              <Text style={styles.botonConfirmarText}>Enviando...</Text>
            </>
          ) : (
            <Text style={styles.botonConfirmarText}>Confirmar resultado</Text>
          )}
        </TouchableOpacity>

        {/* Cancelar */}
        <TouchableOpacity onPress={handleCancelar} disabled={enviando} activeOpacity={0.7}>
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  inputGroup: {
    alignItems: 'center',
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 72,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  separador: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textSecondary,
    paddingBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  botonConfirmar: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  botonConfirmarText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelarText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
})
