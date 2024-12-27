import { useParams } from "next/navigation"

const useCurLang = () => {
	const params = useParams()
    return params['lang']
}

export default useCurLang
