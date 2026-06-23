import React, { useEffect, useLayoutEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useTorneo } from '@/context/AppContext'
import { useConexion } from '@/hooks/useConexion'
import TabsInternos, { type TabInterno } from '@/components/TabsInternos'
import ConexionBanner from '@/components/ConexionBanner'
import TablaRow from '@/components/TablaRow'
import PartidoCard from '@/components/PartidoCard'
import EquipoRow from '@/components/EquipoRow'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import FAB from '@/components/FAB'
import { colors } from '@/theme/colors'
import type { FilaTabla } from '@/types/torneo'

// ── Cabecera de la tabla de posiciones ────────────────────────────────────────

function CabeceraTabla() {
  return (
    <View style={styles.cabeceraTabla}>
      <Text style={[styles.cabeceraCol, { width: 24 }]}>#</Text>
      <Text style={[styles.cabeceraCol, { flex: 1, textAlign: 'left', paddingLeft: 6 }]}>EQUIPO</Text>
      <Text style={styles.cabeceraCol}>PJ</Text>
      <Text style={styles.cabeceraCol}>PG</Text>
      <Text style={styles.cabeceraCol}>PE</Text>
      <Text style={styles.cabeceraCol}>PP</Text>
      <Text style={styles.cabeceraCol}>+/-</Text>
      <Text style={[styles.cabeceraCol, { width: 40 }]}>GOLES</Text>
      <Text style={styles.cabeceraCol}>PTS</Text>
    </View>
  )
}

// ── Modal genérico con un TextInput (agregar / renombrar equipo) ───────────────

type ModalTextoProps = {
  visible: boolean
  titulo: string
  placeholder: string
  valorInicial?: string
  labelConfirmar: string
  onConfirmar: (valor: string) => void
  onCancelar: () => void
}

function ModalTexto({
  visible,
  titulo,
  placeholder,
  valorInicial = '',
  labelConfirmar,
  onConfirmar,
  onCancelar,
}: ModalTextoProps) {
  const [texto, setTexto] = useState(valorInicial)

  // Sincronizar cuando cambia el valor inicial (ej: renombrar distintos equipos)
  useEffect(() => {
    setTexto(valorInicial)
  }, [visible, valorInicial])

  function confirmar() {
    const val = texto.trim()
    if (!val) return
    onConfirmar(val)
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancelar}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalFondo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.modalFondo} onPress={onCancelar}>
          <Pressable style={styles.modalCaja} onPress={() => {}}>
            <Text style={styles.modalTitulo}>{titulo}</Text>
            <TextInput
              style={styles.modalInput}
              value={texto}
              onChangeText={setTexto}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={confirmar}
            />
            <View style={styles.modalBotones}>
              <Pressable style={[styles.modalBoton, styles.modalBotonCancelar]} onPress={onCancelar}>
                <Text style={styles.modalBotonCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBoton, styles.modalBotonConfirmar]} onPress={confirmar}>
                <Text style={styles.modalBotonConfirmarTexto}>{labelConfirmar}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Modal cargar resultado ─────────────────────────────────────────────────────

type ModalResultadoProps = {
  visible: boolean
  localNombre: string
  visitanteNombre: string
  onConfirmar: (gl: number, gv: number) => void
  onCancelar: () => void
}

function ModalResultado({
  visible,
  localNombre,
  visitanteNombre,
  onConfirmar,
  onCancelar,
}: ModalResultadoProps) {
  const [inputLocal, setInputLocal] = useState('')
  const [inputVisitante, setInputVisitante] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (visible) {
      setInputLocal('')
      setInputVisitante('')
      setError(null)
      setEnviando(false)
    }
  }, [visible])

  async function confirmar() {
    const gl = parseInt(inputLocal, 10)
    const gv = parseInt(inputVisitante, 10)

    if (!inputLocal.trim() || !inputVisitante.trim() || isNaN(gl) || isNaN(gv)) {
      setError('Ingresá ambos resultados')
      return
    }

    setError(null)
    setEnviando(true)
    // Simular latencia de 500ms (TODO E3: reemplazar con llamada al backend Go)
    await new Promise<void>((resolve) => setTimeout(resolve, 500))
    onConfirmar(gl, gv)
    setEnviando(false)
  }

  const borderLocal = error && !inputLocal.trim() ? colors.error : colors.border
  const borderVisitante = error && !inputVisitante.trim() ? colors.error : colors.border

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onCancelar}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.resultadoOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onCancelar} activeOpacity={1} />

        <View style={styles.resultadoModal}>
          <View style={styles.resultadoHandle} />
          <Text style={styles.resultadoTitulo}>Cargar resultado</Text>
          <Text style={styles.resultadoSubtitulo}>
            {localNombre} vs {visitanteNombre}
          </Text>

          <View style={styles.resultadoInputsRow}>
            <View style={styles.resultadoInputGrupo}>
              <Text style={styles.resultadoInputLabel}>{localNombre.toUpperCase()}</Text>
              <TextInput
                style={[styles.resultadoInput, { borderColor: borderLocal }]}
                value={inputLocal}
                onChangeText={(v) => { setInputLocal(v); setError(null) }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.border}
                textAlign="center"
                maxLength={3}
                editable={!enviando}
              />
            </View>

            <Text style={styles.resultadoSeparador}>—</Text>

            <View style={styles.resultadoInputGrupo}>
              <Text style={styles.resultadoInputLabel}>{visitanteNombre.toUpperCase()}</Text>
              <TextInput
                style={[styles.resultadoInput, { borderColor: borderVisitante }]}
                value={inputVisitante}
                onChangeText={(v) => { setInputVisitante(v); setError(null) }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.border}
                textAlign="center"
                maxLength={3}
                editable={!enviando}
              />
            </View>
          </View>

          {error && <Text style={styles.resultadoError}>{error}</Text>}

          <TouchableOpacity
            style={[styles.resultadoBoton, enviando && { opacity: 0.7 }]}
            onPress={confirmar}
            disabled={enviando}
            activeOpacity={0.8}
          >
            {enviando
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.resultadoBotonTexto}>Confirmar resultado</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancelar} disabled={enviando} activeOpacity={0.7}>
            <Text style={styles.resultadoCancelar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────────

export default function TorneoDetailScreen() {
  const { torneoId } = useLocalSearchParams<{ torneoId: string }>()
  const { torneo, dispatch } = useTorneo(torneoId!)
  const conexion = useConexion()
  const navigation = useNavigation()

  const [tabActiva, setTabActiva] = useState<TabInterno>('tabla')

  // Modales
  const [dialogEliminarTorneo, setDialogEliminarTorneo] = useState(false)
  const [dialogEliminarEquipo, setDialogEliminarEquipo] = useState<{ visible: boolean; equipoId: string }>({
    visible: false, equipoId: '',
  })
  const [modalAgregarEquipo, setModalAgregarEquipo] = useState(false)
  const [modalRenombrar, setModalRenombrar] = useState<{ visible: boolean; equipoId: string; nombre: string }>({
    visible: false, equipoId: '', nombre: '',
  })
  const [modalResultado, setModalResultado] = useState<{ visible: boolean; partidoId: string }>({
    visible: false, partidoId: '',
  })

  // Configurar header dinámicamente con el nombre del torneo
  useLayoutEffect(() => {
    if (!torneo) return
    navigation.setOptions({
      title: torneo.nombre,
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, marginRight: 4 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/torneo/crear',
                params: {
                  torneoId: torneo.id,
                  nombreInicial: torneo.nombre,
                  deporteInicial: torneo.deporte,
                },
              })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.headerBtn}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDialogEliminarTorneo(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.headerBtn}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ),
    })
  }, [torneo, navigation])

  // Guard: torneo eliminado o id inválido
  if (!torneo) {
    router.replace('/')
    return null
  }

  const fixtureGenerado = torneo.partidos.length > 0
  const puedeGenerarFixture = !fixtureGenerado && torneo.equipos.length >= 2

  // Partido activo en modal resultado
  const partidoActivo = torneo.partidos.find((p) => p.id === modalResultado.partidoId) ?? null

  // ── Acciones ────────────────────────────────────────────────────────────────

  function eliminarTorneo() {
    dispatch({ type: 'ELIMINAR_TORNEO', payload: torneo!.id })
    router.replace('/')
  }

  function agregarEquipo(nombre: string) {
    dispatch({ type: 'AGREGAR_EQUIPO', payload: { torneoId: torneo!.id, nombre } })
    setModalAgregarEquipo(false)
  }

  function renombrarEquipo(nombre: string) {
    dispatch({
      type: 'EDITAR_EQUIPO',
      payload: { torneoId: torneo!.id, equipoId: modalRenombrar.equipoId, nombre },
    })
    setModalRenombrar({ visible: false, equipoId: '', nombre: '' })
  }

  function eliminarEquipo() {
    dispatch({
      type: 'ELIMINAR_EQUIPO',
      payload: { torneoId: torneo!.id, equipoId: dialogEliminarEquipo.equipoId },
    })
    setDialogEliminarEquipo({ visible: false, equipoId: '' })
  }

  function generarFixture() {
    if (torneo!.equipos.length < 2) {
      Alert.alert('Faltan equipos', 'Necesitás al menos 2 equipos para generar el fixture.')
      return
    }
    dispatch({ type: 'GENERAR_FIXTURE', payload: { torneoId: torneo!.id } })
  }

  function cargarResultado(gl: number, gv: number) {
    dispatch({
      type: 'CARGAR_RESULTADO',
      payload: { torneoId: torneo!.id, partidoId: modalResultado.partidoId, golesLocal: gl, golesVisitante: gv },
    })
    setModalResultado({ visible: false, partidoId: '' })
  }

  // ── Render de contenido por tab ─────────────────────────────────────────────

  function renderTabla() {
    const hayJugados = torneo!.partidos.some((p) => p.estado === 'jugado')
    return (
      <FlatList<FilaTabla>
        data={torneo!.tabla}
        keyExtractor={(item) => item.equipo.id}
        renderItem={({ item, index }) => (
          <TablaRow
            fila={item}
            posicion={index + 1}
            isFirst={index === 0}
            isEven={index % 2 === 0}
          />
        )}
        ListHeaderComponent={
          <>
            {!hayJugados && (
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerInfoTexto}>
                  Todavía no hay partidos jugados. ¡Cargá el primer resultado!
                </Text>
              </View>
            )}
            <CabeceraTabla />
          </>
        }
        ListFooterComponent={
          <Text style={styles.leyenda}>
            PJ: Jugados · PG: Ganados · PE: Empatados · PP: Perdidos
          </Text>
        }
        ListEmptyComponent={<EmptyState variante="fixture" />}
        contentContainerStyle={torneo!.tabla.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    )
  }

  function renderFixture() {
    if (!fixtureGenerado) {
      return (
        <ScrollView contentContainerStyle={styles.fixtureVacioContenedor}>
          <EmptyState variante="fixture" />
          {puedeGenerarFixture && (
            <TouchableOpacity style={styles.botonGenerarFixture} onPress={generarFixture} activeOpacity={0.8}>
              <Text style={styles.botonGenerarFixtureTexto}>Generar fixture</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )
    }

    // Agrupar partidos por jornada
    const jornadas = torneo!.partidos.reduce<Record<number, typeof torneo.partidos>>((acc, p) => {
      if (!acc[p.jornada]) acc[p.jornada] = []
      acc[p.jornada].push(p)
      return acc
    }, {})

    return (
      <FlatList
        data={Object.entries(jornadas).map(([j, ps]) => ({ jornada: Number(j), partidos: ps }))}
        keyExtractor={(item) => `j-${item.jornada}`}
        renderItem={({ item }) => (
          <View>
            <Text style={styles.jornadaHeader}>Jornada {item.jornada}</Text>
            {item.partidos.map((p) => (
              <PartidoCard
                key={p.id}
                partido={p}
                onCargarResultado={(id) => setModalResultado({ visible: true, partidoId: id })}
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.fixtureLista}
        showsVerticalScrollIndicator={false}
      />
    )
  }

  function renderEquipos() {
    return (
      <View style={styles.flex}>
        {torneo!.equipos.length === 0 ? (
          <EmptyState variante="equipos" />
        ) : (
          <FlatList
            data={torneo!.equipos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EquipoRow
                equipo={item}
                fixtureGenerado={fixtureGenerado}
                onVerJugadores={() =>
                  router.push(`/torneo/${torneo!.id}/equipo/${item.id}`)
                }
                onRenombrar={() =>
                  setModalRenombrar({ visible: true, equipoId: item.id, nombre: item.nombre })
                }
                onEliminar={() =>
                  setDialogEliminarEquipo({ visible: true, equipoId: item.id })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB solo si el fixture no fue generado aún (RN-03) */}
        {!fixtureGenerado && (
          <FAB onPress={() => setModalAgregarEquipo(true)} label="Agregar equipo" />
        )}
      </View>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.contenedor}>
      {/* Banner de conexión EN VIVO / Reconectando / Sin conexión (RF-08) */}
      <ConexionBanner estado={conexion} />

      {/* Selector de pestañas internas */}
      <TabsInternos activa={tabActiva} onChange={setTabActiva} />

      {/* Contenido de la pestaña activa */}
      <View style={styles.flex}>
        {tabActiva === 'tabla'   && renderTabla()}
        {tabActiva === 'fixture' && renderFixture()}
        {tabActiva === 'equipos' && renderEquipos()}
      </View>

      {/* ── Modales ────────────────────────────────────────────────────────── */}

      {/* Confirmar eliminar torneo */}
      <ConfirmDialog
        visible={dialogEliminarTorneo}
        titulo="Eliminar torneo"
        mensaje={`¿Seguro que querés eliminar "${torneo.nombre}"? Se eliminarán todos los equipos y partidos.`}
        onConfirmar={eliminarTorneo}
        onCancelar={() => setDialogEliminarTorneo(false)}
      />

      {/* Confirmar eliminar equipo */}
      <ConfirmDialog
        visible={dialogEliminarEquipo.visible}
        titulo="Eliminar equipo"
        mensaje="¿Seguro que querés eliminar este equipo del torneo?"
        onConfirmar={eliminarEquipo}
        onCancelar={() => setDialogEliminarEquipo({ visible: false, equipoId: '' })}
      />

      {/* Agregar equipo */}
      <ModalTexto
        visible={modalAgregarEquipo}
        titulo="Agregar equipo"
        placeholder="Nombre del equipo"
        labelConfirmar="Agregar"
        onConfirmar={agregarEquipo}
        onCancelar={() => setModalAgregarEquipo(false)}
      />

      {/* Renombrar equipo */}
      <ModalTexto
        visible={modalRenombrar.visible}
        titulo="Renombrar equipo"
        placeholder="Nuevo nombre"
        valorInicial={modalRenombrar.nombre}
        labelConfirmar="Guardar"
        onConfirmar={renombrarEquipo}
        onCancelar={() => setModalRenombrar({ visible: false, equipoId: '', nombre: '' })}
      />

      {/* Cargar resultado */}
      {partidoActivo && (
        <ModalResultado
          visible={modalResultado.visible}
          localNombre={partidoActivo.local.nombre}
          visitanteNombre={partidoActivo.visitante.nombre}
          onConfirmar={cargarResultado}
          onCancelar={() => setModalResultado({ visible: false, partidoId: '' })}
        />
      )}
    </View>
  )
}

// ── Estilos ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  headerBtn: {
    fontSize: 18,
  },

  // ── Tabla ──────────────────────────────────────────────────────────────────
  cabeceraTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cabeceraCol: {
    width: 28,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    margin: 12,
    padding: 12,
    borderRadius: 10,
  },
  bannerInfoTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  leyenda: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // ── Fixture ────────────────────────────────────────────────────────────────
  fixtureVacioContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fixtureLista: {
    padding: 12,
    paddingBottom: 24,
  },
  jornadaHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  botonGenerarFixture: {
    marginTop: 20,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  botonGenerarFixtureTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Modal texto (agregar / renombrar) ──────────────────────────────────────
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCaja: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalBoton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
  },
  modalBotonCancelar: {
    backgroundColor: colors.pendingBg,
  },
  modalBotonConfirmar: {
    backgroundColor: colors.primaryDark,
  },
  modalBotonCancelarTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalBotonConfirmarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Modal resultado ────────────────────────────────────────────────────────
  resultadoOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  resultadoModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  resultadoHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  resultadoTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultadoSubtitulo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultadoInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  resultadoInputGrupo: {
    alignItems: 'center',
    flex: 1,
  },
  resultadoInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  resultadoInput: {
    width: '100%',
    height: 72,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.background,
    textAlign: 'center',
  },
  resultadoSeparador: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textSecondary,
    paddingBottom: 16,
  },
  resultadoError: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  resultadoBoton: {
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
  resultadoBotonTexto: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  resultadoCancelar: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
})
