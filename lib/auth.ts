"use server"

import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"
const encoder = new TextEncoder()
const secret = encoder.encode(JWT_SECRET)

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

export async function generateJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch {
    return null
  }
}

export function generateApiKey(): string {
  return "idx_" + Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15)
}

export async function getUserById(id: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, virtual_balance, api_key")
    .eq("id", id)
    .single()
  return data ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, virtual_balance, api_key, password_hash")
    .eq("email", email)
    .single()
  return data ?? null
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("id, email, full_name, virtual_balance, api_key")
    .eq("api_key", apiKey)
    .single()
  return data ?? null
}
