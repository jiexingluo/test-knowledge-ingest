"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReferenceDoc } from "@/types";

export function ReferenceShelf() {
  const [refs, setRefs] = useState<ReferenceDoc[]>([]);

  useEffect(() => {
    loadRefs();
  }, []);

  async function loadRefs() {
    const res = await fetch("/api/reference-shelf");
    setRefs(await res.json());
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/reference-shelf", { method: "POST", body: formData });
    loadRefs();
    e.target.value = "";
  }

  async function handleDelete(filename: string) {
    await fetch("/api/reference-shelf", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    loadRefs();
  }

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3">参考资料</h3>
      <p className="text-xs text-gray-500 mb-3">
        通用参考文档（ATE Manual、Programming Guide 等）
      </p>
      <div className="space-y-2">
        {refs.map((ref) => (
          <div
            key={ref.filename}
            className="flex items-center justify-between text-sm py-1"
          >
            <span>{ref.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(ref.filename)}
            >
              移除
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Input
          type="file"
          accept=".md"
          onChange={handleUpload}
          className="text-sm"
        />
      </div>
    </Card>
  );
}
