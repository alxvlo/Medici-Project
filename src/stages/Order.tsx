import type { Level } from '../data/schema'
import { Img } from '../ui/Img'
import { OrderCard } from '../ui/OrderCard'

export function Order({ level, onComplete }: { level: Level; onComplete: () => void }) {
  return (
    <div className="screen order">
      <Img id="bg-reception" className="bg" />
      <OrderCard level={level} />
      <button className="btn next" onClick={onComplete}>Dock the order</button>
    </div>
  )
}
