import ProjectIdClient from "./client";
import { authGuard } from "@/features/auth/utils";

const ProjectIdPage = async () => {
  await authGuard()

  return <ProjectIdClient />
};
 
export default ProjectIdPage;
