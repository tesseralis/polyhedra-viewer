export type PrismaticType = "prism" | "antiprism"
export const prismaticTypes: PrismaticType[] = ["prism", "antiprism"]

export type Count = 0 | 1 | 2 | 3
export const counts: Count[] = [0, 1, 2, 3]

export type DataOptions<Data extends {}> = {
  [Datum in keyof Required<Data>]: Required<Data>[Datum][]
}
