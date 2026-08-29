import Link from 'next/link'

const apps = [
  {
    index: '01',
    title: 'Oficina',
    href: '/oficina',
    purpose: 'Operação de oficina',
    copy: 'Receba o serviço, organize a execução e acompanhe o trabalho sem misturar funções que não pertencem ao fluxo da oficina.'
  },
  {
    index: '02',
    title: 'Satisfação',
    href: '/satisfacao',
    purpose: 'Pesquisa e retorno',
    copy: 'Crie pesquisas, acompanhe respostas e automatize retornos sem transformar o módulo em uma suíte genérica de marketing.'
  }
]

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">CRM Plus</div>
        <div className="topnote">Apps independentes. Um propósito por vez.</div>
      </header>

      <section className="hero">
        <div className="eyebrow">Profundidade antes de expansão</div>
        <h1>Escolha o trabalho que precisa ser feito.</h1>
        <p>
          Cada app existe para aprofundar uma operação específica. A home apenas organiza o acesso; os módulos não compartilham responsabilidade por padrão.
        </p>
      </section>

      <section className="catalog" aria-label="Aplicativos">
        {apps.map((app) => (
          <Link key={app.href} href={app.href} className="app-card">
            <div>
              <div className="card-index">{app.index}</div>
              <div style={{ marginTop: 72 }}>
                <h2 className="card-title">{app.title}</h2>
                <p className="card-copy">{app.copy}</p>
              </div>
            </div>
            <div className="card-footer">
              <div className="card-purpose">{app.purpose}</div>
              <div className="open-link">Abrir <span>→</span></div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
