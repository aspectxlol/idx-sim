import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"

export interface User {
  id: string
  email: string
  full_name: string
  virtual_balance: number
  api_key?: string
}

export interface JWTPayload {
  userId: string
  email: string
  type: "web" | "api"
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function generateApiKey(): string {
  return "idx_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, virtual_balance, api_key")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, virtual_balance, api_key, password_hash")
    .eq("email", email)
    .single()

  if (error || !data) return null
  return data
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, virtual_balance, api_key")
    .eq("api_key", apiKey)
    .single()

  if (error || !data) return null
  return data
}
