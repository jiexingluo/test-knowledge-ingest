"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { KBEntryViewer } from "@/components/kb-entry-viewer";
import type { KBEntry, KBMeta, KBGraph } from "@/types";

interface KBBrowserProps {
  workspaceId: string;
}

export function KBBrowser({ workspaceId }: KBBrowserProps) {
  const [meta, setMeta] = useState<KBMeta | null>(null);
  const [knowledge, setKnowledge] = useState<KBEntry[]>([]);
  const [knowhow, setKnowhow] = useState<KBEntry[]>([]);
  const [graph, setGraph] = useState<KBGraph | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<KBEntry | null>(null);
  const [search, setSearch] = useState("");

  const loadKB = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/knowledge-base`);
    const data = await res.json();
    setMeta(data.meta);
    setKnowledge(data.knowledge || []);
    setKnowhow(data.knowhow || []);
  }, [workspaceId]);

  const loadGraph = useCallback(async () => {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/knowledge-base?view=graph`
    );
    setGraph(await res.json());
  }, [workspaceId]);

  useEffect(() => {
    loadKB();
    loadGraph();
  }, [loadKB, loadGraph]);

  if (!meta) {
    return (
      <div className="text-center py-8 text-gray-500">
        知识库尚未生成，请先完成 ingest 流程
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

  const allEntries = [...knowledge, ...knowhow];
  const filtered = search
    ? allEntries.filter(
        (e) =>
          e.title.includes(search) ||
          e.summary.includes(search) ||
          e.action.includes(search)
      )
    : allEntries;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">
            {meta.chipType} Knowledge Base v{meta.version}
          </h3>
          <p className="text-sm text-gray-500">
            {meta.stats.knowledgeCount} Knowledge · {meta.stats.knowhowCount}{" "}
            Know-how · {meta.stats.openQuestions} 待确认问题
          </p>
        </div>
      </div>

      <Input
        placeholder="搜索知识条目..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">列表</TabsTrigger>
          <TabsTrigger value="graph">关系图 (JSON)</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-2">
            {filtered.map((entry) => (
              <Card
                key={entry.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          entry.type === "knowledge" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {entry.type === "knowledge" ? "Knowledge" : "Know-how"}
                      </Badge>
                      <span className="font-medium text-sm">{entry.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {entry.summary}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {entry.evidence.length} 证据
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {entry.reviewStatus}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {search ? "没有匹配的条目" : "暂无知识条目"}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500 mb-3">
              知识图谱关系数据（共 {graph?.nodes.length || 0} 个节点，
              {graph?.edges.length || 0} 条关系）
            </p>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(graph, null, 2)}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
