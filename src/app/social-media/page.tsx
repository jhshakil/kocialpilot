"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Loader2,
  Plus,
} from "lucide-react";

type PlatformField = {
  key: string;
  label: string;
  type: "text" | "password" | "textarea";
  required: boolean;
};

type PlatformConfig = {
  id: string;
  name: string;
  description: string;
  fields: PlatformField[];
  storageKey: string;
  apiEndpoint: string;
  testEndpoint: string;
};

interface Connection {
  status: "connected" | "disconnected" | "error";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
  error?: string;
  connectedAt?: string;
}

const PLATFORMS = {
  facebook: {
    id: "facebook",
    name: "Facebook & Instagram",
    description: "Connect Facebook Page with Instagram Business",
    fields: [
      { key: "appId", label: "App ID", type: "text", required: true },
      {
        key: "appSecret",
        label: "App Secret",
        type: "password",
        required: true,
      },
      {
        key: "accessToken",
        label: "Access Token",
        type: "textarea",
        required: true,
      },
    ],
    storageKey: "kocialpilot_fb_ig_connections",
    apiEndpoint: "/api/facebook/connect",
    testEndpoint: "/api/facebook/test",
  },
} as const satisfies Record<string, PlatformConfig>;

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function SocialMediaPage() {
  const [connections, setConnections] = useState<Record<string, Connection>>(
    {}
  );
  const [formData, setFormData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadedConnections: Record<string, Connection> = {};
    const loadedFormData: Record<string, Record<string, string>> = {};

    Object.values(PLATFORMS).forEach((platform) => {
      try {
        const stored = localStorage.getItem(platform.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          loadedConnections[platform.id] = {
            status: data.status || "disconnected",
            data,
            connectedAt: data.connectedAt,
          };
          loadedFormData[platform.id] = {};
          platform.fields.forEach((field) => {
            loadedFormData[platform.id][field.key] = data[field.key] || "";
          });
        } else {
          loadedConnections[platform.id] = { status: "disconnected" };
          loadedFormData[platform.id] = {};
        }
      } catch (err) {
        console.error(`Failed to load ${platform.id} connection:`, err);
      }
    });

    setConnections(loadedConnections);
    setFormData(loadedFormData);
  }, []);

  const handleInputChange = (
    platformId: string,
    key: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [platformId]: { ...prev[platformId], [key]: value },
    }));
  };

  const handleConnect = async (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    if (!platform) return;

    const missing = platform.fields.filter(
      (f) => f.required && !formData[platformId]?.[f.key]?.trim()
    );

    if (missing.length) {
      toast.error(`Missing: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setLoading((prev) => ({ ...prev, [platformId]: true }));

    try {
      const res = await fetch(platform.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData[platformId]),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Connection failed");

      const connectionData = {
        ...formData[platformId],
        ...result,
        status: "connected",
        connectedAt: new Date().toISOString(),
      };

      localStorage.setItem(platform.storageKey, JSON.stringify(connectionData));

      setConnections((prev) => ({
        ...prev,
        [platformId]: {
          status: "connected",
          data: connectionData,
          connectedAt: connectionData.connectedAt,
        },
      }));

      toast.success(`Connected to ${platform.name}!`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setConnections((prev) => ({
        ...prev,
        [platformId]: { status: "error", error: err.message },
      }));
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const handleTest = async (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    const connection = connections[platformId];
    if (!platform || !connection.data) return;

    setLoading((prev) => ({ ...prev, [`${platformId}_test`]: true }));

    try {
      const res = await fetch(platform.testEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connection.data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Test failed");

      toast.success(`${platform.name} connection is working!`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [`${platformId}_test`]: false }));
    }
  };

  const handleDisconnect = (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    if (!platform) return;

    localStorage.removeItem(platform.storageKey);

    setConnections((prev) => ({
      ...prev,
      [platformId]: { status: "disconnected" },
    }));
    setFormData((prev) => ({ ...prev, [platformId]: {} }));

    toast.success(`Disconnected from ${platform.name}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-500" aria-hidden />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" aria-hidden />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" aria-hidden />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Social Media Integration
        </h1>
        <p className="text-gray-600 mt-2">
          Connect your social media accounts for automated posting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(PLATFORMS).map((platform) => {
          const connection = connections[platform.id] || {
            status: "disconnected",
          };
          const isConnected = connection.status === "connected";
          const isLoading = loading[platform.id];
          const isTestLoading = loading[`${platform.id}_test`];

          return (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-sm text-gray-500">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(connection.status)}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(connection.status)}
                  {connection.connectedAt && (
                    <span className="text-xs text-gray-500">
                      {formatDate(connection.connectedAt)}
                    </span>
                  )}
                </div>

                {connection.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{connection.error}</p>
                  </div>
                )}

                {!isConnected && (
                  <div className="space-y-3">
                    {platform.fields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={`${platform.id}-${field.key}`}>
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {field.type === "textarea" ? (
                          <textarea
                            id={`${platform.id}-${field.key}`}
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                            value={formData[platform.id]?.[field.key] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                platform.id,
                                field.key,
                                e.target.value
                              )
                            }
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                            rows={3}
                          />
                        ) : (
                          <Input
                            id={`${platform.id}-${field.key}`}
                            type={field.type}
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                            value={formData[platform.id]?.[field.key] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                platform.id,
                                field.key,
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  </div>
                )}

                {isConnected && (
                  <div className="space-y-3">
                    {connection.data?.userName && (
                      <div>
                        <p className="text-sm font-medium">
                          Connected as: {connection.data.userName}
                        </p>
                        {connection.data?.pageName && (
                          <p className="text-xs text-gray-500">
                            Page: {connection.data.pageName}
                          </p>
                        )}
                        {connection.data?.instagramUsername && (
                          <p className="text-xs text-gray-500">
                            Instagram: @{connection.data.instagramUsername}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleTest(platform.id)}
                        disabled={isTestLoading}
                        size="sm"
                        variant="outline"
                      >
                        {isTestLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Settings className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                      <Button
                        onClick={() => handleDisconnect(platform.id)}
                        size="sm"
                        variant="destructive"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">More platforms coming soon...</p>
            <p className="text-xs">Twitter, LinkedIn, TikTok, and more</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
