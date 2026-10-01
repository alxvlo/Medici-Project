import { z } from 'zod'

const text = z.string().min(1)
const awaiting = text.nullable() // null = not in the case database yet; rendered "Awaiting client"

const Dial = z
  .strictObject({ target: z.number(), tolerance: z.number().nonnegative(), min: z.number(), max: z.number(), step: z.number().positive() })
  .refine((d) => d.min <= d.target && d.target <= d.max, { message: 'target outside dial range' })

const Option = z.strictObject({ image: text, label: text, correct: z.boolean(), why: awaiting })

/** Strict objects throughout, so a level still carrying a retired block (assess, position.hint, expose) fails. */
export const LevelSchema = z.strictObject({
  id: z.number().int().min(1).max(20),
  title: text,
  section: z.enum(['chest', 'upper-ext', 'lower-ext', 'abdomen', 'skull', 'refresher']),
  draft: z.boolean(),
  patient: z.strictObject({
    sprite: text, name: text, age: z.number().int().nonnegative(), sex: z.enum(['Male', 'Female']),
    habitus: text, dob: text, patientId: text, admitted: text, line: awaiting,
  }),
  order: z.strictObject({
    complaint: text, history: awaiting, diagnosis: text, exam: text, requested: text, mission: text, structures: awaiting,
  }),
  findings: awaiting,
  position: z.strictObject({
    options: z.array(Option).length(3).refine((os) => os.filter((o) => o.correct).length === 1, {
      message: 'exactly one option must be correct',
    }),
  }),
  technique: z.strictObject({ kvp: Dial, mas: Dial, note: awaiting, wrongKvp: awaiting, wrongMas: awaiting }),
  collimate: z.strictObject({
    instruction: text,
    target: z.strictObject({ w: z.number().min(1).max(100), h: z.number().min(1).max(100) }),
    tolerance: z.number().nonnegative(),
  }),
  films: z.strictObject({ slug: z.string().regex(/^[a-z]+$/), underNote: awaiting, overNote: awaiting }),
  timers: z.strictObject({ position: z.number().int().positive(), technique: z.number().int().positive() }),
})

export type Level = z.infer<typeof LevelSchema>
