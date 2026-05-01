import { WorkspaceList } from "@/components/workspace-list";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";

export default function HomePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">工作区</h2>
          <p className="text-gray-500 text-sm mt-1">
            每个工作区对应一种芯片类型的知识库
          </p>
        </div>
        <CreateWorkspaceDialog />
      </div>
      <WorkspaceList />
    </div>
  );
}
