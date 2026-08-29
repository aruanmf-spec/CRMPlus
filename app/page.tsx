import Link from 'next/link'
import styles from './home.module.css'

const apps = [
  { title: 'Oficina', href: '/oficina', visual: 'workshop' },
  { title: 'Satisfação', href: '/satisfacao', visual: 'satisfaction' }
]

function WorkshopVisual() {
  return (
    <div className={styles.workshopVisual} aria-hidden="true">
      <div className={styles.miniHeader}>
        <span>Ordens</span>
        <span>Execução</span>
      </div>
      <div className={styles.workshopFlow}>
        <div className={styles.flowColumn}>
          <small>Entrada</small>
          <div className={styles.flowTicket}><strong>OS 1842</strong></div>
        </div>
        <div className={styles.flowColumn}>
          <small>Execução</small>
          <div className={`${styles.flowTicket} ${styles.flowTicketActive}`}><strong>OS 1841</strong></div>
        </div>
        <div className={styles.flowColumn}>
          <small>Pronto</small>
          <div className={styles.flowTicket}><strong>OS 1840</strong></div>
        </div>
      </div>
    </div>
  )
}

function SatisfactionVisual() {
  return (
    <div className={styles.satisfactionVisual} aria-hidden="true">
      <div className={styles.miniHeader}>
        <span>Pesquisa</span>
        <span>Ativa</span>
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
        <span>Resposta</span>
        <span>Tratamento</span>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className={styles.home}>
      <header className={styles.header}>
        <div className={styles.brand}>CRM PLUS</div>
      </header>

      <section className={styles.library} aria-labelledby="apps-title">
        <div className={styles.libraryHead}>
          <h1 id="apps-title">Apps</h1>
        </div>

        <div className={styles.rail}>
          {apps.map((app) => (
            <Link key={app.href} href={app.href} className={styles.card}>
              <div className={styles.cardStage}>
                {app.visual === 'workshop' ? <WorkshopVisual /> : <SatisfactionVisual />}
                <div className={styles.scrim} />
                <div className={styles.cardCopy}>
                  <h2>{app.title}</h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
