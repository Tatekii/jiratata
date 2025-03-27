import { Query, type Databases } from "node-appwrite";

import { DATABASE_ID, MEMBERS_ID } from "@/config";

interface GetMemberProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
};

export const getMember = async ({
  databases,
  workspaceId,
  userId,
}: GetMemberProps) => {
  try {
    const members = await databases.listDocuments(
      DATABASE_ID,
      MEMBERS_ID,
      [
        Query.equal("workspaceId", workspaceId), 
        Query.equal("userId", userId),
      ],
    );

    return members.documents.length > 0 ? members.documents[0] : null;
  } catch (error) {
    console.error("Failed to fetch member:", error);
    return null;
  }
};
