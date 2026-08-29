'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'

type Ordem = {
  id: string
  cliente: string
  veiculo: string
  servico: string
  status: 'Entrada' | 'Diagnóstico' | 'Execução' | 'Pronto'
  createdAt: string
}

const STORAGE_KEY = 'crmplus.oficina.ordens'
const AUTOMATION_KEY = 'crmplus.oficina.automacao'

export default function OficinaPage() {
  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [automacao, setAutomacao] = useState(true)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) setOrdens(JSON.parse(raw))
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

  function criarOrdem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const ordem: Ordem = {
      id: crypto.randomUUID(),
      cliente: String(form.get('cliente') || ''),
      veiculo: String(form.get('veiculo') || ''),
      servico: String(form.get('servico') || ''),
      status: 'Entrada',
      createdAt: new Date().toISOString()
    }
    persist([ordem, ...ordens])
    event.currentTarget.reset()
    setShowForm(false)
  }

  function avancar(id: string) {
    const fluxo: Ordem['status'][] = ['Entrada', 'Diagnóstico', 'Execução', 'Pronto']
    persist(ordens.map((ordem) => {
      if (ordem.id !== id) return ordem
      const atual = fluxo.indexOf(ordem.status)
      return { ...ordem, status: fluxo[Math.min(atual + 1, fluxo.length - 1)] }
    }))
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="back">← Apps</Link>
        <div className="module-name">Oficina</div>
        <nav className="nav">
          <div className="nav-item active">Ordens</div>
        </nav>
        <div className="sidebar-foot">
          <div className="row-top">
            <span>Automação</span>
            <button className="button secondary" onClick={toggleAutomacao}>{automacao ? 'Ativa' : 'Pausada'}</button>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="page-head">
          <h2>Ordens</h2>
          <button className="button" onClick={() => setShowForm((value) => !value)}>Nova ordem</button>
        </header>

        {showForm && (
          <form className="form" onSubmit={criarOrdem}>
            <div className="form-grid">
              <div className="field"><label>Cliente</label><input name="cliente" required autoFocus /></div>
              <div className="field"><label>Veículo</label><input name="veiculo" required /></div>
            </div>
            <div className="field"><label>Serviço</label><textarea name="servico" required /></div>
            <div><button className="button" type="submit">Criar</button></div>
          </form>
        )}

        <div className="board">
          {ordens.length === 0 ? (
            <div className="empty"><strong>Nenhuma ordem</strong></div>
          ) : ordens.map((ordem) => (
            <article className="row" key={ordem.id}>
              <div className="row-top">
                <div>
                  <div className="row-title">{ordem.veiculo}</div>
                  <div className="row-meta">{ordem.cliente}</div>
                </div>
                <span className="status">{ordem.status}</span>
              </div>
              <div className="row-meta">{ordem.servico}</div>
              {ordem.status !== 'Pronto' && (
                <div><button className="button secondary" onClick={() => avancar(ordem.id)}>Avançar</button></div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
