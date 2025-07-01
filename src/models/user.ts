import "server-only"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import { IClientUser } from "@/features/types"

// 用户模型接口
export interface IMongoUser extends IClientUser, mongoose.Document<string> {
	password: string
	comparePassword(candidatePassword: string): Promise<boolean>
}

// 用户模式定义
const userSchema = new mongoose.Schema<IMongoUser>(
	{
		name: {
			type: String,
			required: [true, "用户名是必须的"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "邮箱是必须的"],
			unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: function (v: string) {
					return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v)
				},
				message: "请提供有效的邮箱地址",
			},
		},
		password: {
			type: String,
			required: [true, "密码是必须的"],
			minlength: [8, "密码必须至少包含8个字符"],
			select: false, // 默认查询不返回密码字段
		},
	},
	{
		timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
	}
)

// 保存前的中间件 - 密码哈希
userSchema.pre("save", async function (next) {
	// 只有在密码被修改时才重新加密
	if (!this.isModified("password")) return next()

	try {
		// 生成盐并哈希密码
		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(this.password, salt)
		this.password = hashedPassword
		next()
	} catch (error) {
		next(error as Error)
	}
})

// 密码比较方法
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
	try {
		return await bcrypt.compare(candidatePassword, this.password)
	} catch {
		return false
	}
}

// 确保这是第一次编译模型
export const User =
	(mongoose.models.User as mongoose.Model<IMongoUser>) || mongoose.model<IMongoUser>("User", userSchema)

export default User
