/**
 * 统一导出所有MongoDB模型和类型
 * 这是唯一的类型定义来源，避免重复定义
 */

// 导出所有MongoDB模型
export { default as User, type IUser } from './user';
export { default as Workspace, type IWorkspace } from './workspace';
export { default as Member, type IMember, EMemberRole } from './member';
export { default as Project, type IProject } from './project';
export { default as Task, type ITask, ETaskStatus } from './task';
export { default as File, type IFile } from './file';

// 重新导出类型适配器
export { mongoToFrontendDoc, mongoToFrontendDocs, frontendToMongoData } from '../lib/type-adapters';
