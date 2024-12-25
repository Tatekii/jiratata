import { Loader } from "lucide-react"

const ContentLoader = () => {
	return (
		<div className="flex items-center justify-center">
			<Loader className="size-6 animate-spin text-muted-foreground" />
		</div>
	)
}

export default ContentLoader
