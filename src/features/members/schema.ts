/**
 * Members schema定义，用于数据验证
 */
import { z } from "zod"
import { EMemberRole } from "../types"


// 更新成员角色的schema
export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(EMemberRole),
})

// 成员邀请schema
export const inviteMemberSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  role: z.nativeEnum(EMemberRole).default(EMemberRole.MEMBER),
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
