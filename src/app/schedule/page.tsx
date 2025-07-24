"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, ImageIcon, Trash2, CalendarDays } from "lucide-react";
import Image from "next/image";

const POSTS_STORAGE_KEY = "kocialpilot_posts";

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

const getPostsFromStorage = (): ScheduledPost[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(POSTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const savePostsToStorage = (posts: ScheduledPost[]) => {
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
};

const updateOrDeletePost = (
  posts: ScheduledPost[],
  postId: string,
  updatedPost?: ScheduledPost
): ScheduledPost[] => {
  let newPosts;
  if (updatedPost) {
    newPosts = posts.map((post) => (post.id === postId ? updatedPost : post));
  } else {
    newPosts = posts.filter((post) => post.id !== postId);
  }
  savePostsToStorage(newPosts);
  return newPosts;
};

const SchedulePage = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [range, setRange] = useState<{
    startDate: string;
    endDate: string;
  }>({ startDate: "", endDate: "" });

  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + 6);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setRange({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
    setPosts(getPostsFromStorage());
  }, []);

  const handleDragStart = (postId: string) => setDraggedPostId(postId);

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    if (!draggedPostId) return;

    const updated = posts.find((p) => p.id === draggedPostId);
    if (!updated) return;

    const modifiedPost = { ...updated, date };
    const newPosts = updateOrDeletePost(posts, draggedPostId, modifiedPost);
    setPosts(newPosts);
    setDraggedPostId(null);
  };

  const deletePost = (postId: string) => {
    const newPosts = updateOrDeletePost(posts, postId);
    setPosts(newPosts);
  };

  const dateRange = useMemo(() => {
    const dates = [];
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }
    return dates;
  }, [range.startDate, range.endDate]);

  const filteredPosts = useMemo(
    () =>
      posts.filter((p) => p.date >= range.startDate && p.date <= range.endDate),
    [posts, range]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "published":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Schedule Overview
        </h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Manage and organize your scheduled social media posts
        </p>
      </div>

      {/* Date Range Filter  */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col w-full">
              <Label htmlFor="start-date" className="text-sm md:text-base">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={range.startDate}
                className="mt-2 w-full"
                onChange={(e) =>
                  setRange((r) => ({ ...r, startDate: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col w-full">
              <Label htmlFor="end-date" className="text-sm md:text-base">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={range.endDate}
                className="mt-2 w-full"
                onChange={(e) =>
                  setRange((r) => ({ ...r, endDate: e.target.value }))
                }
              />
            </div>

            <div className="flex w-full">
              <Button
                onClick={() => {
                  const today = new Date();
                  const nextWeek = new Date();
                  nextWeek.setDate(today.getDate() + 7);
                  setRange({
                    startDate: today.toISOString().split("T")[0],
                    endDate: nextWeek.toISOString().split("T")[0],
                  });
                }}
                variant="outline"
                className="w-full md:w-auto"
              >
                This Week
              </Button>
            </div>
          </div>

          <p className="mt-4 text-xs md:text-sm text-gray-600">
            Showing {filteredPosts.length} posts from {range.startDate} to{" "}
            {range.endDate}
          </p>
        </CardContent>
      </Card>

      {/* Calender View  */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 inline-block mr-1" />{" "}
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-2 md:gap-4 min-w-full"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
            }}
          >
            {dateRange.map((date) => {
              const dayPosts = posts.filter((p) => p.date === date);
              const dayName = new Date(date).toLocaleDateString("en-US", {
                weekday: "short",
              });

              return (
                <div
                  key={date}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, date)}
                  className="min-h-[150px] md:min-h-[200px] border rounded-lg p-2 md:p-3"
                >
                  <div className="text-center mb-2 md:mb-3">
                    <h3 className="font-medium text-xs md:text-sm">
                      {dayName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {new Date(date).getDate()}
                    </p>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={() => handleDragStart(post.id)}
                        className="p-2 bg-white border rounded shadow-sm cursor-move hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between mb-1">
                          <Badge
                            className={`text-xs ${getStatusColor(post.status)}`}
                          >
                            {post.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deletePost(post.id)}
                            className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-700 line-clamp-2 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.time}
                          </div>
                          {post.images.length > 0 && (
                            <ImageIcon className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {post.platform.map((platform) => (
                            <Badge
                              key={platform}
                              variant="outline"
                              className="text-xs"
                            >
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Post  */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            All Posts in Range ({filteredPosts.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">
                No posts found in the selected range.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg"
                >
                  {post.images.length > 0 && (
                    <div className="w-full md:w-32 flex-shrink-0">
                      <Image
                        width={128}
                        height={128}
                        src={post.images[0]}
                        alt="Post"
                        className="w-full h-48 md:h-32 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex-1 w-full">
                    <p className="text-sm text-gray-700 mb-2">{post.content}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {post.date}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.time}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge
                        className={`text-xs ${getStatusColor(post.status)}`}
                      >
                        {post.status}
                      </Badge>
                      {post.platform.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {post.images.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.images.length - 1} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 self-start md:self-center"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;
