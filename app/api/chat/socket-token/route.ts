import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isSocketEnabled, getSocketUrl, signSocketToken } from "@/lib/chat/socket";

// A short-lived connect token for the standalone chat socket server. The client
// fetches this on every (re)connect, so tokens can stay short-lived.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSocketEnabled()) {
    // Realtime not configured — client should not attempt to connect.
    return NextResponse.json({ enabled: false });
  }

  const token = signSocketToken(session.user.id);
  if (!token) return NextResponse.json({ enabled: false });

  return NextResponse.json({ enabled: true, url: getSocketUrl(), token });
}
