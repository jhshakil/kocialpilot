"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, PenTool } from "lucide-react";
import { TGeneratedContent } from "@/types";
import ImageUploader from "@/components/tools/image-uploader";
import ScheduleSection from "@/components/tools/schedule-section";
import AIAssistant from "@/components/tools/ai-assistant";

const POSTS_STORAGE_KEY = "kocialpilot_posts";

type StoredPost = {
  id: string;
  content: string;
  date: string;
  time: string;
  platform: string[];
  status: "scheduled" | "published" | "failed";
  images: string[];
  createdAt: string;
};

const savePostToStorage = (post: StoredPost) => {
  const existingPosts = getPostsFromStorage();
  localStorage.setItem(
    POSTS_STORAGE_KEY,
    JSON.stringify([...existingPosts, post])
  );
};

const getPostsFromStorage = (): StoredPost[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(POSTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const CreatePostPage = () => {
  const [postState, setPostState] = useState({
    content: "",
    prompt: "",
    isGenerating: false,
    generatedContent: null as TGeneratedContent | null,
    uploadedImages: [] as string[],
    scheduleDate: "",
    scheduleTime: "",
  });

  const handleGenerateContent = async () => {
    setPostState((prev) => ({ ...prev, isGenerating: true }));
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            postState.prompt.trim() ||
            postState.content ||
            "Create an engaging social media post about technology and innovation",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate content");
      const data = await res.json();

      setPostState((prev) => ({
        ...prev,
        generatedContent: data,
      }));

      toast.success("Content Generated!", {
        description: "AI has generated your content.",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Error", {
        description: "Failed to generate content.",
      });
    } finally {
      setPostState((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  const handleGenerateImage = async () => {
    setPostState((prev) => ({ ...prev, isGenerating: true }));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            postState.generatedContent?.caption ||
            postState.content ||
            "A modern social media image",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate image");
      const data = await res.json();

      setPostState((prev) => ({
        ...prev,
        generatedContent: prev.generatedContent
          ? { ...prev.generatedContent, imageUrl: data.imageUrl }
          : null,
      }));

      toast.success("Image Generated!", {
        description: "AI has generated your image.",
      });
    } catch {
      toast.error("Error", {
        description: "Failed to generate image.",
      });
    } finally {
      setPostState((prev) => ({ ...prev, isGenerating: false }));
    }
  };

  const handleInsertGenerated = () => {
    setPostState((prev) => {
      if (!prev.generatedContent) return prev;

      return {
        ...prev,
        content: prev.generatedContent.caption,
        uploadedImages: prev.generatedContent.imageUrl
          ? [...prev.uploadedImages, prev.generatedContent.imageUrl]
          : prev.uploadedImages,
      };
    });

    toast.success("Inserted!", {
      description: "Generated content added to editor.",
    });
  };

  const handleSchedulePost = () => {
    const { content, scheduleDate, scheduleTime, uploadedImages } = postState;

    if (!content.trim()) {
      toast.error("Please add content.");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select date and time.");
      return;
    }

    const newPost: StoredPost = {
      id: Date.now().toString(),
      content,
      date: scheduleDate,
      time: scheduleTime,
      platform: ["Facebook", "Instagram"],
      status: "scheduled",
      images: uploadedImages,
      createdAt: new Date().toISOString(),
    };

    savePostToStorage(newPost);

    toast.success("Post Scheduled!", {
      description: `Scheduled for ${scheduleDate} at ${scheduleTime}.`,
    });

    setPostState({
      content: "",
      prompt: "",
      isGenerating: false,
      generatedContent: null,
      uploadedImages: [],
      scheduleDate: "",
      scheduleTime: "",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Post</h1>
        <p className="text-gray-600 mt-2">
          Create and schedule your social media content with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Content Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content">Post Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your content..."
                  value={postState.content}
                  onChange={(e) =>
                    setPostState((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  rows={6}
                  className="mt-3"
                />
              </div>

              {/* Image Uploader */}
              <ImageUploader
                images={postState.uploadedImages}
                onUpload={(newImages) =>
                  setPostState((prev) => ({
                    ...prev,
                    uploadedImages: [...prev.uploadedImages, ...newImages],
                  }))
                }
                onRemove={(index) =>
                  setPostState((prev) => ({
                    ...prev,
                    uploadedImages: prev.uploadedImages.filter(
                      (_, i) => i !== index
                    ),
                  }))
                }
              />

              {/* Schedule */}
              <ScheduleSection
                date={postState.scheduleDate}
                time={postState.scheduleTime}
                onDateChange={(date) =>
                  setPostState((prev) => ({ ...prev, scheduleDate: date }))
                }
                onTimeChange={(time) =>
                  setPostState((prev) => ({ ...prev, scheduleTime: time }))
                }
              />

              <Button onClick={handleSchedulePost} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant */}
        <AIAssistant
          isGenerating={postState.isGenerating}
          generatedContent={postState.generatedContent}
          prompt={postState.prompt}
          onPromptChange={(value) =>
            setPostState((prev) => ({ ...prev, prompt: value }))
          }
          onGenerateContent={handleGenerateContent}
          onGenerateImage={handleGenerateImage}
          onInsert={handleInsertGenerated}
        />
      </div>
    </div>
  );
};

export default CreatePostPage;
