"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

// Storage keys
const POSTS_STORAGE_KEY = "kocialpilot_posts";

const PLATFORM_STORAGE_KEYS = {
  facebook: "kocialpilot_fb_ig_connections",
  instagram: "kocialpilot_fb_ig_connections",
  // twitter: "kocialpilot_twitter_connection",
  // linkedin: "kocialpilot_linkedin_connection",
};

type ScheduledPost = {
  id: string;
  content: string;
  date: string;
  time: string;
  platform: string[];
  status: "scheduled" | "published" | "failed";
  images: string[];
  createdAt: string;
};

type PlatformConnection = {
  status: string;
  [key: string]: unknown;
};

export function BackgroundScheduler() {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(checkAndPublishPosts, 60_000);
    checkAndPublishPosts();

    return () => clearInterval(interval);
  }, []);

  const getConnectionForPlatform = (
    platform: string
  ): PlatformConnection | null => {
    const storageKey =
      PLATFORM_STORAGE_KEYS[platform as keyof typeof PLATFORM_STORAGE_KEYS];
    if (!storageKey) return null;

    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;

    const conn: PlatformConnection = JSON.parse(stored);
    return conn.status === "connected" ? conn : null;
  };

  const checkAndPublishPosts = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const posts: ScheduledPost[] = JSON.parse(
        localStorage.getItem(POSTS_STORAGE_KEY) || "[]"
      );
      const now = new Date();

      const postsToPublish = posts.filter((post) => {
        if (post.status !== "scheduled") return false;

        const postTime = new Date(`${post.date}T${post.time}:00`);
        const diff = now.getTime() - postTime.getTime();
        return postTime <= now && diff < 120_000;
      });

      for (const post of postsToPublish) {
        await publishPost(post);
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const publishPost = async (post: ScheduledPost) => {
    const allPosts: ScheduledPost[] = JSON.parse(
      localStorage.getItem(POSTS_STORAGE_KEY) || "[]"
    );
    let postUpdated = false;
    let hasSuccess = false;
    let hasError = false;
    const publishedPlatforms: string[] = [];

    for (const platform of post.platform) {
      const connection = getConnectionForPlatform(platform);

      if (!connection) {
        console.warn(`No connection for ${platform}`);
        hasError = true;
        continue;
      }

      let connectionData: Record<string, unknown> = {};

      switch (platform.toLowerCase()) {
        case "facebook":
          connectionData = {
            pageId: connection.pageId,
            pageAccessToken: connection.pageAccessToken,
          };
          break;
        case "instagram":
          connectionData = {
            instagramAccountId: connection.instagramAccountId,
            pageAccessToken: connection.pageAccessToken,
          };
          break;
        // Add more platforms here!
        default:
          console.warn(`Unsupported platform: ${platform}`);
          hasError = true;
          continue;
      }

      try {
        const res = await fetch(`/api/social-media/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: post.content,
            imageUrl: post.images[0] || null,
            platform,
            connectionData,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to post to ${platform}`);
        }

        const result = await res.json();

        if (result.success) {
          hasSuccess = true;
          publishedPlatforms.push(platform);
          console.log(`✅ Posted to ${platform}:`, result.postId);
        }
      } catch (err) {
        console.error(`❌ Error posting to ${platform}:`, err);
        hasError = true;
      }
    }

    const idx = allPosts.findIndex((p) => p.id === post.id);
    if (idx !== -1) {
      if (hasSuccess) {
        allPosts[idx].status = "published";
      } else {
        allPosts[idx].status = "failed";
      }
      postUpdated = true;
    }

    if (hasSuccess) {
      toast.success(`Published to: ${publishedPlatforms.join(", ")}`);
    }

    if (hasError && !hasSuccess) {
      toast.error("Failed to publish to any platform. Check connections.");
    }

    if (postUpdated) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
    }
  };

  return null;
}
