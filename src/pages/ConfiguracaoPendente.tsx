export function ConfiguracaoPendente() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-4xl font-extrabold text-ink-900">Orça! 💸</h1>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-bold">Configuração pendente</p>
        <p className="mt-2 text-sm">
          Este build foi gerado sem as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>. Cadastre-as em
          <strong> Settings → Secrets and variables → Actions</strong> do repositório (ou em <code>.env.local</code> para rodar localmente) e
          gere o build de novo.
        </p>
      </div>
    </main>
  )
}
