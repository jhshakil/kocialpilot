/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, pageAccessToken, pageId, instagramAccountId } =
      await request.json();

    // Test Facebook user access
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    if (!userResponse.ok) {
      throw new Error("Facebook user access failed");
    }

    // Test Facebook page access if available
    if (pageId && pageAccessToken) {
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?access_token=${pageAccessToken}`
      );
      if (!pageResponse.ok) {
        throw new Error("Facebook page access failed");
      }
    }

    // Test Instagram access if available
    if (instagramAccountId && pageAccessToken) {
      const instagramResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username&access_token=${pageAccessToken}`
      );
      if (!instagramResponse.ok) {
        throw new Error("Instagram access failed");
      }
    }

    return NextResponse.json({
      success: true,
      message: "All connections are working properly",
    });
  } catch (error: any) {
    console.error("Connection test error:", error);
    return NextResponse.json(
      { error: error.message || "Connection test failed" },
      { status: 500 }
    );
  }
}
