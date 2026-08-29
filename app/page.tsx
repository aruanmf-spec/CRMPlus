import Link from 'next/link'
import styles from './home.module.css'

const apps = [
  {
    title: 'Oficina',
    href: '/oficina',
    purpose: 'Operação de oficina',
    description: 'Recepção, execução e entrega em um fluxo único.',
    visual: 'workshop'
  },
  {
    title: 'Satisfação',
    href: '/satisfacao',
    purpose: 'Pesquisa de satisfação',
    description: 'Envio, resposta e tratamento sem misturar marketing.',
    visual: 'satisfaction'
  }
]

function WorkshopVisual() {
  return (
    <div className={styles.workshopVisual} aria-hidden="true">
      <div className={styles.miniHeader}>
        <span>Ordem de serviço</span>
        <span>Em execução</span>
      </div>
      <div className={styles.workshopFlow}>
        <div className={styles.flowColumn}>
          <small>Entrada</small>
          <div className={styles.flowTicket}>
            <strong>Veículo recebido</strong>
            <span>Diagnóstico inicial</span>
          </div>
        </div>
        <div className={styles.flowColumn}>
          <small>Execução</small>
          <div className={`${styles.flowTicket} ${styles.flowTicketActive}`}>
            <strong>Serviço em andamento</strong>
            <span>Etapa atual visível</span>
          </div>
        </div>
        <div className={styles.flowColumn}>
          <small>Entrega</small>
          <div className={styles.flowTicket}>
            <strong>Conferência final</strong>
            <span>Pronto para saída</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SatisfactionVisual() {
  return (
    <div className={styles.satisfactionVisual} aria-hidden="true">
      <div className={styles.miniHeader}>
        <span>Pesquisa pós-atendimento</span>
        <span>Automação ativa</span>
      </div>
      <div className={styles.questionBox}>
        <small>Como foi sua experiência?</small>
        <div className={styles.scoreLine}>
          {Array.from({ length: 11 }, (_, index) => (
            <span key={index} className={index === 9 ? styles.scoreActive : ''}>{index}</span>
          ))}
        </div>
      </div>
      <div className={styles.responseStrip}>
        <span>Resposta recebida</span>
        <span>Classificar</span>
        <span>Tratar retorno</span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className={styles.home}>
      <header className={styles.header}>
        <div className={styles.brand}>CRM PLUS</div>
        <div className={styles.headerNote}>Aplicativos</div>
      </header>

      <section className={styles.library} aria-labelledby="apps-title">
        <div className={styles.libraryHead}>
          <h1 id="apps-title">Escolha um app</h1>
          <p>Entre direto no trabalho que precisa ser feito.</p>
        </div>

        <div className={styles.rail}>
          {apps.map((app) => (
            <Link key={app.href} href={app.href} className={styles.card}>
              <div className={styles.cardStage}>
                {app.visual === 'workshop' ? <WorkshopVisual /> : <SatisfactionVisual />}
                <div className={styles.scrim} />
                <div className={styles.cardCopy}>
                  <span>{app.purpose}</span>
                  <h2>{app.title}</h2>
                  <p>{app.description}</p>
                </div>
              </div>
              <div className={styles.cardAction}>
                <span>Abrir aplicativo</span>
                <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
