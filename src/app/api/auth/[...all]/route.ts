import { auth } from "@/lib/auth/config"
import { toNextJsHandler } from "better-auth/nextjs"

const handler = toNextJsHandler(auth)

export const { GET, POST } = handler