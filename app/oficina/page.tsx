'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Status = 'Entrada' | 'Diagnóstico' | 'Aprovação' | 'Execução' | 'Conferência' | 'Entrega'

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

const STORAGE_KEY = 'crmplus.oficina.ordens'
const AUTOMATION_KEY = 'crmplus.oficina.automacao'
const EVENT_KEY = 'crmplus.oficina.eventos'

const stages: { key: Status; action?: string }[] = [
  { key: 'Entrada', action: 'Diagnosticar' },
  { key: 'Diagnóstico', action: 'Aprovar' },
  { key: 'Aprovação', action: 'Iniciar' },
  { key: 'Execução', action: 'Conferir' },
  { key: 'Conferência', action: 'Entregar' },
  { key: 'Entrega' }
]

export default function OficinaPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Ordem[]
      setOrdens(parsed.map((item) => ({
        ...item,
        status: item.status === 'Pronto' ? 'Entrega' : item.status
      })))
    }
    const automation = window.localStorage.getItem(AUTOMATION_KEY)
    if (automation !== null) setAutomacao(automation === 'true')
  }, [])

  function persist(next: Ordem[]) {
    setOrdens(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function toggleAutomacao() {
    const next = !automacao
    setAutomacao(next)
    window.localStorage.setItem(AUTOMATION_KEY, String(next))
  }

  function queueEvent(ordem: Ordem, status: Status) {
    if (!automacao) return
    const raw = window.localStorage.getItem(EVENT_KEY)
    const events = raw ? JSON.parse(raw) : []
    events.unshift({
      id: crypto.randomUUID(),
      ordemId: ordem.id,
      type: 'ordem.status.changed',
      status,
      createdAt: new Date().toISOString()
    })
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(0, 100)))
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
      status: 'Entrada',
      createdAt: new Date().toISOString()
    }
    persist([ordem, ...ordens])
    queueEvent(ordem, 'Entrada')
    event.currentTarget.reset()
    setShowForm(false)
  }

  function avancar(id: string) {
    const fluxo = stages.map((stage) => stage.key)
    const ordem = ordens.find((item) => item.id === id)
    if (!ordem) return
    const atual = fluxo.indexOf(ordem.status)
    const status = fluxo[Math.min(atual + 1, fluxo.length - 1)]
    const next = ordens.map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item)
    persist(next)
    queueEvent(ordem, status)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="back">← Apps</Link>
        <div className="module-name">Oficina</div>
        <nav className="nav">
          <div className="nav-item active">Quadro</div>
        </nav>
        <div className="sidebar-foot">
          <div className="row-top">
            <span>Automação</span>
            <button className="button secondary compact" onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button>
          </div>
        </div>
      </aside>

      <section className="workspace workspace-wide">
        <header className="page-head">
          <h2>Ordens</h2>
          <button className="button" onClick={() => setShowForm((value) => !value)}>Nova ordem</button>
        </header>

        {showForm && (
          <form className="form" onSubmit={criarOrdem}>
            <div className="form-grid">
              <div className="field"><label>Cliente</label><input name="cliente" required autoFocus /></div>
              <div className="field"><label>Veículo</label><input name="veiculo" required /></div>
              <div className="field"><label>Técnico</label><input name="tecnico" /></div>
              <div className="field"><label>Serviço</label><input name="servico" required /></div>
            </div>
            <div className="form-actions">
              <button className="button" type="submit">Criar</button>
              <button className="button secondary" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="kanban">
          {stages.map((stage) => {
            const items = ordens.filter((ordem) => ordem.status === stage.key)
            return (
              <section className="kanban-column" key={stage.key}>
                <header className="kanban-head">
                  <span>{stage.key}</span>
                  {items.length > 0 && <span className="column-count">{items.length}</span>}
                </header>
                <div className="kanban-stack">
                  {items.map((ordem) => (
                    <article className="order-card" key={ordem.id}>
                      <div className="order-card-head">
                        <strong>{ordem.veiculo}</strong>
                        {ordem.tecnico && <span>{ordem.tecnico}</span>}
                      </div>
                      <div className="order-client">{ordem.cliente}</div>
                      <div className="order-service">{ordem.servico}</div>
                      {stage.action && (
                        <button className="card-button" onClick={() => avancar(ordem.id)}>{stage.action}</button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </section>
    </main>
  )
}
