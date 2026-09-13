import { StyleSheet } from 'react-native';
import { space, radius, font } from './theme';

// makeStyles(colors) — chame com as cores do tema atual: const s = makeStyles(colors)
export default function makeStyles(c) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    body: { paddingHorizontal: 20 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg },

    kicker: { fontSize: 11, letterSpacing: 2.6, color: c.textMuted, fontWeight: '500' },
    display: { fontFamily: font.display, fontSize: 34, lineHeight: 38, color: c.textPrimary },
    title: { fontFamily: font.display, fontSize: 28, lineHeight: 32, color: c.textPrimary },
    subheading: { fontFamily: font.display, fontSize: 22, color: c.textPrimary },
    body14: { fontSize: 14, lineHeight: 22, color: c.textSecondary },
    body12: { fontSize: 12, lineHeight: 18, color: c.textSecondary },
    mono: { fontSize: 12, color: c.textMuted, fontVariant: ['tabular-nums'] },
    label: { fontSize: 11, letterSpacing: 1.6, color: c.textMuted, fontWeight: '500' },

    card: { backgroundColor: c.card, borderColor: c.border, borderWidth: 1,
      borderRadius: radius.md, padding: 14 },
    cardAlarm: { backgroundColor: c.flameBg, borderColor: c.flame, borderWidth: 1.5,
      borderRadius: radius.md, padding: 14 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    divider: { height: 1, backgroundColor: c.border, marginVertical: space.md },
    listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: c.border },

    chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border },
    chipActive: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: radius.pill,
      backgroundColor: c.ink },
    chipText: { fontSize: 12, color: c.textSecondary, fontWeight: '500' },
    chipTextActive: { fontSize: 12, color: c.inkText, fontWeight: '600' },

    inputGroup: { marginBottom: space.sm },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card,
      borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: 14 },
    inputRowFocused: { borderColor: c.flame },
    input: { flex: 1, height: 46, fontSize: 15, color: c.textPrimary },

    btnPrimary: { minHeight: 52, borderRadius: radius.sm, backgroundColor: c.ink,
      alignItems: 'center', justifyContent: 'center' },
    btnPrimaryText: { color: c.inkText, fontSize: 14.5, fontWeight: '600' },
    btnGhost: { minHeight: 52, borderRadius: radius.sm, backgroundColor: c.card,
      borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    btnGhostText: { color: c.textPrimary, fontSize: 14.5, fontWeight: '600' },
    btnDanger: { minHeight: 48, borderRadius: radius.sm, backgroundColor: c.flameBg,
      borderWidth: 1, borderColor: c.flameBorder, alignItems: 'center', justifyContent: 'center' },
    btnDangerText: { color: c.flame, fontSize: 13, fontWeight: '600' },

    dot: { width: 8, height: 8, borderRadius: 4 },
    iconBtn: { width: 44, height: 44, borderRadius: 11, backgroundColor: c.card,
      borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingTop: 14 },
    fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.ink,
      alignItems: 'center', justifyContent: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalSheet: { width: '100%', backgroundColor: c.card, borderRadius: radius.lg,
      padding: 20, borderWidth: 1, borderColor: c.border },
  });
}
