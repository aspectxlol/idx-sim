import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate new API key
    const apiKey = `idx_${randomBytes(32).toString("hex")}`

    // Update user's API key
    const { error } = await supabase.from("users").update({ api_key: apiKey }).eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 })
    }

    return NextResponse.json({
      message: "API key generated successfully",
      api_key: apiKey,
    })
  } catch (error) {
    console.error("API key generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Revoke API key
    const { error } = await supabase.from("users").update({ api_key: null }).eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 })
    }

    return NextResponse.json({
      message: "API key revoked successfully",
    })
  } catch (error) {
    console.error("API key revocation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current API key
    const { data: user, error } = await supabase.from("users").select("api_key").eq("id", userId).single()

    if (error) {
      return NextResponse.json({ error: "Failed to fetch API key" }, { status: 500 })
    }

    return NextResponse.json({
      api_key: user.api_key,
      has_key: !!user.api_key,
    })
  } catch (error) {
    console.error("API key fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
