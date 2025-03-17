import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import { DottedSeparator } from "./DottedSeparator"
import AnalyticsCard from "./AnalysticsCard"
import { WorkspaceAnalyticsResponseType } from "@/features/workspaces/api/useGetWorkSpaceAnalytics"

const formatValueToVariant = (val: number) => {
	if (val > 0) {
		return "up"
	} else if (val < 0) {
		return "down"
	} else {
		return "same"
	}
}

const Analytics = ({ data }: WorkspaceAnalyticsResponseType) => {

	// const dic = useDictionary()
	// TODO i18n

	return (
		<ScrollArea className="border rounded-lg w-full whitespace-nowrap shrink-0">
			<div className="w-full flex flex-row">
				<div className="flex items-center flex-1">
					<AnalyticsCard
						title="Total tasks"
						value={data.taskCount}
						variant={formatValueToVariant(data.taskDifference)}
						increaseValue={data.taskDifference}
					/>
					<DottedSeparator direction="vertical" />
				</div>
				<div className="flex items-center flex-1">
					<AnalyticsCard
						title="Assigned Tasks"
						value={data.assignedTaskCount}
						variant={formatValueToVariant(data.assignedTaskDifference)}
						increaseValue={data.assignedTaskDifference}
					/>
					<DottedSeparator direction="vertical" />
				</div>
				<div className="flex items-center flex-1">
					<AnalyticsCard
						title="Completed Tasks"
						value={data.completedTaskCount}
						variant={formatValueToVariant(data.completedTaskDifference)}
						increaseValue={data.completedTaskDifference}
					/>
					<DottedSeparator direction="vertical" />
				</div>
				<div className="flex items-center flex-1">
					<AnalyticsCard
						title="Overdue Tasks"
						value={data.overdueTaskCount}
						variant={formatValueToVariant(data.overdueTaskDifference)}
						increaseValue={data.overdueTaskDifference}
					/>
					<DottedSeparator direction="vertical" />
				</div>
				<div className="flex items-center flex-1">
					<AnalyticsCard
						title="Incomplete Tasks"
						value={data.incompleteTaskCount}
						variant={formatValueToVariant(data.incompleteTaskDifference)}
						increaseValue={data.incompleteTaskDifference}
					/>
					<DottedSeparator direction="vertical" />
				</div>
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
}

export default Analytics
