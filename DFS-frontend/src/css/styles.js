import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg:          '#FAFAF8',   // warm off-white
  bgCard:      '#FFFFFF',
  bgMuted:     '#F2F1EE',
  bgOverlay:   'rgba(20, 18, 14, 0.55)',

  // Borders
  border:      '#E8E6E1',
  borderStrong:'#D0CEC8',

  // Text
  textPrimary:  '#1A1917',
  textSecondary:'#6B6860',
  textMuted:    '#A09E98',
  textOnDark:   '#FAFAF8',

  // Accent — fire/warmth
  flame:        '#E5421A',   // sensor de chama
  flameLight:   '#FEF0EC',
  flameBorder:  '#F4B8A8',

  // Accent — gas/cool
  gas:          '#2563EB',   // sensor de gás
  gasLight:     '#EEF3FD',
  gasBorder:    '#BFCFF7',

  // Neutral accent
  accent:       '#1A1917',
};

export const font = {
  // Serif for headings — warm, human
  heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  // System sans for UI
  body:    Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };
export const space   = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36, xxl: 52 };

// ─── Styles ───────────────────────────────────────────────────────────────────

const Styles = StyleSheet.create({

  // ── Screens ─────────────────────────────────────────────────────────────────

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  scrollBody: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  centeredScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },

  overlay: {
    flex: 1,
    backgroundColor: colors.bgOverlay,
    justifyContent: 'flex-end',   // bottom sheet feel
    paddingHorizontal: 0,
  },

  // ── Sheets / Cards ──────────────────────────────────────────────────────────

  // Bottom sheet (modal)
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl,
    // drag handle
    borderTopWidth: 0,
  },

  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: space.lg,
  },

  // Centered auth card
  authCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    width: '100%',
    maxWidth: 380,
  },

  // Info card (home, about)
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
  },

  // ── Sensor card ─────────────────────────────────────────────────────────────

  sensorCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    margin: space.xs,
    minHeight: 120,
    justifyContent: 'space-between',
  },

  sensorCardActive: {
    backgroundColor: '#FFFCFB',
    borderColor: colors.flameBorder,
  },

  // ── Typography ──────────────────────────────────────────────────────────────

  // Page-level heading (serif)
  heading: {
    fontFamily: font.heading,
    fontSize: 28,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 36,
    marginBottom: space.sm,
  },

  // Card / section heading
  subheading: {
    fontFamily: font.heading,
    fontSize: 20,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 28,
  },

  // Small room name in sensor card
  sensorName: {
    fontFamily: font.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },

  // Body paragraph
  body: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Small label / caption
  label: {
    fontFamily: font.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 4,
  },

  // ── Inputs ──────────────────────────────────────────────────────────────────

  inputGroup: {
    marginBottom: space.md,
  },

  input: {
    height: 44,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    color: colors.textPrimary,
    fontFamily: font.body,
    fontSize: 15,
  },

  inputFocused: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.bgCard,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
  },

  inputRowFocused: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.bgCard,
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────

  // Dark filled CTA
  btnPrimary: {
    height: 48,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.sm,
  },

  btnPrimaryText: {
    fontFamily: font.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnDark,
    letterSpacing: 0.2,
  },

  btnPrimaryDisabled: {
    opacity: 0.3,
  },

  // Ghost
  btnGhost: {
    height: 44,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.xs,
  },

  btnGhostText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Outline
  btnOutline: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: space.xs,
  },

  btnOutlineText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // Danger outline
  btnDanger: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.flame,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnDangerText: {
    fontFamily: font.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.flame,
  },

  // ── Sensor symbols ─────────────────────────────────────────────────────────
  // Containers for the SVG/animated sensor icons

  sensorSymbolRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },

  // Flame symbol pill
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.flameLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.flameBorder,
    alignSelf: 'flex-start',
  },

  flamePillText: {
    fontFamily: font.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.flame,
  },

  // Gas symbol pill
  gasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.gasLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gasBorder,
    alignSelf: 'flex-start',
  },

  gasPillText: {
    fontFamily: font.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.gas,
  },

  // ── Toggle row (sensor switch) ──────────────────────────────────────────────

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },

  toggleLabelText: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.textPrimary,
  },

  toggleIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Misc ────────────────────────────────────────────────────────────────────

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Profile row
  profileRow: {
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  profileRowLabel: {
    fontFamily: font.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  profileRowValue: {
    fontFamily: font.body,
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    gap: space.md,
  },

  emptyStateText: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Dev card (about page)
  devCard: {
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  devName: {
    fontFamily: font.heading,
    fontSize: 16,
    fontWeight: '400',
    color: colors.textPrimary,
  },

  devRole: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: space.xl,
    right: space.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  // Link text
  linkText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    textDecorationColor: colors.border,
  },

  linkTextAccent: {
    color: colors.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'none',
  },

});

export default Styles;