import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { cancelarAgendamento, getAllAgendamentos, type AgendamentoComCliente } from '../../db/queries';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_SIZE = Math.floor((SCREEN_WIDTH - 28) / 7);

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Agenda() {
  const { usuario } = useAuth();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [allAgendamentos, setAllAgendamentos] = useState<AgendamentoComCliente[]>([]);

  function carregar() {
    if (!usuario) return;
    setAllAgendamentos(getAllAgendamentos(usuario.id));
  }

  useFocusEffect(useCallback(() => { carregar(); }, [usuario]));

  const markedDays = useMemo(() => {
    const set = new Set<string>();
    for (const ag of allAgendamentos) set.add(ag.data);
    return set;
  }, [allAgendamentos]);

  const selectedAgendamentos = useMemo(
    () => allAgendamentos.filter((ag) => ag.data === selectedDate),
    [allAgendamentos, selectedDate]
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayPress(day: number) {
    setSelectedDate(toDateStr(viewYear, viewMonth, day));
  }

  const selectedLabel = (() => {
    if (selectedDate === todayStr) return 'Hoje';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  })();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.titulo}>Agenda</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Calendário */}
        <View style={s.calCard}>
          {/* Navegação de mês */}
          <View style={s.navRow}>
            <Pressable style={s.navBtn} onPress={prevMonth} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={C.textPrimary} />
            </Pressable>
            <Text style={s.navLabel}>
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </Text>
            <Pressable style={s.navBtn} onPress={nextMonth} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={C.textPrimary} />
            </Pressable>
          </View>

          {/* Cabeçalho dos dias da semana */}
          <View style={s.weekRow}>
            {WEEK_DAYS.map((d) => (
              <View key={d} style={s.weekCell}>
                <Text style={s.weekLabel}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid de dias */}
          <View style={s.daysGrid}>
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={s.dayCell} />;
              }
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasEvent = markedDays.has(dateStr);
              const isPast = dateStr < todayStr;

              return (
                <Pressable
                  key={dateStr}
                  style={s.dayCell}
                  onPress={() => handleDayPress(day)}
                >
                  <View style={[
                    s.dayInner,
                    isSelected && s.daySelected,
                    isToday && !isSelected && s.dayToday,
                  ]}>
                    <Text style={[
                      s.dayText,
                      isSelected && s.dayTextSelected,
                      isToday && !isSelected && s.dayTextToday,
                      isPast && !isSelected && !isToday && s.dayTextPast,
                    ]}>
                      {day}
                    </Text>
                    {hasEvent && (
                      <View style={[s.dot, isSelected && s.dotSelected]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Lista de agendamentos do dia */}
        <View style={s.listSection}>
          <Text style={s.listLabel}>
            {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}
          </Text>

          {selectedAgendamentos.length === 0 ? (
            <View style={s.vazio}>
              <Ionicons name="calendar-outline" size={40} color={C.textMuted} />
              <Text style={s.vazioTexto}>Nenhum agendamento</Text>
            </View>
          ) : (
            selectedAgendamentos.map((ag, i) => (
              <View key={ag.id} style={[s.item, i > 0 && { marginTop: 8 }]}>
                <View style={s.bordaEsq} />
                <View style={s.itemBody}>
                  <Text style={s.itemHora}>{ag.hora}</Text>
                  <Text style={s.itemNome}>{ag.cliente.nome}</Text>
                  {ag.descricao ? <Text style={s.itemDesc}>{ag.descricao}</Text> : null}
                </View>
                <View style={s.itemAcoes}>
                  <Pressable
                    style={s.btnConcluir}
                    onPress={() =>
                      router.push({
                        pathname: '/novo-servico',
                        params: { clienteId: ag.cliente_id, agendamentoId: ag.id },
                      })
                    }
                  >
                    <Text style={s.btnConcluirTexto}>Iniciar</Text>
                  </Pressable>
                  <Pressable
                    style={s.btnCancelar}
                    onPress={() => { cancelarAgendamento(ag.id); carregar(); }}
                  >
                    <Text style={s.btnCancelarTexto}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Pressable style={s.fab} onPress={() => router.push('/novo-agendamento')}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titulo: { fontSize: 28, fontWeight: '700', color: C.textPrimary },
  scroll: { paddingBottom: 110 },

  // Calendário
  calCard: {
    backgroundColor: C.white,
    margin: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { fontSize: 16, fontWeight: '700', color: C.textPrimary },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekCell: { width: DAY_SIZE, alignItems: 'center', paddingVertical: 4 },
  weekLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase' },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: DAY_SIZE, alignItems: 'center', paddingVertical: 3 },
  dayInner: {
    width: DAY_SIZE - 6,
    height: DAY_SIZE - 6,
    borderRadius: (DAY_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: C.green },
  dayToday: { backgroundColor: C.greenLight },
  dayText: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  dayTextSelected: { color: C.white, fontWeight: '700' },
  dayTextToday: { color: C.green, fontWeight: '700' },
  dayTextPast: { color: C.textMuted },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.green,
    marginTop: 2,
  },
  dotSelected: { backgroundColor: C.white },

  // Lista do dia selecionado
  listSection: { paddingHorizontal: 14 },
  listLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  item: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bordaEsq: { width: 4, backgroundColor: C.green },
  itemBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  itemHora: { fontSize: 13, fontWeight: '700', color: C.green, marginBottom: 2 },
  itemNome: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  itemDesc: { fontSize: 14, color: C.textSecondary, marginTop: 2 },
  itemAcoes: { justifyContent: 'center', gap: 8, paddingRight: 12, paddingVertical: 12 },
  btnConcluir: {
    backgroundColor: C.green,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnConcluirTexto: { fontSize: 13, fontWeight: '700', color: C.white },
  btnCancelar: {
    backgroundColor: C.redLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnCancelarTexto: { fontSize: 13, fontWeight: '700', color: C.red },

  vazio: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  vazioTexto: { fontSize: 15, color: C.textMuted },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
});
