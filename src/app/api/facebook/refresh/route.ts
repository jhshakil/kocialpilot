/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { appId, appSecret, userAccessToken } = await request.json();

    if (!appId || !appSecret || !userAccessToken) {
      return NextResponse.json(
        { error: "App ID, App Secret, and current access token are required" },
        { status: 400 }
      );
    }

    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userAccessToken}`,
      {
        method: "GET",
      }
    );

    if (!longLivedTokenResponse.ok) {
      const error = await longLivedTokenResponse.json();
      throw new Error(error.error?.message || "Failed to refresh token");
    }

    const tokenData = await longLivedTokenResponse.json();
    const newAccessToken = tokenData.access_token;

    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${newAccessToken}`
    );
    if (!userResponse.ok) {
      throw new Error("Failed to get user info with new token");
    }
    const userData = await userResponse.json();

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${newAccessToken}`
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
      userAccessToken: newAccessToken,
      pageId: pageData?.id,
      pageName: pageData?.name,
      pageAccessToken: pageData?.access_token,
      instagramAccountId: instagramData?.id,
      instagramUsername: instagramData?.username,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh token" },
      { status: 500 }
    );
  }
}
