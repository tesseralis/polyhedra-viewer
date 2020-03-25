export type PrismaticType = "prism" | "antiprism"
export const prismaticTypes: PrismaticType[] = ["prism", "antiprism"]

export type DataOptions<Data extends {}> = {
  [Datum in keyof Required<Data>]: Required<Data>[Datum][]
}
