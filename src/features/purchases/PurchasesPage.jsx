import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function PurchasesPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
          <p className="text-sm text-[#707070] mt-0.5">Buy raw materials and packaging</p>
        </div>
        <Link to="/purchases/new"><Button><Plus className="w-4 h-4" /> New purchase</Button></Link>
      </div>
      <Card className="text-center py-12">
        <p className="text-[#707070]">Use + New purchase for the guided flow.</p>
      </Card>
    </div>
  )
}
