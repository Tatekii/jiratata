import "server-only"
import mongoose from 'mongoose';

// TODO
// 文件模型接口
export interface IFile extends mongoose.Document {
  filename: string;
  contentType: string;
  size: number;
  data: Buffer;
  uploadDate: Date;
}

// 文件模式定义
const fileSchema = new mongoose.Schema<IFile>({
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

// 确保这是第一次编译模型
export const File = mongoose.models.File || mongoose.model<IFile>('File', fileSchema);

// 注意：对于大型文件，应考虑使用 GridFS
// 这个简单模型适用于小文件，如头像和图标
// 对于更大的文件，请考虑实现GridFS方案

export default File;
