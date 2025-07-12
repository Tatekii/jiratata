"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Reply, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

import { useCreateComment } from "@/features/comments/api/useCreateComment"
import { useGetComments } from "@/features/comments/api/useGetComments"
import { IClientComment } from "@/features/types"
import MemberAvatar from "@/features/members/components/MemberAvatar"

const commentSchema = z.object({
	content: z.string().min(1, "评论内容不能为空"),
})

interface TaskCommentsProps {
	taskId: string
}

export const TaskComments = ({ taskId }: TaskCommentsProps) => {
	const [replyingTo, setReplyingTo] = useState<string | null>(null)
	const { data: response, isLoading } = useGetComments({ taskId })
	const { mutate: createComment, isPending } = useCreateComment()

	// 从响应中提取 comments 数据
	const comments = response && "data" in response ? response.data : []

	const form = useForm<z.infer<typeof commentSchema>>({
		resolver: zodResolver(commentSchema),
		defaultValues: {
			content: "",
		},
	})

	const onSubmit = (values: z.infer<typeof commentSchema>) => {
		createComment(
			{
				content: values.content,
				taskId,
				mentions: [], // TODO: 实现提及功能
				parentCommentId: replyingTo || undefined,
			},
			{
				onSuccess: () => {
					form.reset()
					setReplyingTo(null)
				},
			}
		)
	}

	const renderComment = (comment: IClientComment, isReply = false) => (
		<div key={comment._id} className={`${isReply ? "ml-8" : ""} mb-4`}>
			<div className="flex gap-3">
				<MemberAvatar className="w-8 h-8" name={comment.author?.name || "Unknown"} />
				<div className="flex-1">
					<div className="bg-gray-50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-medium text-sm">{comment.author?.name || "Unknown User"}</span>
							<span className="text-xs text-gray-500">
								{formatDistanceToNow(new Date(comment.createdAt), {
									addSuffix: true,
									locale: zhCN,
								})}
							</span>
							{comment.isEdited && (
								<Badge variant="outline" className="text-xs">
									已编辑
								</Badge>
							)}
						</div>
						<p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
					</div>
					{!isReply && (
						<Button
							variant="ghost"
							size="sm"
							className="mt-1 h-6 px-2 text-xs"
							onClick={() => setReplyingTo(comment._id)}
						>
							<Reply className="w-3 h-3 mr-1" />
							回复
						</Button>
					)}
				</div>
			</div>
		</div>
	)

	// 组织评论结构：顶级评论和回复
	const organizeComments = (comments: IClientComment[]) => {
		const topLevelComments = comments.filter((c) => !c.parentCommentId)
		const replies = comments.filter((c) => c.parentCommentId)

		return topLevelComments.map((comment) => ({
			...comment,
			replies: replies.filter((reply) => reply.parentCommentId === comment._id),
		}))
	}

	const organizedComments = organizeComments(comments || [])

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MessageCircle className="w-5 h-5" />
						评论
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
					<MessageCircle className="w-5 h-5" />
					评论 ({comments?.length || 0})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* 添加评论表单 */}
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
						{replyingTo && (
							<div className="flex items-center gap-2 text-sm text-gray-600">
								<Reply className="w-4 h-4" />
								正在回复...
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setReplyingTo(null)}
									className="h-6 px-2"
								>
									取消
								</Button>
							</div>
						)}
						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Textarea
											{...field}
											placeholder={replyingTo ? "写一个回复..." : "写一个评论..."}
											className="resize-none"
											rows={3}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end">
							<Button type="submit" disabled={isPending} size="sm">
								<Send className="w-4 h-4 mr-1" />
								{replyingTo ? "回复" : "评论"}
							</Button>
						</div>
					</form>
				</Form>

				{/* 评论列表 */}
				<div className="space-y-4">
					{organizedComments.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<div className="flex justify-center">
								<MessageCircle className="w-12 h-12 mb-2 opacity-30" />
							</div>

							<p>还没有评论，成为第一个评论的人吧！</p>
						</div>
					) : (
						organizedComments.map((comment) => (
							<div key={comment._id}>
								{renderComment(comment)}
								{/* 渲染回复 */}
								{comment.replies?.map((reply: IClientComment) => renderComment(reply, true))}
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	)
}
