import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/service/queries";
import { WorkspaceIdJoinClient } from "./client";


const WorkspaceIdJoinPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/signin");

  return <WorkspaceIdJoinClient />
};
 
export default WorkspaceIdJoinPage;
