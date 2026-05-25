import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { C, sharedStyles } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

type Tela = "landing" | "login" | "cadastro";

const FEATURES = [
  {
    icon: "🗓️",
    title: "Controle sua agenda",
    desc: "De maneira rápida, organize seus serviços",
  },
  {
    icon: "📊",
    title: "Controle financeiro",
    desc: "Acompanhe suas finanças de forma prática e eficiente",
  },
  {
    icon: "⏰",
    title: "Economia de tempo",
    desc: "Realize suas tarefas de forma mais rápida e eficiente",
  },
];

export default function Inicio() {
  const [view, setView] = useState<Tela>("landing");

  if (view === "login") return <LoginView onBack={() => setView("landing")} onCadastro={() => setView("cadastro")} />;
  if (view === "cadastro") return <CadastroView onBack={() => setView("landing")} onLogin={() => setView("login")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.appName}>Orça! 💸</Text>
          <Text style={styles.tagline}>Tempo é dinheiro, economize com Orça!</Text>
        </View>

        <View style={styles.featuresWrap}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.dividerWrap}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>Comece agora</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.ctaWrap}>
          <Pressable style={styles.btnPrimary} onPress={() => setView("cadastro")}>
            <Text style={styles.btnPrimaryText}>Criar conta grátis</Text>
          </Pressable>
          <Pressable style={styles.btnSecondary} onPress={() => setView("login")}>
            <Text style={styles.btnSecondaryText}>Já tenho conta — Entrar</Text>
          </Pressable>
        </View>

        <Text style={styles.terms}>
          Ao continuar, você aceita nossos{" "}
          <Text style={styles.termsLink}>Termos de Uso</Text> e{" "}
          <Text style={styles.termsLink}>Política de Privacidade</Text>.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function LoginView({ onBack, onCadastro }: { onBack: () => void; onCadastro: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const result = login(email.trim(), senha);
    setLoading(false);
    if (!result.success) setErro(result.erro);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </Pressable>

          <Text style={styles.formTitle}>Entrar</Text>
          <Text style={styles.formSubtitle}>Acesse sua conta Orça!</Text>

          <Text style={sharedStyles.formLabel}>E-mail</Text>
          <TextInput
            style={sharedStyles.formInput}
            placeholder="seu@email.com"
            placeholderTextColor={C.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={sharedStyles.formLabel}>Senha</Text>
          <TextInput
            style={sharedStyles.formInput}
            placeholder="••••••••"
            placeholderTextColor={C.textMuted}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
          />

          {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

          <Pressable
            style={[sharedStyles.saveButton, { marginTop: 28 }, loading && sharedStyles.saveButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={sharedStyles.saveButtonText}>Entrar</Text>
          </Pressable>

          <Pressable onPress={onCadastro} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Não tem conta? <Text style={styles.switchHighlight}>Criar conta grátis</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CadastroView({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCadastro() {
    setErro("");
    if (!nome.trim()) { setErro("Informe seu nome."); return; }
    if (!email.trim()) { setErro("Informe seu e-mail."); return; }
    if (senha.length < 6) { setErro("A senha deve ter pelo menos 6 caracteres."); return; }
    if (senha !== confirmSenha) { setErro("As senhas não coincidem."); return; }

    setLoading(true);
    const result = cadastrar(nome.trim(), email.trim(), senha);
    setLoading(false);
    if (!result.success) setErro(result.erro);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </Pressable>

          <Text style={styles.formTitle}>Criar conta</Text>
          <Text style={styles.formSubtitle}>Comece a usar o Orça! gratuitamente</Text>

          <Text style={sharedStyles.formLabel}>Nome</Text>
          <TextInput
            style={sharedStyles.formInput}
            placeholder="Seu nome"
            placeholderTextColor={C.textMuted}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Text style={sharedStyles.formLabel}>E-mail</Text>
          <TextInput
            style={sharedStyles.formInput}
            placeholder="seu@email.com"
            placeholderTextColor={C.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={sharedStyles.formLabel}>Senha</Text>
          <TextInput
            style={sharedStyles.formInput}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={C.textMuted}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={sharedStyles.formLabel}>Confirmar senha</Text>
          <TextInput
            style={sharedStyles.formInput}
            placeholder="Repita a senha"
            placeholderTextColor={C.textMuted}
            value={confirmSenha}
            onChangeText={setConfirmSenha}
            secureTextEntry
            autoComplete="new-password"
          />

          {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

          <Pressable
            style={[sharedStyles.saveButton, { marginTop: 28 }, loading && sharedStyles.saveButtonDisabled]}
            onPress={handleCadastro}
            disabled={loading}
          >
            <Text style={sharedStyles.saveButtonText}>Criar conta</Text>
          </Pressable>

          <Pressable onPress={onLogin} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Já tem conta? <Text style={styles.switchHighlight}>Entrar</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 40,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },

  // Features
  featuresWrap: {
    gap: 12,
    marginBottom: 36,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },

  // Divider
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // CTAs
  ctaWrap: {
    gap: 12,
    marginBottom: 20,
  },
  btnPrimary: {
    backgroundColor: C.green,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: "700",
    color: C.white,
    letterSpacing: 0.3,
  },
  btnSecondary: {
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.textDark,
  },

  // Terms
  terms: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: C.green,
    fontWeight: "600",
  },

  // Forms
  backBtn: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  backText: {
    fontSize: 15,
    color: C.green,
    fontWeight: "600",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: C.textPrimary,
    marginTop: 16,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 15,
    color: C.textSecondary,
    marginBottom: 8,
  },
  erroText: {
    marginTop: 14,
    color: C.red,
    fontSize: 14,
    fontWeight: "500",
  },
  switchLink: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: C.textSecondary,
  },
  switchHighlight: {
    color: C.green,
    fontWeight: "600",
  },
});
