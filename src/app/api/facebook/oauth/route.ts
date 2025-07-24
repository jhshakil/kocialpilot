/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appId");

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    const redirectUri = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/facebook/callback`;
    const scope =
      "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish";

    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=code`;

    return NextResponse.json({
      success: true,
      oauthUrl,
      redirectUri,
    });
  } catch (error: any) {
    console.error("OAuth URL generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate OAuth URL" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, appId, appSecret } = await request.json();

    if (!code || !appId || !appSecret) {
      return NextResponse.json(
        { error: "Authorization code, App ID, and App Secret are required" },
        { status: 400 }
      );
    }

    const redirectUri = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/facebook/callback`;

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${appSecret}&code=${code}`,
      {
        method: "GET",
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(
        error.error?.message || "Failed to exchange code for token"
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }
    const userData = await userResponse.json();

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${accessToken}`
    );

    let pageData = null;
    let instagramData = null;

    if (pagesResponse.ok) {
      const pagesResult = await pagesResponse.json();
      const validPages =
        pagesResult.data?.filter(
          (page: any) => page.tasks && page.tasks.includes("MANAGE")
        ) || [];

      if (validPages.length > 0) {
        pageData = validPages[0];

        try {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageData.id}?fields=instagram_business_account{id,username}&access_token=${pageData.access_token}`
          );

          if (instagramResponse.ok) {
            const instagramResult = await instagramResponse.json();
            if (instagramResult.instagram_business_account) {
              instagramData = instagramResult.instagram_business_account;
            }
          }
        } catch (error) {
          console.log("Instagram not connected:", error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: userData,
      userName: userData.name,
      userId: userData.id,
      userAccessToken: accessToken,
      pageId: pageData?.id,
      pageName: pageData?.name,
      pageAccessToken: pageData?.access_token,
      instagramAccountId: instagramData?.id,
      instagramUsername: instagramData?.username,
    });
  } catch (error: any) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to exchange authorization code" },
      { status: 500 }
    );
  }
}
