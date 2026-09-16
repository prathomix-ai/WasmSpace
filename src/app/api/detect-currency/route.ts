import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    // Check standard edge/CDN geolocation headers
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      req.headers.get("cloudfront-viewer-country") ||
      req.headers.get("x-appengine-country") ||
      null;

    const normalizedCountry = country ? country.toUpperCase().trim() : null;
    const isIndia = normalizedCountry === "IN";
    const currency = isIndia ? "INR" : "USD";

    return NextResponse.json({
      country: normalizedCountry,
      isIndia,
      currency,
    });
  } catch (error: any) {
    return NextResponse.json(
      { country: null, isIndia: false, currency: "USD" },
      { status: 200 }
    );
  }
}
