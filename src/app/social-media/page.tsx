/* eslint-disable @typescript-eslint/no-explicit-any */
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
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const PLATFORMS = {
  facebook: {
    id: "facebook",
    name: "Facebook & Instagram",
    description:
      "Connect Facebook page with Instagram Business account using OAuth",
    fields: [
      {
        key: "appId",
        label: "App ID",
        type: "text",
        required: true,
        placeholder: "Your Facebook App ID",
      },
      {
        key: "appSecret",
        label: "App Secret",
        type: "password",
        required: true,
        placeholder: "Your Facebook App Secret",
      },
    ],
    storageKey: "kocialpilot_fb_ig_connections",
    useOAuth: true,
  },
} as const;

type Connection = {
  status: "connected" | "disconnected" | "error";
  data?: Record<string, any>;
  error?: string;
  connectedAt?: string;
};

export default function SocialMediaPage() {
  const [connections, setConnections] = useState<Record<string, Connection>>(
    {}
  );
  const [formData, setFormData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [authCode, setAuthCode] = useState<string>("");

  useEffect(() => {
    const loadedConnections: Record<string, Connection> = {};
    const loadedFormData: Record<string, Record<string, string>> = {};

    Object.values(PLATFORMS).forEach((platform) => {
      const stored = localStorage.getItem(platform.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        loadedConnections[platform.id] = {
          status: data.status || "disconnected",
          data,
          connectedAt: data.connectedAt,
        };
        if (data.status === "connected") {
          loadedFormData[platform.id] = {};
          platform.fields.forEach((field) => {
            loadedFormData[platform.id][field.key] = data[field.key] || "";
          });
        }
      } else {
        loadedConnections[platform.id] = { status: "disconnected" };
        loadedFormData[platform.id] = {};
      }
    });

    setConnections(loadedConnections);
    setFormData(loadedFormData);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      toast.error(`OAuth Error: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      setAuthCode(code);
      toast.success("Authorization received. Complete the connection!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = (
    platformId: string,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        [field]: value,
      },
    }));
  };

  const handleStartOAuth = async (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    if (!platform.useOAuth) return;

    const appId = formData[platformId]?.appId?.trim();
    if (!appId) {
      toast.error("Please enter your Facebook App ID first");
      return;
    }

    setLoading((prev) => ({ ...prev, [platformId]: true }));

    try {
      const response = await fetch(
        `/api/facebook/oauth?appId=${encodeURIComponent(appId)}`
      );
      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "Failed to generate OAuth URL");

      window.open(result.oauthUrl, "_blank", "width=600,height=600");
      toast.success(
        "OAuth started. Complete it in the popup, then click 'Complete Connection'"
      );
    } catch (err: any) {
      toast.error(`OAuth Error: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [platformId]: false }));
    }
  };

  const handleCompleteConnection = async (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    const appId = formData[platformId]?.appId?.trim();
    const appSecret = formData[platformId]?.appSecret?.trim();

    if (!appId || !appSecret) {
      toast.error("Please enter both App ID and App Secret");
      return;
    }

    if (!authCode) {
      toast.error("No authorization code found. Start OAuth first.");
      return;
    }

    setLoading((prev) => ({ ...prev, [platformId]: true }));

    try {
      const response = await fetch("/api/facebook/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authCode, appId, appSecret }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Connection failed");

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

      setAuthCode("");
      toast.success(`Connected to ${platform.name}!`);
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

  const handleRefreshToken = async (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    const connection = connections[platformId];
    if (!connection?.data) return;

    setLoading((prev) => ({ ...prev, [`${platformId}_refresh`]: true }));

    try {
      const response = await fetch("/api/facebook/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: connection.data.appId,
          appSecret: connection.data.appSecret,
          userAccessToken: connection.data.userAccessToken,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Refresh failed");

      const updatedData = {
        ...connection.data,
        ...result,
        refreshedAt: result.refreshedAt,
      };
      localStorage.setItem(platform.storageKey, JSON.stringify(updatedData));
      setConnections((prev) => ({
        ...prev,
        [platformId]: {
          status: "connected",
          data: updatedData,
          connectedAt: connection.connectedAt,
        },
      }));
      toast.success(`Refreshed ${platform.name} token`);
    } catch (err: any) {
      toast.error(`Refresh failed: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [`${platformId}_refresh`]: false }));
    }
  };

  const handleTest = async (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    const connection = connections[platformId];
    if (!connection?.data) return;

    setLoading((prev) => ({ ...prev, [`${platformId}_test`]: true }));

    try {
      const response = await fetch("/api/facebook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connection.data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Test failed");

      toast.success(`${platform.name} connection working!`);
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [`${platformId}_test`]: false }));
    }
  };

  const handleDisconnect = (platformId: string) => {
    const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
    localStorage.removeItem(platform.storageKey);
    setConnections((prev) => ({
      ...prev,
      [platformId]: { status: "disconnected" },
    }));
    setFormData((prev) => ({ ...prev, [platformId]: {} }));
    setAuthCode("");
    toast.success(`Disconnected from ${platform.name}`);
  };

  const getStatusIcon = (status: string) =>
    status === "connected" ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : status === "error" ? (
      <AlertCircle className="h-5 w-5 text-red-500" />
    ) : (
      <XCircle className="h-5 w-5 text-gray-400" />
    );

  const getStatusBadge = (status: string) =>
    status === "connected" ? (
      <Badge className="bg-green-100 text-green-800">Connected</Badge>
    ) : status === "error" ? (
      <Badge className="bg-red-100 text-red-800">Error</Badge>
    ) : (
      <Badge variant="secondary">Disconnected</Badge>
    );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        Social Media Integration
      </h1>
      <p className="text-gray-600 mb-6 text-sm md:text-base">
        Connect your social media accounts securely using OAuth
      </p>

      {authCode && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium text-sm md:text-base">
            Authorization received! Complete the connection below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {Object.values(PLATFORMS).map((platform) => {
          const connection = connections[platform.id] || {
            status: "disconnected",
          };
          const isConnected = connection.status === "connected";
          const isLoading = loading[platform.id];
          const isTestLoading = loading[`${platform.id}_test`];
          const isRefreshLoading = loading[`${platform.id}_refresh`];

          return (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">
                      {platform.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      {platform.description}
                    </p>
                  </div>
                  {getStatusIcon(connection.status)}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  {getStatusBadge(connection.status)}
                  {connection.connectedAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(connection.connectedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {connection.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs md:text-sm text-red-600">
                    {connection.error}
                  </div>
                )}

                {!isConnected && (
                  <>
                    {platform.fields.map((field) => (
                      <div key={field.key}>
                        <Label htmlFor={`${platform.id}-${field.key}`}>
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <Input
                          id={`${platform.id}-${field.key}`}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[platform.id]?.[field.key] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              platform.id,
                              field.key,
                              e.target.value
                            )
                          }
                          className="mt-3 text-sm md:text-base"
                        />
                      </div>
                    ))}

                    <Button
                      onClick={() => handleStartOAuth(platform.id)}
                      disabled={isLoading}
                      className="w-full"
                      variant="outline"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-sm md:text-base">Start OAuth</span>
                    </Button>

                    <Button
                      onClick={() => handleCompleteConnection(platform.id)}
                      disabled={!authCode}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />{" "}
                      <span className="text-sm md:text-base">
                        Complete Connection
                      </span>
                    </Button>
                  </>
                )}

                {isConnected && (
                  <>
                    {connection.data?.userName && (
                      <div className="text-sm">
                        Connected as:{" "}
                        <strong>{connection.data.userName}</strong>
                        {connection.data?.pageName && (
                          <div>Page: {connection.data.pageName}</div>
                        )}
                        {connection.data?.instagramUsername && (
                          <div>
                            Instagram: @{connection.data.instagramUsername}
                          </div>
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
                        onClick={() => handleRefreshToken(platform.id)}
                        disabled={isRefreshLoading}
                        size="sm"
                        variant="outline"
                      >
                        {isRefreshLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                      <Button
                        onClick={() => handleDisconnect(platform.id)}
                        size="sm"
                        variant="destructive"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
