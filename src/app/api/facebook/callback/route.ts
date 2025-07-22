/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      // Redirect to social media page with error
      return NextResponse.redirect(
        new URL(`/social-media?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/social-media?error=No authorization code received",
          request.url
        )
      );
    }

    // Redirect to social media page with the authorization code
    return NextResponse.redirect(
      new URL(`/social-media?code=${encodeURIComponent(code)}`, request.url)
    );
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/social-media?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}
