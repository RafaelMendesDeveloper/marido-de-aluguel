import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NovoClienteModal from '../../components/NovoClienteModal';
import { C } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  createCliente,
  getAllClientes,
  getClienteByTelefone,
  searchClientes,
  type Cliente,
} from '../../db/queries';

function normalizarTelefone(tel: string): string {
  return tel.replace(/\D/g, '');
}

export default function Clientes() {
  const { usuario } = useAuth();
  const [query, setQuery] = useState('');
  const [lista, setLista] = useState<Cliente[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  function carregar(q = '') {
    if (!usuario) return;
    setLista(q.trim() ? searchClientes(q, usuario.id) : getAllClientes(usuario.id));
  }

  useFocusEffect(
    useCallback(() => {
      setQuery('');
      carregar('');
    }, [usuario]),
  );

  function handleSearch(text: string) {
    setQuery(text);
    carregar(text);
  }

  function handleSalvarCliente(dados: { nome: string; telefone: string; endereco: string }) {
    if (!usuario) return;
    createCliente({
      nome: dados.nome,
      usuarioId: usuario.id,
      telefone: dados.telefone || undefined,
      endereco: dados.endereco || undefined,
    });
    setModalVisivel(false);
    carregar(query);
  }

  async function sincronizarContatos() {
    if (!usuario || sincronizando) return;
    setSincronizando(true);

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Permita o acesso aos contatos nas configurações do dispositivo.');
      setSincronizando(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });

    let importados = 0;
    let ignorados = 0;

    for (const contato of data) {
      const nome = contato.name?.trim();
      if (!nome) continue;

      const telefones = contato.phoneNumbers ?? [];
      const telefone = telefones[0]?.number
        ? normalizarTelefone(telefones[0].number)
        : undefined;

      if (telefone) {
        const existente = getClienteByTelefone(telefone, usuario.id);
        if (existente) { ignorados++; continue; }
      }

      createCliente({ nome, usuarioId: usuario.id, telefone });
      importados++;
    }

    carregar(query);
    setSincronizando(false);

    Alert.alert(
      'Sincronização concluída',
      `${importados} contato${importados !== 1 ? 's' : ''} importado${importados !== 1 ? 's' : ''}` +
        (ignorados > 0 ? `\n${ignorados} já existiam` : ''),
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Clientes</Text>
        <Pressable
          style={[styles.syncBtn, sincronizando && styles.syncBtnAtivo]}
          onPress={sincronizarContatos}
          hitSlop={8}
        >
          <Ionicons
            name={sincronizando ? 'sync' : 'people-circle-outline'}
            size={22}
            color={sincronizando ? C.green : C.textSecondary}
          />
          <Text style={[styles.syncTexto, sincronizando && { color: C.green }]}>
            {sincronizando ? 'Sincronizando…' : 'Importar contatos'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.buscaWrapper}>
        <View style={styles.buscaRow}>
          <Ionicons
            name="search-outline"
            size={18}
            color={C.textMuted}
          />
          <TextInput
            style={styles.busca}
            placeholder="Buscar cliente..."
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="words"
          />
          {query.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => router.push(`/cliente/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>
                {item.nome.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              {item.telefone ? (
                <Text style={styles.itemSub}>{item.telefone}</Text>
              ) : item.endereco ? (
                <Text style={styles.itemSub} numberOfLines={1}>{item.endereco}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Ionicons
              name="people-outline"
              size={48}
              color={C.textMuted}
              style={styles.vazioIcone}
            />
            <Text style={styles.vazioTexto}>
              {query ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </Text>
            {!query && (
              <Text style={styles.vazioSub}>
                Toque em + para adicionar um cliente
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Pressable style={styles.fab} onPress={() => setModalVisivel(true)}>
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>

      <NovoClienteModal
        visivel={modalVisivel}
        onFechar={() => setModalVisivel(false)}
        onSalvar={handleSalvarCliente}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: { fontSize: 28, fontWeight: '700', color: C.textPrimary },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  syncBtnAtivo: { borderColor: C.greenMid, backgroundColor: C.greenLight },
  syncTexto: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  buscaWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  buscaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  busca: { flex: 1, fontSize: 16, color: C.textPrimary },
  list: { paddingTop: 8, paddingBottom: 100 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarTexto: { fontSize: 20, fontWeight: '700', color: C.green },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  itemSub: { fontSize: 14, color: C.textSecondary, marginTop: 2 },
  vazio: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  vazioIcone: { marginBottom: 16 },
  vazioTexto: { fontSize: 17, fontWeight: '600', color: C.textMuted, textAlign: 'center' },
  vazioSub: { fontSize: 13, color: '#d1d5db', textAlign: 'center', marginTop: 6 },
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
