import { Locale } from "@/lib/i18n-config"
import { notFound } from "next/navigation"
import { FunctionComponent } from "react"

interface CatchAllHomePageProps {
	params: Promise<{ slug: Locale }>
}

const CatchAllHomePage: FunctionComponent<CatchAllHomePageProps> = async ({ params }) => {
	const url = (await params).slug

	if (url.length) {
		notFound()
	}

	return null
}

export default CatchAllHomePage
