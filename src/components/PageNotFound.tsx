"use client"
import { useDictionary } from "@/context/DictionaryProvider"
import PageError from "./PageError"

const PageNotFound = () => {
	const dic = useDictionary()

	return <PageError message={dic.pagenotfound} />
}

export default PageNotFound
