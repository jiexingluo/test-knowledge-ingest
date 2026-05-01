"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateWorkspaceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chipType, setChipType] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name || !chipType) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, chipType, description }),
      });
      const workspace = await res.json();
      setOpen(false);
      router.push(`/workspace/${workspace.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>+ 新建工作区</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建知识提取工作区</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">工作区名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：ADC 测试知识库"
            />
          </div>
          <div>
            <Label htmlFor="chipType">芯片类型</Label>
            <Input
              id="chipType"
              value={chipType}
              onChange={(e) => setChipType(e.target.value)}
              placeholder="例如：ADC, DC-DC, LDO"
            />
          </div>
          <div>
            <Label htmlFor="desc">描述（可选）</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述这个知识库的目标"
              rows={3}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name || !chipType || creating}
            className="w-full"
          >
            {creating ? "创建中..." : "创建"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
