"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { KBEntryViewer } from "@/components/kb-entry-viewer";
import { KBEntrySkeleton } from "@/components/skeleton";
import { toast } from "sonner";
import type { KBEntry, KBMeta, KBGraph } from "@/types";

interface KBBrowserProps {
  workspaceId: string;
}

export function KBBrowser({ workspaceId }: KBBrowserProps) {
  const [meta, setMeta] = useState<KBMeta | null>(null);
  const [knowledge, setKnowledge] = useState<KBEntry[]>([]);
  const [knowhow, setKnowhow] = useState<KBEntry[]>([]);
  const [graph, setGraph] = useState<KBGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<KBEntry | null>(null);
  const [search, setSearch] = useState("");

  const loadKB = useCallback(async () => {
    try {
      const [kbRes, graphRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/knowledge-base`),
        fetch(`/api/workspaces/${workspaceId}/knowledge-base?view=graph`),
      ]);
      if (!kbRes.ok) throw new Error(`加载失败 (${kbRes.status})`);
      const data = await kbRes.json();
      setMeta(data.meta);
      setKnowledge(data.knowledge || []);
      setKnowhow(data.knowhow || []);
      if (graphRes.ok) setGraph(await graphRes.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载知识库失败");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { loadKB(); }, [loadKB]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-3.5 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-9 w-full bg-gray-200 animate-pulse rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => <KBEntrySkeleton key={i} />)}
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-3xl mb-2">📚</div>
        <p className="font-medium text-gray-500">知识库尚未生成</p>
        <p className="text-sm mt-1">完成 ingest 流程并回答问题后，知识库将在此显示</p>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <KBEntryViewer
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    );
  }

  const q = search.toLowerCase();
  const allEntries = [...knowledge, ...knowhow];
  const filtered = q
    ? allEntries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
      )
    : allEntries;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">
            {meta.chipType} Knowledge Base
            <span className="text-gray-400 font-normal ml-1.5 text-sm">v{meta.version}</span>
          </h3>
          <p className="text-sm text-gray-500">
            {meta.stats.knowledgeCount} Knowledge · {meta.stats.knowhowCount} Know-how
            {meta.stats.openQuestions > 0 && (
              <span className="text-orange-500 ml-1.5">· {meta.stats.openQuestions} 待确认</span>
            )}
          </p>
        </div>
      </div>

      <Input
        placeholder="搜索知识条目（支持中英文）..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
        aria-label="搜索知识条目"
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">列表 ({allEntries.length})</TabsTrigger>
          <TabsTrigger value="graph">关系图</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-2">
            {filtered.map((entry) => (
              <Card
                key={entry.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEntry(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedEntry(entry)}
                aria-label={`查看：${entry.title}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={entry.type === "knowledge" ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {entry.type === "knowledge" ? "Knowledge" : "Know-how"}
                      </Badge>
                      <span className="font-medium text-sm truncate">{entry.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.summary}</p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Badge variant="outline" className="text-xs">{entry.evidence.length} 证据</Badge>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {search ? `没有匹配"${search}"的条目` : "暂无知识条目"}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600 font-medium">知识图谱</p>
              <p className="text-xs text-gray-400">
                {graph?.nodes.length ?? 0} 个节点 · {graph?.edges.length ?? 0} 条关系
              </p>
            </div>
            {graph && graph.nodes.length > 0 ? (
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96 leading-relaxed">
                {JSON.stringify(graph, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">暂无关系数据</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
