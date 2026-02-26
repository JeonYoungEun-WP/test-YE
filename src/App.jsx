import { LeadMagnetFunnelTab } from './components/marketing/LeadMagnetFunnelTab'
import { GA4YesterdayBanner } from './components/marketing/GA4YesterdayBanner'
import { GA4SessionSourceTable } from './components/marketing/GA4SessionSourceTable'
import './App.css'

const sampleDeals = [
  { id: '1', stage: 'lead', source: 'web', amount: 500000, created_at: '2026-02-10' },
  { id: '2', stage: 'lead', source: 'web', amount: 300000, created_at: '2026-02-11' },
  { id: '3', stage: 'meeting', source: 'web', amount: 800000, created_at: '2026-02-12' },
  { id: '4', stage: 'meeting', source: 'email', amount: 1200000, created_at: '2026-02-13' },
  { id: '5', stage: 'quote', source: 'web', amount: 600000, created_at: '2026-02-14' },
  { id: '6', stage: 'quote', source: 'web', amount: 900000, created_at: '2026-02-15' },
  { id: '7', stage: 'contract', source: 'email', amount: 1500000, created_at: '2026-02-16' },
  { id: '8', stage: 'supply', source: 'web', amount: 2000000, created_at: '2026-02-17' },
  { id: '9', stage: 'won', source: 'web', amount: 3000000, created_at: '2026-02-18' },
  { id: '10', stage: 'lost', source: 'web', amount: 400000, created_at: '2026-02-19' },
  { id: '11', stage: 'lead', source: 'web', amount: 250000, created_at: '2026-02-20' },
  { id: '12', stage: 'lead', source: 'email', amount: 350000, created_at: '2026-02-21' },
  { id: '13', stage: 'meeting', source: 'web', amount: 700000, created_at: '2026-02-22' },
  { id: '14', stage: 'quote', source: 'web', amount: 1100000, created_at: '2026-02-23' },
  { id: '15', stage: 'won', source: 'email', amount: 2500000, created_at: '2026-02-24' },
]

function App() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">GA 리포트</h1>
          <GA4YesterdayBanner />
          <GA4SessionSourceTable />
        </section>
        <LeadMagnetFunnelTab deals={sampleDeals} />
      </div>
    </div>
  )
}

export default App
