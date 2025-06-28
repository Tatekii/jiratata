/**
 * MongoDB版本的工作区服务辅助函数
 */
import { nanoid } from 'nanoid';
import { Workspace, Member, EMemberRole, User, Project, Task } from '@/models';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// 生成邀请码
export const generateInviteCode = (): string => {
  return nanoid(10);
};

// 检查用户是否为工作区成员
export const getMemberByWorkspaceAndUser = async (workspaceId: string, userId: string) => {
  await connectToDatabase();
  
  return await Member.findOne({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    userId: new mongoose.Types.ObjectId(userId)
  }).populate('userId', 'name email');
};

// 获取用户的所有工作区
export const getUserWorkspaces = async (userId: string) => {
  await connectToDatabase();
  
  // 首先获取用户是成员的所有工作区ID
  const memberships = await Member.find({
    userId: new mongoose.Types.ObjectId(userId)
  }).select('workspaceId');

  if (memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map(m => m.workspaceId);

  // 获取工作区详情并按创建时间倒序排列
  return await Workspace.find({
    _id: { $in: workspaceIds }
  })
  .populate('userId', 'name email')
  .sort({ createdAt: -1 });
};

// 创建工作区
export const createWorkspace = async (data: {
  name: string;
  userId: string;
  imageUrl?: string;
}) => {
  await connectToDatabase();
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // 创建工作区
    const workspace = new Workspace({
      name: data.name,
      userId: new mongoose.Types.ObjectId(data.userId),
      imageUrl: data.imageUrl,
      inviteCode: generateInviteCode(),
    });
    
    await workspace.save({ session });
    
    // 自动将创建者添加为管理员
    const member = new Member({
      userId: new mongoose.Types.ObjectId(data.userId),
      workspaceId: workspace._id,
      role: EMemberRole.ADMIN,
    });
    
    await member.save({ session });
    
    await session.commitTransaction();
    
    return workspace.populate('userId', 'name email');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 通过邀请码获取工作区
export const getWorkspaceByInviteCode = async (inviteCode: string) => {
  await connectToDatabase();
  
  return await Workspace.findOne({ inviteCode })
    .populate('userId', 'name email');
};

// 更新工作区
export const updateWorkspace = async (workspaceId: string, updates: {
  name?: string;
  imageUrl?: string;
}) => {
  await connectToDatabase();
  
  return await Workspace.findByIdAndUpdate(
    workspaceId,
    { $set: updates },
    { new: true }
  ).populate('userId', 'name email');
};

// 删除工作区（级联删除）
export const deleteWorkspace = async (workspaceId: string) => {
  await connectToDatabase();
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
    
    // 删除相关任务
    await Task.deleteMany({ workspaceId: workspaceObjectId }, { session });
    
    // 删除相关项目
    await Project.deleteMany({ workspaceId: workspaceObjectId }, { session });
    
    // 删除相关成员
    await Member.deleteMany({ workspaceId: workspaceObjectId }, { session });
    
    // 删除工作区
    const workspace = await Workspace.findByIdAndDelete(workspaceId, { session });
    
    await session.commitTransaction();
    
    return workspace;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 重置工作区邀请码
export const resetWorkspaceInviteCode = async (workspaceId: string) => {
  await connectToDatabase();
  
  return await Workspace.findByIdAndUpdate(
    workspaceId,
    { $set: { inviteCode: generateInviteCode() } },
    { new: true }
  );
};

// 通过邀请码加入工作区
export const joinWorkspaceByInviteCode = async (inviteCode: string, userId: string) => {
  await connectToDatabase();
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // 查找工作区
    const workspace = await Workspace.findOne({ inviteCode }).session(session);
    if (!workspace) {
      throw new Error('无效的邀请码');
    }
    
    // 检查用户是否已是成员
    const existingMember = await Member.findOne({
      workspaceId: workspace._id,
      userId: new mongoose.Types.ObjectId(userId)
    }).session(session);
    
    if (existingMember) {
      throw new Error('您已经是该工作区的成员');
    }
    
    // 添加用户为成员
    const member = new Member({
      userId: new mongoose.Types.ObjectId(userId),
      workspaceId: workspace._id,
      role: EMemberRole.MEMBER,
    });
    
    await member.save({ session });
    
    await session.commitTransaction();
    
    return workspace;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
