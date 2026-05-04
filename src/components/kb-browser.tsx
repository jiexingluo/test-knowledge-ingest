"use client";

import { useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    async function syncKB() {
      await loadKB();
    }

    void syncKB();
  }, [loadKB]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3.5 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => <KBEntrySkeleton key={i} />)}
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
        <div className="text-3xl mb-2">📚</div>
        <p className="font-medium text-foreground text-sm">知识库尚未生成</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          完成 Ingest 流程并回答确认问题后，知识库将在此显示
        </p>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">
            {meta.chipType} Knowledge Base
            <span className="text-muted-foreground font-normal ml-1.5 text-sm">
              v{meta.version}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{meta.stats.knowledgeCount}</span> Knowledge
            {" · "}
            <span className="font-medium text-foreground">{meta.stats.knowhowCount}</span> Know-how
            {meta.stats.openQuestions > 0 && (
              <span className="text-amber-600 ml-1.5">
                · {meta.stats.openQuestions} 待确认
              </span>
            )}
          </p>
        </div>
      </div>

      <Input
        placeholder="搜索知识条目（标题、摘要、操作规则）..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
        aria-label="搜索知识条目"
      />

      <Tabs defaultValue="list">
        <TabsList variant="line">
          <TabsTrigger value="list">列表 ({allEntries.length})</TabsTrigger>
          <TabsTrigger value="graph">关系图</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-2">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                className="w-full text-left rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => setSelectedEntry(entry)}
                aria-label={`查看：${entry.title}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        variant={entry.type === "knowledge" ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {entry.type === "knowledge" ? "Knowledge" : "Know-how"}
                      </Badge>
                      <span className="font-medium text-sm text-foreground truncate">
                        {entry.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {entry.evidence.length} 证据
                  </Badge>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {search ? `没有匹配「${search}」的条目` : "暂无知识条目"}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-4">
          <GraphView graph={graph} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Replaces the raw JSON dump with a readable node/edge visualization */
function GraphView({ graph }: { graph: KBGraph | null }) {
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-10 text-center text-muted-foreground text-sm">
        暂无关系图数据
      </div>
    );
  }

  // Group nodes by type
  const nodesByType = graph.nodes.reduce<Record<string, typeof graph.nodes>>(
    (acc, node) => {
      const t = node.type || "other";
      (acc[t] = acc[t] || []).push(node);
      return acc;
    },
    {}
  );

  const typeColors: Record<string, string> = {
    knowledge: "bg-primary/10 text-primary border-primary/20",
    knowhow: "bg-secondary text-secondary-foreground border-secondary",
    other: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="rounded-lg border bg-card px-4 py-2.5 text-center min-w-[80px]">
          <p className="text-2xl font-semibold text-foreground">
            {graph.nodes.length}
          </p>
          <p className="text-xs text-muted-foreground">节点</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2.5 text-center min-w-[80px]">
          <p className="text-2xl font-semibold text-foreground">
            {graph.edges.length}
          </p>
          <p className="text-xs text-muted-foreground">关系边</p>
        </div>
      </div>

      {/* Nodes by type */}
      {Object.entries(nodesByType).map(([type, nodes]) => (
        <div key={type}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {type === "knowledge"
              ? "Knowledge 节点"
              : type === "knowhow"
                ? "Know-how 节点"
                : `${type} 节点`}{" "}
            <span className="font-normal">({nodes.length})</span>
          </h4>
          <div className="space-y-1">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${typeColors[type] ?? typeColors.other}`}
              >
                <span className="font-mono text-xs opacity-50 shrink-0">
                  {node.id.slice(0, 6)}
                </span>
                <span className="truncate">{node.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edges */}
      {graph.edges.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            关系 ({graph.edges.length})
          </h4>
          <div className="rounded-lg border bg-card divide-y overflow-hidden">
            {graph.edges.map((edge, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground"
              >
                <span className="font-mono text-muted-foreground shrink-0">
                  {edge.source.slice(0, 6)}
                </span>
                <span className="text-muted-foreground shrink-0">→</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {edge.relationship}
                </Badge>
                <span className="text-muted-foreground shrink-0">→</span>
                <span className="font-mono text-muted-foreground">
                  {edge.target.slice(0, 6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
