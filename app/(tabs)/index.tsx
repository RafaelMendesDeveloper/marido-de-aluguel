import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditarServicoModal from '../../components/EditarServicoModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMonthSummary,
  getTodayAgendamentos,
  getTodayServicos,
  type AgendamentoComCliente,
  type ServicoComCliente,
} from '../../db/queries';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function inicial(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

export default function Inicio() {
  const { usuario } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoComCliente[]>([]);
  const [servicos, setServicos] = useState<ServicoComCliente[]>([]);
  const [resumo, setResumo] = useState({ recebidoHoje: 0, pendenteHoje: 0, recebidoMes: 0 });
  const [modalVisivel, setModalVisivel] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoComCliente | null>(null);

  function carregarDados() {
    if (!usuario) return;
    const ags = getTodayAgendamentos(usuario.id);
    const svcs = getTodayServicos(usuario.id);
    const mes = getMonthSummary(usuario.id);
    const recebidoHoje = svcs.filter((s) => s.pago === 1).reduce((a, s) => a + (s.valor ?? 0), 0);
    const pendenteHoje = svcs.filter((s) => s.pago === 0).reduce((a, s) => a + (s.valor ?? 0), 0);
    setAgendamentos(ags);
    setServicos(svcs);
    setResumo({ recebidoHoje, pendenteHoje, recebidoMes: mes.totalRecebido });
  }

  useFocusEffect(useCallback(() => { carregarDados(); }, []));

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho */}
        <View style={s.header}>
          <View>
            <Text style={s.saudacao}>Olá, {usuario?.nome.split(' ')[0] ?? ''} 👋</Text>
            <Text style={s.data}>{dataHoje.charAt(0).toUpperCase() + dataHoje.slice(1)}</Text>
          </View>
          <View style={s.sinoBotao}>
            <Ionicons name="notifications-outline" size={20} color="#3a3a3c" />
          </View>
        </View>

        {/* Grid de resumo */}
        <View style={s.grid}>
          <View style={[s.gridCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={[s.gridLabel, { color: '#15803d' }]}>RECEBIDO HOJE</Text>
            <Text style={[s.gridValor, { color: '#166534' }]}>{fmt(resumo.recebidoHoje)}</Text>
          </View>
          <View style={[s.gridCard, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
            <Text style={[s.gridLabel, { color: '#be123c' }]}>PENDENTE</Text>
            <Text style={[s.gridValor, { color: '#9f1239' }]}>{fmt(resumo.pendenteHoje)}</Text>
          </View>
          <View style={[s.gridCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[s.gridLabel, { color: '#1d4ed8' }]}>NO MÊS</Text>
            <Text style={[s.gridValor, { color: '#1e40af' }]}>{fmt(resumo.recebidoMes)}</Text>
          </View>
          <View style={[s.gridCard, { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }]}>
            <Text style={[s.gridLabel, { color: '#6b7280' }]}>SERVIÇOS HOJE</Text>
            <Text style={[s.gridValor, { color: '#111827' }]}>{servicos.length}</Text>
          </View>
        </View>

        {/* Card Agenda */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardLabel}>AGENDA DE HOJE</Text>
            <Pressable onPress={() => router.push('/(tabs)/agenda')}>
              <Text style={s.cardLink}>Ver tudo</Text>
            </Pressable>
          </View>
          {agendamentos.length === 0 ? (
            <View style={s.emptyRow}>
              <Text style={s.emptyTexto}>Nenhum agendamento para hoje</Text>
            </View>
          ) : (
            agendamentos.map((ag, i) => {
              const [hora, min] = ag.hora ? ag.hora.split(':') : ['', ''];
              return (
                <View key={ag.id}>
                  {i > 0 && <View style={s.separator} />}
                  <Pressable
                    style={s.agRow}
                    onPress={() =>
                      router.push({
                        pathname: '/novo-servico',
                        params: { clienteId: ag.cliente_id, agendamentoId: ag.id },
                      })
                    }
                  >
                    <View style={s.horaPill}>
                      <Text style={s.horaH}>{hora}</Text>
                      <Text style={s.horaM}>{min}</Text>
                    </View>
                    <View style={s.agTextos}>
                      <Text style={s.agNome}>{ag.cliente.nome}</Text>
                      {ag.descricao ? <Text style={s.agDesc}>{ag.descricao}</Text> : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        {/* Card Serviços de hoje */}
        <View style={[s.card, { marginBottom: 110 }]}>
          <View style={s.cardHeader}>
            <Text style={s.cardLabel}>SERVIÇOS DE HOJE</Text>
            <Pressable onPress={() => router.push('/(tabs)/historico')}>
              <Text style={s.cardLink}>Ver histórico</Text>
            </Pressable>
          </View>
          {servicos.length === 0 ? (
            <View style={s.emptyRow}>
              <Text style={s.emptyTexto}>Nenhum serviço registrado hoje</Text>
            </View>
          ) : (
            servicos.map((sv, i) => {
              const pago = sv.pago === 1;
              return (
                <View key={sv.id}>
                  {i > 0 && <View style={s.separator} />}
                  <Pressable
                    style={s.svcRow}
                    onPress={() => { setServicoSelecionado(sv); setModalVisivel(true); }}
                  >
                    <View style={[s.avatar, pago ? s.avatarVerde : s.avatarVermelho]}>
                      <Text style={[s.avatarLetra, pago ? s.avatarLetraVerde : s.avatarLetraVermelha]}>
                        {inicial(sv.cliente.nome)}
                      </Text>
                    </View>
                    <View style={s.svcTextos}>
                      <Text style={s.svcNome} numberOfLines={1}>{sv.cliente.nome}</Text>
                      {sv.observacao ? (
                        <Text style={s.svcObs} numberOfLines={1}>{sv.observacao}</Text>
                      ) : null}
                    </View>
                    <View style={s.svcDireita}>
                      <Text style={[s.svcValor, { color: pago ? '#16a34a' : '#dc2626' }]}>
                        {fmt(sv.valor ?? 0)}
                      </Text>
                      <View style={[s.badge, pago ? s.badgeVerde : s.badgeVermelho]}>
                        <Text style={[s.badgeTexto, pago ? s.badgeTextoVerde : s.badgeTextoVermelho]}>
                          {pago ? 'Pago' : 'Pendente'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* FAB */}
      <Pressable style={s.fab} onPress={() => router.push('/novo-servico')}>
        <Text style={s.fabTexto}>+</Text>
      </Pressable>

      <EditarServicoModal
        visivel={modalVisivel}
        servico={servicoSelecionado}
        onFechar={() => { setModalVisivel(false); setServicoSelecionado(null); }}
        onSalvar={() => { setModalVisivel(false); setServicoSelecionado(null); carregarDados(); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  saudacao: { fontSize: 28, fontWeight: '800', color: '#1c1c1e', letterSpacing: -1, lineHeight: 30 },
  data: { fontSize: 13, color: '#8e8e93', marginTop: 3, fontWeight: '400' },
  sinoBotao: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f2f2f7',
    borderWidth: 0.5, borderColor: '#e5e5ea',
    alignItems: 'center', justifyContent: 'center',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  gridValor: { fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },

  // Card genérico
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 14,
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#9ca3af',
    letterSpacing: 0.8,
  },
  cardLink: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  separator: { height: 0.5, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  emptyRow: { paddingHorizontal: 16, paddingVertical: 18, alignItems: 'center' },
  emptyTexto: { fontSize: 15, color: '#8e8e93' },

  // Agendamentos
  agRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  horaPill: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 46,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  horaH: { fontSize: 15, fontWeight: '800', color: '#166534', lineHeight: 18 },
  horaM: { fontSize: 10, fontWeight: '600', color: '#16a34a', lineHeight: 14 },
  agTextos: { flex: 1 },
  agNome: { fontSize: 15, fontWeight: '600', color: '#111' },
  agDesc: { fontSize: 12, color: '#8e8e93', marginTop: 2 },

  // Serviços
  svcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarVerde: { backgroundColor: '#dcfce7' },
  avatarVermelho: { backgroundColor: '#ffe4e6' },
  avatarLetra: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  avatarLetraVerde: { color: '#166534' },
  avatarLetraVermelha: { color: '#be123c' },
  svcTextos: { flex: 1 },
  svcNome: { fontSize: 15, fontWeight: '600', color: '#111' },
  svcObs: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
  svcDireita: { alignItems: 'flex-end', gap: 4 },
  svcValor: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  badgeVerde: { backgroundColor: '#dcfce7' },
  badgeVermelho: { backgroundColor: '#ffe4e6' },
  badgeTexto: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  badgeTextoVerde: { color: '#166534' },
  badgeTextoVermelho: { color: '#be123c' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  fabTexto: { fontSize: 30, fontWeight: '200', color: '#fff', lineHeight: 36 },
});
