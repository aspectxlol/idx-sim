import { type NextRequest, NextResponse } from "next/server"
import { generateApiKey } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    const newApiKey = generateApiKey()

    const { error } = await supabase.from("users").update({ api_key: newApiKey }).eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 })
    }

    return NextResponse.json({
      message: "API key generated successfully",
      api_key: newApiKey,
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
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

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
