import mongoose from 'mongoose';

// 成员角色枚举
export enum EMemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

// 成员模型接口
export interface IMember extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  role: EMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

// 成员模式定义
const memberSchema = new mongoose.Schema<IMember>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '用户ID是必须的'],
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, '工作区ID是必须的'],
    },
    role: {
      type: String,
      enum: Object.values(EMemberRole),
      default: EMemberRole.MEMBER,
      required: [true, '成员角色是必须的'],
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
  }
);

// 为成员创建复合索引，确保用户在一个工作区内只有一个成员记录
memberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

// 确保这是第一次编译模型
export const Member = mongoose.models.Member || mongoose.model<IMember>('Member', memberSchema);

export default Member;
