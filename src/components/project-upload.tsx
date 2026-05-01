"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface ProjectUploadProps {
  workspaceId: string;
  onUploadComplete: () => void;
}

export function ProjectUpload({
  workspaceId,
  onUploadComplete,
}: ProjectUploadProps) {
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFiles(e.target.files);
    },
    []
  );

  async function handleUpload() {
    if (!projectName || !files || files.length === 0) return;
    setUploading(true);
    setProgress(0);

    const batchSize = 50;
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i += batchSize) {
      const batch = Array.from(files).slice(i, i + batchSize);
      const batchFormData = new FormData();
      batchFormData.append("projectName", projectName);
      for (const file of batch) {
        batchFormData.append("files", file);
      }

      await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: batchFormData,
      });

      setProgress(Math.min(100, Math.round(((i + batchSize) / totalFiles) * 100)));
    }

    setUploading(false);
    setProjectName("");
    setFiles(null);
    onUploadComplete();
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3">上传项目文件</h3>
      <div className="space-y-3">
        <div>
          <Label htmlFor="projectName">项目名称</Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="例如：ADC_Project_A"
          />
        </div>
        <div>
          <Label htmlFor="files">选择文件夹</Label>
          <Input
            id="files"
            type="file"
            onChange={handleFileSelect}
            // @ts-expect-error webkitdirectory is not in standard types
            webkitdirectory=""
            directory=""
            multiple
          />
          {files && (
            <p className="text-xs text-gray-500 mt-1">
              已选择 {files.length} 个文件
            </p>
          )}
        </div>
        {uploading && <Progress value={progress} />}
        <Button
          onClick={handleUpload}
          disabled={!projectName || !files || uploading}
          className="w-full"
        >
          {uploading ? `上传中 ${progress}%` : "上传项目"}
        </Button>
      </div>
    </Card>
  );
}
