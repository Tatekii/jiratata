/**
 * 统一类型定义 - 从Models派生前端类型
 * 替代重复的类型定义，统一从MongoDB模型派生
 */
import { 
  IUser, 
  IWorkspace, 
  IMember, 
  IProject, 
  ITask, 
  EMemberRole, 
  ETaskStatus 
} from '@/models';

// 基础文档接口（兼容AppWrite格式，用于前端显示）
export interface BaseDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
}

// MongoDB文档转换为前端格式的工具类型
type MongoToFrontend<T> = Omit<T, '_id' | 'createdAt' | 'updatedAt'> & BaseDocument;

// 重新导出枚举，保持向后兼容
export { EMemberRole as EMemberRole, ETaskStatus as ETaskStatus };

// 从MongoDB模型派生的前端类型
export type TUser = MongoToFrontend<Pick<IUser, 'name' | 'email'>> & {
  _id?: string; // MongoDB原始ID，供API使用
};

export type TWorkspace = MongoToFrontend<Pick<IWorkspace, 'name' | 'imageUrl' | 'inviteCode' | 'userId'>> & {
  _id?: string;
};

export type TMember = MongoToFrontend<Pick<IMember, 'workspaceId' | 'userId' | 'role'>> & {
  _id?: string;
  name?: string;
  email?: string;
  user?: TUser; // 关联用户信息
};

export type TProject = MongoToFrontend<Pick<IProject, 'name' | 'imageUrl' | 'workspaceId'>> & {
  _id?: string;
};

export type TTask = MongoToFrontend<Pick<ITask, 'name' | 'description' | 'workspaceId' | 'projectId' | 'assigneeId' | 'status' | 'position' | 'dueDate'>> & {
  _id?: string;
  project?: TProject;
  assignee?: TMember;
};
