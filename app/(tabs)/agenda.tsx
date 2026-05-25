import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelarAgendamento, getAllAgendamentos, type AgendamentoComCliente } from '../../db/queries';
import { C } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

type Row =
  | { kind: 'header'; id: string; label: string; atrasado: boolean }
  | { kind: 'item'; id: string; ag: AgendamentoComCliente; atrasado: boolean };

function getDayLabel(data: string): string {
  const hojeStr = new Date().toISOString().split('T')[0];
  const amanhaDate = new Date();
  amanhaDate.setDate(amanhaDate.getDate() + 1);
  const amanhaStr = amanhaDate.toISOString().split('T')[0];

  if (data === hojeStr) return 'Hoje';
  if (data === amanhaStr) return 'Amanhã';

  const [y, m, d] = data.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function buildRows(lista: AgendamentoComCliente[]): Row[] {
  const hojeStr = new Date().toISOString().split('T')[0];
  const rows: Row[] = [];
  let lastDay = '';

  for (const ag of lista) {
    const atrasado = ag.data < hojeStr;
    if (ag.data !== lastDay) {
      const label = atrasado ? 'Atrasados' : getDayLabel(ag.data);
      if (lastDay === '' || label !== getDayLabel(lastDay)) {
        rows.push({ kind: 'header', id: `h-${ag.data}`, label, atrasado });
      }
      lastDay = ag.data;
    }
    rows.push({ kind: 'item', id: ag.id, ag, atrasado });
  }
  return rows;
}

export default function Agenda() {
  const { usuario } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  function carregar() {
    if (!usuario) return;
    setRows(buildRows(getAllAgendamentos(usuario.id)));
  }

  useFocusEffect(useCallback(() => { carregar(); }, []));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Agenda</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <Text style={[styles.secao, item.atrasado && styles.secaoVermelho]}>
                {item.label}
              </Text>
            );
          }

          const { ag, atrasado } = item;
          return (
            <View style={[styles.item, atrasado && styles.itemAtrasado]}>
              <View style={[styles.bordaEsq, atrasado ? styles.bordaVermelho : styles.bordaVerde]} />
              <View style={styles.itemBody}>
                <Text style={[styles.itemHora, atrasado && styles.itemHoraVermelho]}>{ag.hora}</Text>
                <Text style={styles.itemNome}>{ag.cliente.nome}</Text>
                <Text style={styles.itemDesc}>{ag.descricao}</Text>
              </View>
              <View style={styles.itemAcoes}>
                <Pressable
                  style={styles.btnConcluir}
                  onPress={() =>
                    router.push({
                      pathname: '/novo-servico',
                      params: { clienteId: ag.cliente_id, agendamentoId: ag.id },
                    })
                  }
                >
                  <Text style={styles.btnConcluirTexto}>Agendar</Text>
                </Pressable>
                <Pressable
                  style={styles.btnCancelar}
                  onPress={() => { cancelarAgendamento(ag.id); carregar(); }}
                >
                  <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons name="calendar-outline" size={48} color={C.textMuted} style={styles.vazioIcone} />
            <Text style={styles.vazioTexto}>Nenhum agendamento</Text>
            <Text style={styles.vazioSub}>Toque em + para agendar um serviço</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/novo-agendamento')}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  list: { paddingBottom: 100 },
  secao: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  secaoVermelho: { color: C.red },
  item: {
    flexDirection: 'row',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 8,
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
  itemAtrasado: { borderColor: C.redMid },
  bordaEsq: { width: 4 },
  bordaVerde: { backgroundColor: C.green },
  bordaVermelho: { backgroundColor: C.red },
  itemBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  itemHora: { fontSize: 13, fontWeight: '700', color: C.green, marginBottom: 2 },
  itemHoraVermelho: { color: C.red },
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
  vazio: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  vazioIcone: { marginBottom: 16 },
  vazioTexto: { fontSize: 18, fontWeight: '600', color: C.textMuted },
  vazioSub: { fontSize: 14, color: '#d1d5db', marginTop: 6, textAlign: 'center' },
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
