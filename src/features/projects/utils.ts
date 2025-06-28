/**
 * MongoDB版本的项目服务辅助函数
 */
import { Project, Member, Task, ETaskStatus } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// 获取工作区的所有项目
export const getWorkspaceProjects = async (workspaceId: string) => {
  await connectToDatabase();
  
  return await Project.find({
    workspaceId: new mongoose.Types.ObjectId(workspaceId)
  }).sort({ createdAt: -1 });
};

// 创建项目
export const createProject = async (data: {
  name: string;
  workspaceId: string;
  imageUrl?: string;
}) => {
  await connectToDatabase();
  
  const project = new Project({
    name: data.name,
    workspaceId: new mongoose.Types.ObjectId(data.workspaceId),
    imageUrl: data.imageUrl,
  });
  
  return await project.save();
};

// 获取单个项目
export const getProjectById = async (projectId: string) => {
  await connectToDatabase();
  
  return await Project.findById(projectId);
};

// 更新项目
export const updateProject = async (projectId: string, updates: {
  name?: string;
  imageUrl?: string;
}) => {
  await connectToDatabase();
  
  return await Project.findByIdAndUpdate(
    projectId,
    { $set: updates },
    { new: true }
  );
};

// 删除项目（级联删除任务）
export const deleteProject = async (projectId: string) => {
  await connectToDatabase();
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    
    // 删除项目下的所有任务
    await Task.deleteMany({ projectId: projectObjectId }, { session });
    
    // 删除项目
    const project = await Project.findByIdAndDelete(projectId, { session });
    
    await session.commitTransaction();
    
    return project;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 获取项目统计信息
export const getProjectAnalytics = async (projectId: string) => {
  await connectToDatabase();
  
  const pipeline = [
    {
      $match: { projectId: new mongoose.Types.ObjectId(projectId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  const taskStats = await Task.aggregate(pipeline);
  
  // 转换为前端期望的格式
  const stats: Record<string, number> = {};
  Object.values(ETaskStatus).forEach(status => {
    stats[status] = 0;
  });
  
  taskStats.forEach(stat => {
    stats[stat._id] = stat.count;
  });
  
  return {
    taskCount: Object.values(stats).reduce((sum, count) => sum + count, 0),
    taskDone: stats[ETaskStatus.DONE] || 0,
    taskPending: (stats[ETaskStatus.TODO] || 0) + (stats[ETaskStatus.IN_PROGRESS] || 0) + (stats[ETaskStatus.IN_REVIEW] || 0),
    taskBacklog: stats[ETaskStatus.BACKLOG] || 0,
  };
};

// 检查用户是否为项目所在工作区的成员
export const checkProjectAccess = async (projectId: string, userId: string): Promise<boolean> => {
  await connectToDatabase();
  
  const project = await Project.findById(projectId);
  if (!project) {
    return false;
  }
  
  const member = await Member.findOne({
    workspaceId: project.workspaceId,
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  return !!member;
};
