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
import { toast } from "sonner";

export function CreateWorkspaceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chipType, setChipType] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; chipType?: string }>({});

  function validate() {
    const e: { name?: string; chipType?: string } = {};
    if (!name.trim()) e.name = "请输入工作区名称";
    if (!chipType.trim()) e.chipType = "请输入芯片类型";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), chipType: chipType.trim(), description }),
      });
      if (!res.ok) throw new Error(`创建失败 (${res.status})`);
      const workspace = await res.json();
      toast.success("工作区创建成功");
      setOpen(false);
      setName(""); setChipType(""); setDescription("");
      router.push(`/workspace/${workspace.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败，请重试");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors({}); }}>
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
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="例如：ADC 测试知识库"
              className={errors.name ? "border-red-400" : ""}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="chipType">芯片类型</Label>
            <Input
              id="chipType"
              value={chipType}
              onChange={(e) => { setChipType(e.target.value); setErrors((p) => ({ ...p, chipType: undefined })); }}
              placeholder="例如：ADC, DC-DC, LDO"
              className={errors.chipType ? "border-red-400" : ""}
            />
            {errors.chipType && <p className="text-xs text-red-500 mt-1">{errors.chipType}</p>}
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
            disabled={creating}
            className="w-full"
          >
            {creating ? "创建中..." : "创建"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
