/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userAccessToken, pageAccessToken, pageId, instagramAccountId } =
      await request.json();

    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`
    );
    if (!userResponse.ok) {
      throw new Error("Facebook user access failed");
    }

    if (pageId && pageAccessToken) {
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?access_token=${pageAccessToken}`
      );
      if (!pageResponse.ok) {
        throw new Error("Facebook page access failed");
      }
    }

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
