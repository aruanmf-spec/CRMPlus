'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Metrica = 'NPS' | 'CSAT' | 'CES'
type View = 'Pesquisas' | 'Respostas' | 'Tratativas'

type Pesquisa = {
  id: string
  nome: string
  pergunta: string
  metrica: Metrica
  canal: 'Link' | 'WhatsApp' | 'Email'
  status: 'Ativa' | 'Pausada'
  createdAt: string
}

type Resposta = {
  id: string
  pesquisaId: string
  nota: number
  comentario?: string
  createdAt: string
}

type Tratativa = {
  id: string
  pesquisaId: string
  respostaId: string
  status: 'Aberta' | 'Resolvida'
  createdAt: string
}

const STORAGE_KEY = 'crmplus.satisfacao.pesquisas'
const RESPONSE_KEY = 'crmplus.satisfacao.respostas'
const CASE_KEY = 'crmplus.satisfacao.tratativas'
const AUTOMATION_KEY = 'crmplus.satisfacao.automacao'

function classify(metrica: Metrica, nota: number) {
  if (metrica === 'NPS') return nota <= 6 ? 'Detrator' : nota <= 8 ? 'Neutro' : 'Promotor'
  if (metrica === 'CSAT') return nota <= 2 ? 'Crítico' : nota === 3 ? 'Neutro' : 'Positivo'
  return nota <= 3 ? 'Crítico' : nota <= 5 ? 'Neutro' : 'Positivo'
}

export default function SatisfacaoPage() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [tratativas, setTratativas] = useState<Tratativa[]>([])
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)
  const [view, setView] = useState<View>('Pesquisas')

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Pesquisa>[]
      setPesquisas(parsed.map((item) => ({
        id: String(item.id),
        nome: String(item.nome || ''),
        pergunta: String(item.pergunta || ''),
        metrica: (item.metrica || 'NPS') as Metrica,
        canal: (item.canal || 'Link') as Pesquisa['canal'],
        status: (item.status || 'Ativa') as Pesquisa['status'],
        createdAt: String(item.createdAt || new Date().toISOString())
      })))
    }
    const responses = window.localStorage.getItem(RESPONSE_KEY)
    if (responses) setRespostas(JSON.parse(responses))
    const cases = window.localStorage.getItem(CASE_KEY)
    if (cases) setTratativas(JSON.parse(cases))
    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [view])

  const pesquisaMap = useMemo(() => new Map(pesquisas.map((item) => [item.id, item])), [pesquisas])

  function persist(next: Pesquisa[]) {
    setPesquisas(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function toggleAutomacao() {
    const next = !automacao
    setAutomacao(next)
    window.localStorage.setItem(AUTOMATION_KEY, String(next))
  }

  function criarPesquisa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const pesquisa: Pesquisa = {
      id: crypto.randomUUID(),
      nome: String(form.get('nome') || ''),
      pergunta: String(form.get('pergunta') || ''),
      metrica: String(form.get('metrica') || 'NPS') as Metrica,
      canal: String(form.get('canal') || 'Link') as Pesquisa['canal'],
      status: 'Ativa',
      createdAt: new Date().toISOString()
    }
    persist([pesquisa, ...pesquisas])
    event.currentTarget.reset()
    setShowForm(false)
  }

  function togglePesquisa(id: string) {
    persist(pesquisas.map((item) => item.id === id ? { ...item, status: item.status === 'Ativa' ? 'Pausada' : 'Ativa' } : item))
  }

  function resolver(id: string) {
    const next = tratativas.map((item) => item.id === id ? { ...item, status: 'Resolvida' as const } : item)
    setTratativas(next)
    window.localStorage.setItem(CASE_KEY, JSON.stringify(next))
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="back">← Apps</Link>
        <div className="module-name">Satisfação</div>
        <nav className="nav">
          {(['Pesquisas', 'Respostas', 'Tratativas'] as View[]).map((item) => (
            <button key={item} className={`nav-item nav-button ${view === item ? 'active' : ''}`} onClick={() => setView(item)}>{item}</button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="row-top">
            <span>Automação</span>
            <button className="button secondary compact" onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button>
          </div>
        </div>
      </aside>

      <section className="workspace">
        {view === 'Pesquisas' && (
          <>
            <header className="page-head">
              <h2>Pesquisas</h2>
              <button className="button" onClick={() => setShowForm((value) => !value)}>Nova pesquisa</button>
            </header>

            {showForm && (
              <form className="form" onSubmit={criarPesquisa}>
                <div className="form-grid">
                  <div className="field"><label>Nome</label><input name="nome" required autoFocus /></div>
                  <div className="field"><label>Métrica</label><select name="metrica"><option>NPS</option><option>CSAT</option><option>CES</option></select></div>
                  <div className="field"><label>Canal</label><select name="canal"><option>Link</option><option>WhatsApp</option><option>Email</option></select></div>
                  <div className="field"><label>Pergunta</label><input name="pergunta" required /></div>
                </div>
                <div className="form-actions">
                  <button className="button" type="submit">Criar</button>
                  <button className="button secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
                </div>
              </form>
            )}

            <div className="board">
              {pesquisas.length === 0 ? (
                <div className="empty"><strong>Nenhuma pesquisa</strong></div>
              ) : pesquisas.map((pesquisa) => (
                <article className="row" key={pesquisa.id}>
                  <div className="row-top">
                    <div>
                      <div className="row-title">{pesquisa.nome}</div>
                      <div className="row-meta">{pesquisa.pergunta}</div>
                    </div>
                    <div className="status-group"><span className="status">{pesquisa.metrica}</span><span className="status">{pesquisa.status}</span></div>
                  </div>
                  <div className="row-actions">
                    <Link className="button secondary" href={`/satisfacao/responder/${pesquisa.id}`}>Abrir</Link>
                    <button className="button secondary" onClick={() => navigator.clipboard?.writeText(`${location.origin}/satisfacao/responder/${pesquisa.id}`)}>Copiar link</button>
                    <button className="button secondary" onClick={() => togglePesquisa(pesquisa.id)}>{pesquisa.status === 'Ativa' ? 'Pausar' : 'Ativar'}</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {view === 'Respostas' && (
          <>
            <header className="page-head"><h2>Respostas</h2></header>
            <div className="board">
              {respostas.length === 0 ? <div className="empty"><strong>Nenhuma resposta</strong></div> : respostas.map((resposta) => {
                const pesquisa = pesquisaMap.get(resposta.pesquisaId)
                if (!pesquisa) return null
                return (
                  <article className="row" key={resposta.id}>
                    <div className="row-top">
                      <div><div className="row-title">{pesquisa.nome}</div><div className="row-meta">{resposta.comentario || 'Sem comentário'}</div></div>
                      <div className="response-score">{resposta.nota}</div>
                    </div>
                    <div className="status-group"><span className="status">{pesquisa.metrica}</span><span className="status">{classify(pesquisa.metrica, resposta.nota)}</span></div>
                  </article>
                )
              })}
            </div>
          </>
        )}

        {view === 'Tratativas' && (
          <>
            <header className="page-head"><h2>Tratativas</h2></header>
            <div className="board">
              {tratativas.length === 0 ? <div className="empty"><strong>Nenhuma tratativa</strong></div> : tratativas.map((item) => {
                const resposta = respostas.find((response) => response.id === item.respostaId)
                const pesquisa = pesquisaMap.get(item.pesquisaId)
                if (!resposta || !pesquisa) return null
                return (
                  <article className="row" key={item.id}>
                    <div className="row-top">
                      <div><div className="row-title">{pesquisa.nome}</div><div className="row-meta">{resposta.comentario || 'Sem comentário'}</div></div>
                      <span className="status">{item.status}</span>
                    </div>
                    {item.status === 'Aberta' && <div><button className="button secondary" onClick={() => resolver(item.id)}>Resolver</button></div>}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
