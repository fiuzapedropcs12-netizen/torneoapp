export const colors = {
  // ── Marca ────────────────────────────────────────────────────────────────────
  primary: '#1A56A0',       // Azul header (igual a E1, reutilizado)
  primaryDark: '#1B3A6B',   // Azul oscuro — FAB, botones primarios E2
  primaryLight: '#EFF6FF',  // Fondo de acento suave

  // ── Superficies ───────────────────────────────────────────────────────────────
  background: '#F2F4F7',    // Fondo general (actualizado en E2)
  surface: '#FFFFFF',       // Cards, modales
  border: '#E5E7EB',

  // ── Texto ─────────────────────────────────────────────────────────────────────
  textPrimary: '#222222',
  textSecondary: '#888888',

  // ── Estados ───────────────────────────────────────────────────────────────────
  error: '#EF4444',

  // ── Conexión / EN VIVO ────────────────────────────────────────────────────────
  enVivoBg: '#D1FAE5',       // Verde claro — badge EN VIVO
  enVivoText: '#065F46',     // Verde oscuro — texto EN VIVO
  enVivoDot: '#059669',      // Punto verde animado

  warningBg: '#FEF3C7',      // Amarillo claro — banner Reconectando
  warningText: '#92400E',    // Naranja oscuro — texto Reconectando

  errorBg: '#FEE2E2',        // Rojo claro — banner Sin conexión
  errorText: '#991B1B',      // Rojo oscuro — texto Sin conexión

  // ── Tabla (heredados de E1) ────────────────────────────────────────────────
  successBg: '#D1FAE5',
  successText: '#065F46',
  pendingBg: '#F3F4F6',
  pendingText: '#374151',
  difPositiva: '#16A34A',
  difNegativa: '#DC2626',
  difNeutral: '#6B7280',

  // ── Acciones destructivas ─────────────────────────────────────────────────
  danger: '#DC2626',         // Rojo — botón Eliminar

  // ── Skeleton / loading ────────────────────────────────────────────────────
  skeleton: '#E5E7EB',
} as const
