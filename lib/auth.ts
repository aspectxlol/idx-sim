import { SignJWT, jwtVerify } from "jose"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function generateJWT(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(email: string, password: string, name: string) {
  const hashedPassword = await hashPassword(password)

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      password_hash: hashedPassword,
      name,
      virtual_balance: 1000000, // 1M IDR starting balance
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function authenticateUser(email: string, password: string) {
  const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error || !user) return null

  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) return null

  return user
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, virtual_balance, api_key, created_at")
    .eq("id", userId)
    .single()

  if (error) return null
  return data
}
