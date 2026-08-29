'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Status = 'Abertura' | 'Programação' | 'Execução' | 'Checklist' | 'Validação' | 'Concluído'

type Ordem = {
  id: string
  cliente: string
  veiculo: string
  servico: string
  tecnico?: string
  status: Status
  createdAt: string
  updatedAt?: string
}

type Evento = {
  id: string
  ordemId: string
  status: Status
  createdAt: string
  queued?: boolean
}

const STORAGE_KEY = 'crmplus.oficina.ordens'
const AUTOMATION_KEY = 'crmplus.oficina.automacao'
const EVENT_KEY = 'crmplus.oficina.eventos'

const stages: { key: Status; action?: string }[] = [
  { key: 'Abertura', action: 'Programar atendimento' },
  { key: 'Programação', action: 'Iniciar atendimento' },
  { key: 'Execução', action: 'Abrir checklist' },
  { key: 'Checklist', action: 'Enviar para validação' },
  { key: 'Validação', action: 'Validar e concluir' },
  { key: 'Concluído' }
]

function normalizeStatus(value: string): Status {
  if (value === 'Entrada') return 'Abertura'
  if (value === 'Diagnóstico' || value === 'Aprovação') return 'Programação'
  if (value === 'Execução') return 'Execução'
  if (value === 'Conferência') return 'Checklist'
  if (value === 'Validação') return 'Validação'
  if (value === 'Entrega' || value === 'Pronto' || value === 'Concluído') return 'Concluído'
  if (value === 'Abertura' || value === 'Programação' || value === 'Checklist') return value
  return 'Abertura'
}

function osNumber(id: string) {
  return `OS ${id.slice(0, 6).toUpperCase()}`
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export default function OficinaPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Omit<Ordem, 'status'> & { status: string }>
      const normalized = parsed.map((item) => ({ ...item, status: normalizeStatus(item.status) }))
      setOrdens(normalized)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      if (normalized.length) setSelectedId(normalized[0].id)
    }

    const history = window.localStorage.getItem(EVENT_KEY)
    if (history) {
      const parsed = JSON.parse(history) as Array<Omit<Evento, 'status'> & { status: string }>
      const normalized = parsed.map((item) => ({ ...item, status: normalizeStatus(item.status) }))
      setEventos(normalized)
      window.localStorage.setItem(EVENT_KEY, JSON.stringify(normalized))
    }

    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return ordens
    return ordens.filter((ordem) => [ordem.cliente, ordem.veiculo, ordem.servico, ordem.tecnico, ordem.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)))
  }, [ordens, query])

  const selected = ordens.find((ordem) => ordem.id === selectedId) || null
  const currentIndex = selected ? stages.findIndex((stage) => stage.key === selected.status) : -1
  const currentStage = selected ? stages[currentIndex] : null

  const selectedHistory = useMemo(() => {
    if (!selected) return []
    const history = eventos.filter((evento) => evento.ordemId === selected.id)
    if (history.length) return history
    return [{
      id: `created-${selected.id}`,
      ordemId: selected.id,
      status: 'Abertura' as Status,
      createdAt: selected.createdAt,
      queued: false
    }]
  }, [eventos, selected])

  function persist(next: Ordem[]) {
    setOrdens(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function toggleAutomacao() {
    const next = !automacao
    setAutomacao(next)
    window.localStorage.setItem(AUTOMATION_KEY, String(next))
  }

  function recordEvent(ordemId: string, status: Status) {
    const event: Evento = {
      id: crypto.randomUUID(),
      ordemId,
      status,
      createdAt: new Date().toISOString(),
      queued: automacao
    }
    const next = [event, ...eventos].slice(0, 200)
    setEventos(next)
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(next))
  }

  function criarOrdem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const ordem: Ordem = {
      id: crypto.randomUUID(),
      cliente: String(form.get('cliente') || ''),
      veiculo: String(form.get('veiculo') || ''),
      servico: String(form.get('servico') || ''),
      tecnico: String(form.get('tecnico') || ''),
      status: 'Abertura',
      createdAt: new Date().toISOString()
    }
    persist([ordem, ...ordens])
    recordEvent(ordem.id, 'Abertura')
    setSelectedId(ordem.id)
    event.currentTarget.reset()
    setShowForm(false)
  }

  function avancar() {
    if (!selected || currentIndex < 0 || currentIndex >= stages.length - 1) return
    const status = stages[currentIndex + 1].key
    const next = ordens.map((item) => item.id === selected.id
      ? { ...item, status, updatedAt: new Date().toISOString() }
      : item)
    persist(next)
    recordEvent(selected.id, status)
  }

  return (
    <main className="service-app">
      <aside className="service-sidebar">
        <Link href="/" className="service-back">← Apps</Link>
        <div className="service-brand">Oficina</div>
        <nav className="service-nav">
          <div className="service-nav-item active">Atendimentos</div>
        </nav>
        <div className="service-automation">
          <span>Automação</span>
          <button onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button>
        </div>
      </aside>

      <section className="service-list">
        <header className="service-list-head">
          <strong>Atendimentos</strong>
          <button className="service-new" onClick={() => setShowForm(true)}>Nova OS</button>
        </header>
        <div className="service-search">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        </div>
        <div className="service-records">
          {filtered.length === 0 ? (
            <div className="service-list-empty">Nenhuma OS</div>
          ) : filtered.map((ordem) => (
            <button
              key={ordem.id}
              className={`service-record ${selectedId === ordem.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(ordem.id); setShowForm(false) }}
            >
              <div className="service-record-line">
                <span>{osNumber(ordem.id)}</span>
                <span>{ordem.status}</span>
              </div>
              <strong>{ordem.veiculo}</strong>
              <span>{ordem.cliente}</span>
              {ordem.tecnico && <small>{ordem.tecnico}</small>}
            </button>
          ))}
        </div>
      </section>

      <section className="service-workspace">
        {showForm ? (
          <div className="service-create">
            <header className="service-record-head">
              <div>
                <span className="service-kicker">Nova OS</span>
                <h1>Atendimento</h1>
              </div>
              <button className="service-quiet" onClick={() => setShowForm(false)}>Cancelar</button>
            </header>
            <form className="service-form" onSubmit={criarOrdem}>
              <label>Cliente<input name="cliente" required autoFocus /></label>
              <label>Veículo<input name="veiculo" required /></label>
              <label>Técnico<input name="tecnico" /></label>
              <label>Serviço<textarea name="servico" required /></label>
              <div><button className="service-primary" type="submit">Criar OS</button></div>
            </form>
          </div>
        ) : selected ? (
          <>
            <header className="service-record-head">
              <div>
                <div className="service-record-titleline">
                  <span className="service-kicker">{osNumber(selected.id)}</span>
                  <span className="service-status">{selected.status}</span>
                </div>
                <h1>{selected.veiculo}</h1>
                <p>{selected.cliente}</p>
              </div>
              {currentStage?.action && (
                <button className="service-primary" onClick={avancar}>{currentStage.action}</button>
              )}
            </header>

            <div className="service-progress" aria-label="Fluxo do atendimento">
              {stages.map((stage, index) => (
                <div
                  key={stage.key}
                  className={`service-progress-step ${index < currentIndex ? 'done' : ''} ${index === currentIndex ? 'current' : ''}`}
                >
                  <span>{stage.key}</span>
                </div>
              ))}
            </div>

            <div className="service-detail-grid">
              <div className="service-detail-main">
                <section className="service-section">
                  <header>Serviço</header>
                  <div className="service-service-text">{selected.servico}</div>
                </section>

                <section className="service-section">
                  <header>Atividade</header>
                  <div className="service-timeline">
                    {selectedHistory.map((evento) => (
                      <div className="service-timeline-row" key={evento.id}>
                        <span className="service-timeline-dot" />
                        <div>
                          <strong>{evento.status}</strong>
                          <span>{formatDate(evento.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="service-detail-side">
                <div><span>Cliente</span><strong>{selected.cliente}</strong></div>
                <div><span>Veículo</span><strong>{selected.veiculo}</strong></div>
                <div><span>Técnico</span><strong>{selected.tecnico || '—'}</strong></div>
                <div><span>Criada</span><strong>{formatDate(selected.createdAt)}</strong></div>
                <div><span>Atualizada</span><strong>{formatDate(selected.updatedAt || selected.createdAt)}</strong></div>
              </aside>
            </div>
          </>
        ) : (
          <div className="service-workspace-empty">Nenhum atendimento</div>
        )}
      </section>
    </main>
  )
}
