import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Inicio() {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text>Bem-vindo ao Marido de Aluguel!</Text>
    </SafeAreaView>
  );
}
