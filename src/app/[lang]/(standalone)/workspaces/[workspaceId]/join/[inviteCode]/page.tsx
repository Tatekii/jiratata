import { WorkspaceIdJoinClient } from "./client";
import { authGuard } from "@/features/auth/utils";

const WorkspaceIdJoinPage = async () => {
  await authGuard()

  return <WorkspaceIdJoinClient />
};
 
export default WorkspaceIdJoinPage;
