import { getCurrent } from "@/features/auth/service/queries";
import { redirect } from "next/navigation";
import ProjectIdClient from "./client";



const ProjectIdPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/signin");

  return <ProjectIdClient />
};
 
export default ProjectIdPage;
