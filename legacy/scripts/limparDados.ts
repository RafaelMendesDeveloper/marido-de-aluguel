import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('marido.db');

db.execSync(`
  DELETE FROM agendamentos;
  DELETE FROM servicos;
  DELETE FROM clientes;
`);

console.log('Banco limpo com sucesso.');
