import { NextRequest, NextResponse } from "next/server";
import { verifyLicenseKey } from "@/lib/saas/subscription";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";

  const result = verifyLicenseKey(key);

  if (!result.valid) {
    return NextResponse.json({
      valid: false,
      error: result.message,
    }, { status: 403 });
  }

  return NextResponse.json({
    valid: true,
    tier: result.tier,
    message: result.message,
    timestamp: Date.now(),
    features: {
      autoMt5Execute: result.tier === "VIP",
      unlimitedAccounts: result.tier === "VIP",
      aiWarRoom: result.tier === "VIP",
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body.key || body.licenseKey || "";

    const result = verifyLicenseKey(key);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.message,
      }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      tier: result.tier,
      message: result.message,
      timestamp: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 });
  }
}
