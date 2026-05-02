"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/skeleton";
import { toast } from "sonner";
import type { ReferenceDoc } from "@/types";

export function ReferenceShelf() {
  const [refs, setRefs] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { loadRefs(); }, []);

  async function loadRefs() {
    try {
      const res = await fetch("/api/reference-shelf");
      if (!res.ok) throw new Error(`加载失败 (${res.status})`);
      setRefs(await res.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载参考资料失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".md")) {
      toast.error("只支持 .md 格式的文件");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/reference-shelf", { method: "POST", body: formData });
      if (!res.ok) throw new Error(`上传失败 (${res.status})`);
      toast.success(`"${file.name}" 已添加到参考资料`);
      await loadRefs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try {
      const res = await fetch("/api/reference-shelf", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) throw new Error(`删除失败 (${res.status})`);
      toast.success("已移除");
      await loadRefs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-1">参考资料</h3>
      <p className="text-xs text-gray-500 mb-3">
        通用参考文档（ATE Manual、Programming Guide 等），仅支持 .md 格式
      </p>

      {loading ? (
        <div className="space-y-2 mb-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      ) : refs.length === 0 ? (
        <p className="text-xs text-gray-400 mb-3 py-2">暂无参考资料</p>
      ) : (
        <div className="space-y-1 mb-3">
          {refs.map((ref) => (
            <div key={ref.filename} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
              <div>
                <span className="font-medium">{ref.name}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {(ref.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(ref.filename)}
                disabled={deleting === ref.filename}
                className="text-gray-400 hover:text-red-500 h-7 px-2"
              >
                {deleting === ref.filename ? "删除中..." : "移除"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <Label htmlFor="ref-upload" className="text-xs text-gray-500 mb-1 block">
          添加参考文档（.md）
        </Label>
        <Input
          id="ref-upload"
          type="file"
          accept=".md"
          onChange={handleUpload}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-blue-500 mt-1">上传中...</p>}
      </div>
    </Card>
  );
}
