"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TGeneratedContent } from "@/types";
import { Bot, ImageIcon, Loader2, Plus } from "lucide-react";
import Image from "next/image";

type Props = {
  isGenerating: boolean;
  generatedContent: TGeneratedContent | null;
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerateContent: () => void;
  onGenerateImage: () => void;
  onInsert: () => void;
};

const AIAssistant = ({
  isGenerating,
  generatedContent,
  prompt,
  onPromptChange,
  onGenerateContent,
  onGenerateImage,
  onInsert,
}: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" /> AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ai-prompt">AI Prompt</Label>
          <Textarea
            id="ai-prompt"
            placeholder="Write a custom prompt for the AI..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            className="mt-3"
          />
        </div>

        <Button
          onClick={onGenerateContent}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bot className="h-4 w-4 mr-2" />
          )}
          Generate Content
        </Button>

        {generatedContent && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Caption:</h4>
              <p className="text-sm mb-2">{generatedContent.caption}</p>

              {generatedContent.hashtags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Hashtags:</h4>
                  <div className="flex flex-wrap gap-1">
                    {generatedContent.hashtags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={onGenerateImage}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2" />
              )}
              Generate Image
            </Button>

            {generatedContent.imageUrl && (
              <Image
                width={250}
                height={96}
                src={generatedContent.imageUrl}
                alt="Generated"
                className="w-full h-32 object-cover rounded-lg mt-2"
              />
            )}

            <Button onClick={onInsert} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Insert to Editor
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
