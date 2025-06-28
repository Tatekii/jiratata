/**
 * MongoDB版本的members工具函数，替代AppWrite
 */
import { getMemberByWorkspaceAndUser } from "./utils-mongodb";

// 兼容层：保持原有的API接口
interface GetMemberProps {
  workspaceId: string;
  userId: string;
  // databases参数保留但不使用，仅为兼容性
  databases?: unknown;
}

export const getMember = async ({
  workspaceId,
  userId,
}: GetMemberProps) => {
  const member = await getMemberByWorkspaceAndUser(workspaceId, userId);
  
  if (!member) {
    return null;
  }

  // 转换为兼容格式
  return {
    $id: member._id,
    $createdAt: member.createdAt.toISOString(),
    $updatedAt: member.updatedAt.toISOString(),
    workspaceId: member.workspaceId.toString(),
    userId: typeof member.userId === 'string' ? member.userId : member.userId._id.toString(),
    role: member.role,
  };
};
