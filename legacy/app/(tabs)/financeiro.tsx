import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditarServicoModal from '../../components/EditarServicoModal';
import { C } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  getServicosDoAno,
  getServicosDoMes,
  getTopClientesDoPeriodo,
  limparTudo,
  ServicoComCliente,
} from '../../db/queries';

type Modo = 'mes' | 'ano';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtCompacto(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

function formatDataCurta(data: string): string {
  const [, m, d] = data.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function calcularSemanas(itens: ServicoComCliente[]) {
  const semanas = [
    { label: 'S1', total: 0 },
    { label: 'S2', total: 0 },
    { label: 'S3', total: 0 },
    { label: 'S4', total: 0 },
  ];
  for (const s of itens) {
    if (s.pago !== 1) continue;
    const dia = parseInt(s.data.split('-')[2], 10);
    const idx = dia <= 7 ? 0 : dia <= 14 ? 1 : dia <= 21 ? 2 : 3;
    semanas[idx].total += s.valor ?? 0;
  }
  return semanas;
}

function calcularMeses(itens: ServicoComCliente[]) {
  const meses = MESES_CURTO.map((label, i) => ({ label, total: 0, mes: i + 1 }));
  for (const s of itens) {
    if (s.pago !== 1) continue;
    const mes = parseInt(s.data.split('-')[1], 10);
    meses[mes - 1].total += s.valor ?? 0;
  }
  return meses;
}

function GraficoBarras({ barras }: { barras: { label: string; total: number }[] }) {
  const alturaMaxima = 110;
  const maxValor = Math.max(...barras.map((b) => b.total), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, paddingHorizontal: 4, gap: 4 }}>
      {barras.map((b, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text
            style={{ fontSize: 10, color: C.textDark, textAlign: 'center' }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {b.total > 0 ? fmtCompacto(b.total) : ''}
          </Text>
          <View
            style={{
              width: '65%',
              height: Math.max((b.total / maxValor) * alturaMaxima, b.total > 0 ? 4 : 2),
              backgroundColor: b.total > 0 ? C.green : C.borderLight,
              borderRadius: 6,
            }}
          />
          <Text style={{ fontSize: 11, color: C.textSecondary, textAlign: 'center' }}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Financeiro() {
  const { usuario } = useAuth();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [modo, setModo] = useState<Modo>('mes');
  const [itens, setItens] = useState<ServicoComCliente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoComCliente | null>(null);

  const carregar = useCallback(() => {
    if (!usuario) return;
    setCarregando(true);
    try {
      if (modo === 'mes') {
        setItens(getServicosDoMes(ano, mes, usuario.id));
      } else {
        setItens(getServicosDoAno(ano, usuario.id));
      }
    } finally {
      setCarregando(false);
    }
  }, [ano, mes, modo, usuario]);

  useFocusEffect(carregar);

  function navegar(dir: -1 | 1) {
    if (modo === 'ano') {
      setAno((a) => a + dir);
    } else {
      let novoMes = mes + dir;
      let novoAno = ano;
      if (novoMes < 1) { novoMes = 12; novoAno -= 1; }
      if (novoMes > 12) { novoMes = 1; novoAno += 1; }
      setMes(novoMes);
      setAno(novoAno);
    }
  }

  const recebido = itens.filter((s) => s.pago === 1).reduce((acc, s) => acc + (s.valor ?? 0), 0);
  const pendente = itens.filter((s) => s.pago === 0).reduce((acc, s) => acc + (s.valor ?? 0), 0);
  const totalServicos = itens.length;
  const mediaPorServico = totalServicos > 0 ? (recebido + pendente) / totalServicos : 0;

  const barras = modo === 'mes' ? calcularSemanas(itens) : calcularMeses(itens);
  const topClientes = getTopClientesDoPeriodo(itens, 5);
  const maxClienteTotal = topClientes.length > 0 ? topClientes[0].total : 1;
  const ultimos8 = [...itens].slice(0, 8);

  const tituloPeriodo =
    modo === 'mes'
      ? `${MESES_CURTO[mes - 1]} ${ano}`
      : String(ano);

  function abrirServico(servico: ServicoComCliente) {
    setServicoSelecionado(servico);
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
    setServicoSelecionado(null);
  }

  function aoSalvar() {
    fecharModal();
    carregar();
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={C.green} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Financeiro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Seletor de período */}
        <View style={styles.periodoRow}>
          <TouchableOpacity style={styles.setaBtn} onPress={() => navegar(-1)}>
            <Ionicons name="chevron-back" size={20} color={C.textDark} />
          </TouchableOpacity>
          <Text style={styles.periodoTexto}>{tituloPeriodo}</Text>
          <TouchableOpacity style={styles.setaBtn} onPress={() => navegar(1)}>
            <Ionicons name="chevron-forward" size={20} color={C.textDark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modoBotao}
            onPress={() => setModo((m) => (m === 'mes' ? 'ano' : 'mes'))}
          >
            <Text style={styles.modoTexto}>{modo === 'mes' ? 'Mês' : 'Ano'}</Text>
          </TouchableOpacity>
        </View>

        {/* Cards 2x2 */}
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardVerde]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={C.green} style={styles.cardIcone} />
            <Text style={styles.cardLabel}>Recebido</Text>
            <Text style={[styles.cardValor, { color: C.greenDark }]}>{fmt(recebido)}</Text>
          </View>
          <View style={[styles.card, styles.cardVermelho]}>
            <Ionicons name="time-outline" size={22} color={C.red} style={styles.cardIcone} />
            <Text style={styles.cardLabel}>Pendente</Text>
            <Text style={[styles.cardValor, { color: '#991b1b' }]}>{fmt(pendente)}</Text>
          </View>
          <View style={[styles.card, styles.cardCinza]}>
            <Ionicons name="construct-outline" size={22} color={C.textDark} style={styles.cardIcone} />
            <Text style={styles.cardLabel}>Serviços</Text>
            <Text style={styles.cardValor}>{totalServicos}</Text>
          </View>
          <View style={[styles.card, styles.cardCinza]}>
            <Ionicons name="stats-chart-outline" size={22} color={C.textDark} style={styles.cardIcone} />
            <Text style={styles.cardLabel}>Média/serv.</Text>
            <Text style={styles.cardValor}>{fmt(mediaPorServico)}</Text>
          </View>
        </View>

        {/* Gráfico de barras */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>
            {modo === 'mes' ? 'Receita por semana' : 'Receita por mês'}
          </Text>
          <GraficoBarras barras={barras} />
        </View>

        {/* Top 5 clientes */}
        {topClientes.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Top clientes</Text>
            {topClientes.map((c, i) => (
              <View key={i} style={styles.clienteRow}>
                <View style={styles.clientePosCircle}>
                  <Text style={styles.clientePos}>{i + 1}</Text>
                </View>
                <View style={styles.clienteInfo}>
                  <View style={styles.clienteNomeRow}>
                    <Text style={styles.clienteNome} numberOfLines={1}>{c.nome}</Text>
                    <Text style={styles.clienteValor}>{fmt(c.total)}</Text>
                  </View>
                  <View style={styles.barraContainer}>
                    <View
                      style={[
                        styles.barra,
                        { width: `${(c.total / maxClienteTotal) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.clienteQtd}>{c.qtd} serviço{c.qtd !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Últimos 8 serviços */}
        {ultimos8.length > 0 && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Últimos serviços</Text>
            {ultimos8.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.servicoRow, i === 0 && styles.servicoRowPrimeiro]}
                onPress={() => abrirServico(s)}
                activeOpacity={0.6}
              >
                <Text style={styles.servicoData}>{formatDataCurta(s.data)}</Text>
                <Text style={styles.servicoCliente} numberOfLines={1}>{s.cliente.nome}</Text>
                <Text style={styles.servicoValor}>{fmt(s.valor ?? 0)}</Text>
                <View style={[styles.badge, s.pago === 1 ? styles.badgePago : styles.badgePendente]}>
                  <Text style={[styles.badgeTexto, s.pago === 1 ? styles.badgeTextoPago : styles.badgeTextoPendente]}>
                    {s.pago === 1 ? 'Pago' : 'Pend.'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Limpar banco */}
        <TouchableOpacity
          style={styles.btnLimpar}
          onPress={() =>
            Alert.alert('Apagar tudo?', 'Remove todos os clientes, serviços e agendamentos. Sem volta.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Apagar tudo',
                style: 'destructive',
                onPress: () => { if (usuario) { limparTudo(usuario.id); carregar(); } },
              },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color={C.red} />
          <Text style={styles.btnLimparTexto}>Apagar todos os dados</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditarServicoModal
        visivel={modalVisivel}
        servico={servicoSelecionado}
        onFechar={fecharModal}
        onSalvar={aoSalvar}
      />
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
  scroll: { paddingBottom: 40 },

  periodoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  setaBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodoTexto: { flex: 1, fontSize: 17, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  modoBotao: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  modoTexto: { fontSize: 13, fontWeight: '600', color: C.textDark },

  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardVerde: { backgroundColor: '#f0fdf4', borderColor: C.greenMid },
  cardVermelho: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  cardCinza: { backgroundColor: C.white, borderColor: C.border },
  cardIcone: { marginBottom: 8 },
  cardLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 4, fontWeight: '500' },
  cardValor: { fontSize: 19, fontWeight: '700', color: C.textPrimary },

  secao: {
    backgroundColor: C.white,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 14 },

  clienteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  clientePosCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientePos: { fontSize: 12, fontWeight: '700', color: C.textDark },
  clienteInfo: { flex: 1 },
  clienteNomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  clienteNome: { fontSize: 15, fontWeight: '600', color: C.textPrimary, flex: 1, marginRight: 8 },
  clienteValor: { fontSize: 14, fontWeight: '700', color: C.green },
  barraContainer: { height: 6, backgroundColor: C.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barra: { height: 6, backgroundColor: C.green, borderRadius: 3 },
  clienteQtd: { fontSize: 12, color: C.textMuted },

  servicoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    gap: 8,
  },
  servicoRowPrimeiro: { borderTopWidth: 0 },
  servicoData: { fontSize: 12, color: C.textMuted, width: 44 },
  servicoCliente: { flex: 1, fontSize: 14, color: C.textPrimary, fontWeight: '500' },
  servicoValor: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgePago: { backgroundColor: C.greenLight },
  badgePendente: { backgroundColor: C.redLight },
  badgeTexto: { fontSize: 11, fontWeight: '600' },
  badgeTextoPago: { color: C.green },
  badgeTextoPendente: { color: C.red },

  btnLimpar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: C.redMid,
  },
  btnLimparTexto: { fontSize: 14, fontWeight: '700', color: C.red },
});
