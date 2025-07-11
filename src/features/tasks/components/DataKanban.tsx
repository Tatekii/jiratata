import React, { useCallback, useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { ETaskStatus, IClientTaskWithDetail, TaskStatusType } from "@/features/types"
import KanbanColumnHeader from "./KanbanColumnHeader"
import KanbanCard from "./KanbanCard"

const boards = Object.values(ETaskStatus)

type TasksState = {
	[key in TaskStatusType]: IClientTaskWithDetail[]
}

interface DataKanbanProps {
	data: IClientTaskWithDetail[]
	onChange: (tasks: { _id: string; status: TaskStatusType; position: number }[]) => void
}

const DataKanban = ({ data, onChange }: DataKanbanProps) => {
	const [tasks, setTasks] = useState<TasksState>(() => {
		const initialTasks: TasksState = {
			[ETaskStatus.BACKLOG]: [],
			[ETaskStatus.TODO]: [],
			[ETaskStatus.IN_PROGRESS]: [],
			[ETaskStatus.IN_REVIEW]: [],
			[ETaskStatus.DONE]: [],
		}

		data.forEach((task) => {
			initialTasks[task.status].push(task)
		})

		Object.keys(initialTasks).forEach((status) => {
			initialTasks[status as TaskStatusType].sort((a, b) => a.position - b.position)
		})

		return initialTasks
	})

	useEffect(() => {
		const newTasks: TasksState = {
			[ETaskStatus.BACKLOG]: [],
			[ETaskStatus.TODO]: [],
			[ETaskStatus.IN_PROGRESS]: [],
			[ETaskStatus.IN_REVIEW]: [],
			[ETaskStatus.DONE]: [],
		}

		data.forEach((task) => {
			newTasks[task.status].push(task)
		})

		Object.keys(newTasks).forEach((status) => {
			newTasks[status as TaskStatusType].sort((a, b) => a.position - b.position)
		})

		setTasks(newTasks)
	}, [data])

	const onDragEnd = useCallback(
		(result: DropResult) => {
			if (!result.destination) return

			const { source, destination } = result
			const sourceStatus = source.droppableId as TaskStatusType
			const destStatus = destination.droppableId as TaskStatusType

			let updatesPayload: { _id: string; status: TaskStatusType; position: number }[] = []

			setTasks((prevTasks) => {
				const newTasks = { ...prevTasks }

				const sourceColumn = [...newTasks[sourceStatus]]

				// 从source中删除
				const [movedTask] = sourceColumn.splice(source.index, 1)

				if (!movedTask) {
					console.error("No task found at the source index")
					return prevTasks
				}

				// 更新status？
				const updatedMovedTask = sourceStatus !== destStatus ? { ...movedTask, status: destStatus } : movedTask

				// 更新source列
				newTasks[sourceStatus] = sourceColumn

				// 更新target列
				const destColumn = [...newTasks[destStatus]]
				destColumn.splice(destination.index, 0, updatedMovedTask)
				newTasks[destStatus] = destColumn

				// 准备后端task数据更新
				updatesPayload = []

				// 首先加入拖动项
				updatesPayload.push({
					_id: updatedMovedTask._id,
					status: destStatus,
					position: Math.min((destination.index + 1) * 1000, 1_000_000),
				})

				// 更新位置被往后挤的目标列中task
				newTasks[destStatus].forEach((task, index) => {
					if (task && task._id !== updatedMovedTask._id) {
						const newPosition = Math.min((index + 1) * 1000, 1_000_000)
						if (task.position !== newPosition) {
							updatesPayload.push({
								_id: task._id,
								status: destStatus,
								position: newPosition,
							})
						}
					}
				})

				// 如果跨列了，更新source列中排序位置
				if (sourceStatus !== destStatus) {
					newTasks[sourceStatus].forEach((task, index) => {
						if (task) {
							const newPosition = Math.min((index + 1) * 1000, 1_000_000)
							if (task.position !== newPosition) {
								updatesPayload.push({
									_id: task._id,
									status: sourceStatus,
									position: newPosition,
								})
							}
						}
					})
				}

				return newTasks
			})

			onChange(updatesPayload)
		},
		[onChange]
	)

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<div className="flex overflow-x-auto">
				{boards.map((board) => {
					return (
						<div key={board} className="flex-1 mx-2 bg-muted p-1.5 rounded-md min-w-[200px]">
							<KanbanColumnHeader board={board} taskCount={tasks[board].length} />
							<Droppable droppableId={board}>
								{(provided) => (
									<div
										{...provided.droppableProps}
										ref={provided.innerRef}
										className="min-h-[200px] py-1.5"
									>
										{tasks[board].map((task, index) => (
											<Draggable key={task._id} draggableId={task._id} index={index}>
												{(provided) => (
													<div
														ref={provided.innerRef}
														{...provided.draggableProps}
														{...provided.dragHandleProps}
													>
														<KanbanCard task={task} />
													</div>
												)}
											</Draggable>
										))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</div>
					)
				})}
			</div>
		</DragDropContext>
	)
}

export default DataKanban
