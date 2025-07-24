import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "system",
              content:
                'You are a social media content creator. Generate engaging social media posts with relevant hashtags. Return your response in JSON format with "caption" and "hashtags" fields. The hashtags should be an array of strings without the # symbol.',
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate content");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      const parsedContent = JSON.parse(content);
      return NextResponse.json(parsedContent);
    } catch {
      const lines = content.split("\n").filter((line: string) => line.trim());
      const caption = lines[0] || content;
      const hashtags = content
        .match(/#\w+/g)
        ?.map((tag: string) => tag.slice(1)) || [
        "socialmedia",
        "content",
        "ai",
      ];

      return NextResponse.json({
        caption,
        hashtags,
      });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
