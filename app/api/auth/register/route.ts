import { type NextRequest, NextResponse } from "next/server"
import { hashPassword, generateJWT, generateApiKey } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and generate API key
    const passwordHash = await hashPassword(password)
    const apiKey = generateApiKey()

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        full_name,
        virtual_balance: 1000000, // 1M IDR
        api_key: apiKey,
      })
      .select("id, email, full_name, virtual_balance, api_key")
      .single()

    if (error || !newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Generate JWT
    const token = await generateJWT({
      userId: newUser.id,
      email: newUser.email,
      type: "web",
    })

    return NextResponse.json({
      message: "User created successfully",
      user: newUser,
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
