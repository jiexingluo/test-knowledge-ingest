"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ProjectUploadProps {
  workspaceId: string;
  onUploadComplete: () => void;
}

export function ProjectUpload({ workspaceId, onUploadComplete }: ProjectUploadProps) {
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  }, []);

  async function handleUpload() {
    if (!projectName.trim() || !files || files.length === 0) return;
    setUploading(true);
    setProgress(0);

    const batchSize = 50;
    const totalFiles = files.length;
    const toastId = toast.loading(`上传中 (0/${totalFiles})...`);

    try {
      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = Array.from(files).slice(i, i + batchSize);
        const batchFormData = new FormData();
        batchFormData.append("projectName", projectName.trim());
        for (const file of batch) {
          batchFormData.append("files", file);
        }

        const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
          method: "POST",
          body: batchFormData,
        });
        if (!res.ok) throw new Error(`上传失败 (${res.status})`);

        const pct = Math.min(100, Math.round(((i + batchSize) / totalFiles) * 100));
        setProgress(pct);
        toast.loading(`上传中 (${Math.min(i + batchSize, totalFiles)}/${totalFiles})...`, { id: toastId });
      }

      toast.success(`项目 "${projectName.trim()}" 上传完成，共 ${totalFiles} 个文件`, { id: toastId });
      setProjectName("");
      setFiles(null);
      onUploadComplete();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败，请重试", { id: toastId });
    } finally {
      setUploading(false);
      setProgress(0);
    }
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
            disabled={uploading}
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
            disabled={uploading}
          />
          {files && (
            <p className="text-xs text-gray-500 mt-1">
              已选择 {files.length} 个文件
            </p>
          )}
        </div>
        {uploading && <Progress value={progress} className="h-1.5" />}
        <Button
          onClick={handleUpload}
          disabled={!projectName.trim() || !files || uploading}
          className="w-full"
        >
          {uploading ? `上传中 ${progress}%` : "上传项目"}
        </Button>
      </div>
    </Card>
  );
}
