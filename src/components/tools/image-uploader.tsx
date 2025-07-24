"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import Image from "next/image";

type Props = {
  images: string[];
  onUpload: (newImages: string[]) => void;
  onRemove: (index: number) => void;
};

const ImageUploader = ({ images, onUpload, onRemove }: Props) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const readers = Array.from(files).map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          })
      );
      Promise.all(readers).then((base64s) => {
        onUpload(base64s);
      });
    }
  };

  return (
    <div>
      <Label className="text-sm md:text-base">Images</Label>
      <div className="mt-3">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="flex items-center justify-center w-full h-24 md:h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <div className="text-center">
            <Upload className="h-6 w-6 md:h-8 md:w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs md:text-sm text-gray-600">
              Click to upload images
            </p>
          </div>
        </label>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <Image
                width={250}
                height={96}
                src={image || "/placeholder.svg"}
                alt={`Upload ${index + 1}`}
                className="w-full h-20 md:h-24 object-cover rounded-lg"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 md:h-6 md:w-6 p-0"
                onClick={() => onRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
