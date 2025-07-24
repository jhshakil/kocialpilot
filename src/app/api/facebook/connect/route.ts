/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { appId, appSecret, accessToken } = await request.json();

    if (!appId || !appSecret || !accessToken) {
      return NextResponse.json(
        { error: "App ID, App Secret, and Access Token are required" },
        { status: 400 }
      );
    }

    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      const error = await userResponse.json();
      throw new Error(error.error?.message || "Invalid access token");
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
      pageId: pageData?.id,
      pageName: pageData?.name,
      pageAccessToken: pageData?.access_token,
      instagramAccountId: instagramData?.id,
      instagramUsername: instagramData?.username,
    });
  } catch (error: any) {
    console.error("Facebook connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to Facebook" },
      { status: 500 }
    );
  }
}
