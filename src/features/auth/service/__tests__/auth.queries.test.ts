import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCurrent } from "../auth.queries"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/hono-jwt"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models"

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))
vi.mock("@/lib/hono-jwt", () => ({
  verifyAccessToken: vi.fn(),
}))
vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: vi.fn(),
}))
vi.mock("@/models", () => ({
  User: { findById: vi.fn() },
}))


// 参考 auth.service.test.ts 的 mock 方式，构造 next/headers cookies 的 mock store
function createMockCookieStore(token?: string) {
  return {
    get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
    getAll: vi.fn(),
    has: vi.fn(),
    size: 1,
    set: vi.fn(),
    delete: vi.fn(),
    [Symbol.iterator]: function* () {},
  }
}

const mockCookies = vi.mocked(cookies)
const mockVerify = vi.mocked(verifyAccessToken)
const mockConnect = vi.mocked(connectToDatabase)
const mockUser = vi.mocked(User)

describe("getCurrent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })


  it("returns null if no cookie", async () => {
    mockCookies.mockResolvedValue(createMockCookieStore(undefined))
    const result = await getCurrent()
    expect(result).toBeNull()
  })

  it("returns null if token invalid", async () => {
    mockCookies.mockResolvedValue(createMockCookieStore("token"))
    mockVerify.mockResolvedValue(null)
    const result = await getCurrent()
    expect(result).toBeNull()
  })

  it("returns null if user not found", async () => {
    mockCookies.mockResolvedValue(createMockCookieStore("token"))
    mockVerify.mockResolvedValue({ userId: "uid", jti: "jti" })
    mockConnect.mockResolvedValue({} as any)
    mockUser.findById.mockResolvedValue(null)
    const result = await getCurrent()
    expect(result).toBeNull()
  })

  it("returns user if all valid", async () => {
    const user = { _id: "u", name: "n", email: "e" }
    mockCookies.mockResolvedValue(createMockCookieStore("token"))
    mockVerify.mockResolvedValue({ userId: "uid", jti: "jti" })
    mockConnect.mockResolvedValue({} as any)
    mockUser.findById.mockResolvedValue(user)
    const result = await getCurrent()
    expect(result).toBe(user)
  })

  it("returns null on error", async () => {
    mockCookies.mockImplementation(() => { throw new Error("fail") })
    const result = await getCurrent()
    expect(result).toBeNull()
  })
})
