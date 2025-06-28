import mongoose from 'mongoose';

// 项目模型接口
export interface IProject extends mongoose.Document {
  name: string;
  workspaceId: mongoose.Types.ObjectId;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 项目模式定义
const projectSchema = new mongoose.Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, '项目名称是必须的'],
      trim: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, '工作区ID是必须的'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
  }
);

// 为项目创建索引，提高查询性能
projectSchema.index({ workspaceId: 1 });

// 确保这是第一次编译模型
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

export default Project;
