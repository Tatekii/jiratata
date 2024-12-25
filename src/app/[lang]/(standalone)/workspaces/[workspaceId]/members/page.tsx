import { getCurrent } from "@/features/auth/service/queries";
import { redirect } from "next/navigation";
import WorkspaceIdMemberClient from "./client";


const WorkspaceIdMembersPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/signin");

  return <WorkspaceIdMemberClient/>
};
 
export default WorkspaceIdMembersPage;
