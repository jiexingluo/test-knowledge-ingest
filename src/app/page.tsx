import { WorkspaceList } from "@/components/workspace-list";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";

export default function HomePage() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              工作区
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xl leading-relaxed">
              每个工作区对应一种芯片类型的测试知识库。上传项目文件后，AI
              将自动提取测试知识并生成结构化的 Knowledge / Know-how 条目。
            </p>
          </div>
          <CreateWorkspaceDialog />
        </div>
      </div>

      {/* How it works — subtle info strip */}
      <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-3">
        {[
          {
            step: "01",
            title: "创建工作区",
            desc: "按芯片类型建立独立知识库",
          },
          {
            step: "02",
            title: "上传项目文件",
            desc: "上传 ATE 测试程序文件夹",
          },
          {
            step: "03",
            title: "启动知识提取",
            desc: "AI 提取并生成结构化知识条目",
          },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="text-xs font-mono font-bold text-primary/60 mt-0.5 shrink-0">
              {step}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Workspace grid */}
      <WorkspaceList />
    </div>
  );
}
