import { Items } from "types"
export const prismaticTypes = ["prism", "antiprism"] as const
export type PrismaticType = Items<typeof prismaticTypes>
