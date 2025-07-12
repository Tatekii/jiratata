"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paperclip, Upload, Download, Trash2, File, Image as ImageIcon, FileText, Archive } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

import { useGetAttachments } from "@/features/attachments/api/useGetAttachments"
import { useCreateAttachment } from "@/features/attachments/api/useCreateAttachment"
import { useDeleteAttachment } from "@/features/attachments/api/useDeleteAttachment"
import { IClientAttachment } from "@/features/types"

interface TaskAttachmentsProps {
	taskId: string
}

export const TaskAttachments = ({ taskId }: TaskAttachmentsProps) => {
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const { data: response, isLoading } = useGetAttachments({
		entityType: "TASK",
		entityId: taskId,
	})
	const { mutate: createAttachment } = useCreateAttachment()
	const { mutate: deleteAttachment } = useDeleteAttachment()

	// 从响应中提取 attachments 数据
	const attachments = response && "data" in response ? response.data : []

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes"
		const k = 1024
		const sizes = ["Bytes", "KB", "MB", "GB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
	}

	const getFileIcon = (extension: string) => {
		const ext = extension.toLowerCase()
		if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
			return <ImageIcon className="w-4 h-4" />
		}
		if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) {
			return <FileText className="w-4 h-4" />
		}
		if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
			return <Archive className="w-4 h-4" />
		}
		return <File className="w-4 h-4" />
	}

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files
		if (!files || files.length === 0) return

		setUploading(true)

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i]

				await new Promise<void>((resolve, reject) => {
					createAttachment(
						{
							filename: file.name,
							originalName: file.name,
							mimeType: file.type,
							size: file.size,
							url: `/uploads/${Date.now()}-${file.name}`, // TODO: 实际的文件上传逻辑
							entityType: "TASK",
							entityId: taskId,
							workspaceId: "", // TODO: 从上下文获取
						},
						{
							onSuccess: () => {
								resolve()
							},
							onError: reject,
						}
					)
				})
			}
		} catch (error) {
			console.error("文件上传失败:", error)
		} finally {
			setUploading(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	const handleDownload = (attachment: IClientAttachment) => {
		// TODO: 实现文件下载逻辑
		const link = document.createElement("a")
		link.href = attachment.url
		link.download = attachment.filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const handleDelete = (attachmentId: string) => {
		if (confirm("确定要删除这个附件吗？")) {
			deleteAttachment(attachmentId)
		}
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Paperclip className="w-5 h-5" />
						附件
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4">加载中...</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Paperclip className="w-5 h-5" />
					附件 ({attachments?.length || 0})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 上传区域 */}
				<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
					<input
						ref={fileInputRef}
						type="file"
						multiple
						onChange={handleFileSelect}
						className="hidden"
						accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
					/>

					{uploading ? (
						<div className="space-y-2">
							<Upload className="w-8 h-8 mx-auto text-blue-500 animate-pulse" />
							<p className="text-sm text-gray-600">上传中...</p>
						</div>
					) : (
						<div className="space-y-2">
							<div className="flex justify-center">
								<Upload className="w-8 h-8 text-gray-400" />
							</div>
							<p className="text-sm text-gray-600">点击上传文件或拖拽文件到此处</p>
							<Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
								选择文件
							</Button>
						</div>
					)}
				</div>

				{/* 附件列表 */}
				<div className="space-y-2">
					{attachments?.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<div className="flex justify-center">
								<Paperclip className="w-12 h-12mb-2 opacity-30" />
							</div>
							<p>还没有附件</p>
						</div>
					) : (
						attachments?.map((attachment: IClientAttachment) => (
							<div
								key={attachment._id}
								className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
							>
								<div className="flex-shrink-0">{getFileIcon(attachment.extension || "")}</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-sm font-medium truncate">{attachment.filename}</p>
										<Badge variant="outline" className="text-xs">
											{attachment.extension?.toUpperCase()}
										</Badge>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-500">
										<span>{formatFileSize(attachment.size)}</span>
										<span>•</span>
										<span>
											{formatDistanceToNow(new Date(attachment.createdAt), {
												addSuffix: true,
												locale: zhCN,
											})}
										</span>
									</div>
								</div>

								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDownload(attachment)}
										className="h-8 w-8 p-0"
									>
										<Download className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDelete(attachment._id)}
										className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	)
}
