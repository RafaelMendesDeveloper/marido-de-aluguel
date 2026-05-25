import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAllClientes, searchClientes, type Cliente } from "../../db/queries";
import { C } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

export default function Clientes() {
  const { usuario } = useAuth();
  const [query, setQuery] = useState("");
  const [lista, setLista] = useState<Cliente[]>([]);

  function carregar(q = "") {
    if (!usuario) return;
    setLista(q.trim() ? searchClientes(q, usuario.id) : getAllClientes(usuario.id));
  }

  useFocusEffect(
    useCallback(() => {
      setQuery("");
      carregar("");
    }, []),
  );

  function handleSearch(text: string) {
    setQuery(text);
    carregar(text);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Clientes</Text>
      </View>

      <View style={styles.buscaWrapper}>
        <View style={styles.buscaRow}>
          <Ionicons
            name="search-outline"
            size={18}
            color={C.textMuted}
            style={styles.buscaIcone}
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
            <Pressable onPress={() => handleSearch("")} hitSlop={8}>
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
                <Text style={styles.itemTel}>{item.telefone}</Text>
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
              {query
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"}
            </Text>
            {!query && (
              <Text style={styles.vazioSub}>
                Os clientes aparecem aqui ao registrar um serviço
              </Text>
            )}
          </View>
        }
        contentContainerStyle={styles.list}
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
  titulo: { fontSize: 28, fontWeight: "700", color: C.textPrimary },
  buscaWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  buscaRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  buscaIcone: {},
  busca: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
  },
  list: { paddingTop: 8, paddingBottom: 24 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarTexto: { fontSize: 20, fontWeight: "700", color: C.green },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 17, fontWeight: "600", color: C.textPrimary },
  itemTel: { fontSize: 14, color: C.textSecondary, marginTop: 2 },
  vazio: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  vazioIcone: { marginBottom: 16 },
  vazioTexto: {
    fontSize: 17,
    fontWeight: "600",
    color: C.textMuted,
    textAlign: "center",
  },
  vazioSub: {
    fontSize: 13,
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 6,
  },
});
