/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { content, imageUrl, platform, connectionData } =
      await request.json();

    if (!content || !platform || !connectionData) {
      return NextResponse.json(
        { error: "Content, platform, and connection data are required" },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (platform.toLowerCase()) {
      case "facebook":
        result = await postToFacebook(content, imageUrl, connectionData);
        break;
      case "instagram":
        result = await postToInstagram(content, imageUrl, connectionData);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      platform,
      postId: result.id,
      result,
    });
  } catch (error: any) {
    console.error("Posting error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create post" },
      { status: 500 }
    );
  }
}

async function postToFacebook(
  content: string,
  imageUrl: string | null,
  connectionData: any
) {
  const { pageId, pageAccessToken } = connectionData;

  if (!pageId || !pageAccessToken) {
    throw new Error("Facebook page ID and access token are required");
  }

  const endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;

  const postData: any = {
    message: content,
    access_token: pageAccessToken,
  };

  if (imageUrl) {
    if (imageUrl.startsWith("http")) {
      postData.link = imageUrl;
    } else {
      postData.message = `${content}\n\n[Image would be uploaded in production]`;
    }
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to post to Facebook");
  }

  return await response.json();
}

async function postToInstagram(
  content: string,
  imageUrl: string | null,
  connectionData: any
) {
  const { instagramAccountId, pageAccessToken } = connectionData;

  if (!instagramAccountId || !pageAccessToken) {
    throw new Error("Instagram account ID and page access token are required");
  }

  if (!imageUrl) {
    throw new Error("Instagram posts require an image");
  }

  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: pageAccessToken,
      }),
    }
  );

  if (!containerResponse.ok) {
    const error = await containerResponse.json();
    throw new Error(
      error.error?.message || "Failed to create Instagram media container"
    );
  }

  const containerData = await containerResponse.json();
  const creationId = containerData.id;

  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(error.error?.message || "Failed to publish Instagram post");
  }

  return await publishResponse.json();
}
