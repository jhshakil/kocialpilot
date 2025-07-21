/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

// Constants
const POSTS_STORAGE_KEY = "kocialpilot_posts";

// Dynamic platform config (storage + connection shape + single POST endpoint)
const PLATFORM_CONFIG = {
  facebook: {
    storageKey: "kocialpilot_fb_ig_connections",
    mapConnection: (c: any) => ({
      pageId: c.pageId,
      pageAccessToken: c.pageAccessToken,
    }),
  },
  instagram: {
    storageKey: "kocialpilot_fb_ig_connections",
    mapConnection: (c: any) => ({
      instagramAccountId: c.instagramAccountId,
      pageAccessToken: c.pageAccessToken,
    }),
  },
  // Add more platforms here...
  // twitter: { storageKey: "...", mapConnection: (c) => ({ ... }) },
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

const BackgroundScheduler = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(checkAndPublishPosts, 60_000);
    checkAndPublishPosts();
    return () => clearInterval(interval);
  }, []);

  const getConnectionForPlatform = (platform: string): any | null => {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    if (!config) return null;

    const stored = localStorage.getItem(config.storageKey);
    if (!stored) return null;

    const conn = JSON.parse(stored);
    if (conn?.status !== "connected") return null;

    return config.mapConnection(conn);
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
    const successPlatforms: string[] = [];

    try {
      for (const platform of post.platform) {
        const connection = getConnectionForPlatform(platform);
        if (!connection) {
          console.warn(`No valid connection for ${platform}`);
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
              connectionData: connection,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to post to ${platform}`);
          }

          const result = await res.json();

          if (result.success) {
            hasSuccess = true;
            successPlatforms.push(platform);
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
        toast.success(`Published to: ${successPlatforms.join(", ")}`);
      }

      if (hasError && !hasSuccess) {
        toast.error(`Failed to publish to all platforms.`);
      }
    } catch (err) {
      console.error("Error publishing:", err);
      const idx = allPosts.findIndex((p) => p.id === post.id);
      if (idx !== -1) {
        allPosts[idx].status = "failed";
        postUpdated = true;
      }
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    if (postUpdated) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(allPosts));
    }
  };

  return null;
};

export default BackgroundScheduler;
