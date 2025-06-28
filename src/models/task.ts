import mongoose from 'mongoose';

// 任务状态枚举
export enum ETaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

// 任务模型接口
export interface ITask extends mongoose.Document {
  name: string;
  description?: string;
  workspaceId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  dueDate: Date;
  assigneeId: mongoose.Types.ObjectId;
  status: ETaskStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

// 任务模式定义
const taskSchema = new mongoose.Schema<ITask>(
  {
    name: {
      type: String,
      required: [true, '任务名称是必须的'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, '工作区ID是必须的'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, '项目ID是必须的'],
    },
    dueDate: {
      type: Date,
      required: [true, '截止日期是必须的'],
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, '负责人ID是必须的'],
    },
    status: {
      type: String,
      enum: Object.values(ETaskStatus),
      default: ETaskStatus.BACKLOG,
      required: [true, '任务状态是必须的'],
    },
    position: {
      type: Number,
      required: [true, '任务位置是必须的'],
      default: 0,
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
  }
);

// 为任务创建索引，提高查询性能
taskSchema.index({ workspaceId: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });

// 确保这是第一次编译模型
export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

export default Task;
