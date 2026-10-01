import { Img } from './Img'

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => <Img key={i} id={i <= n ? 'star-full' : 'star-empty'} className="star" />)}
    </span>
  )
}
