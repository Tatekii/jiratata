import { FC, PropsWithChildren } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import style from "./styles.module.css"

const AuthLayout: FC<PropsWithChildren> = ({ children }) => {
	return (
		<main className="bg-neutral-100 min-h-screen">
			<div className="mx-auto max-w-screen-2xl p-4">
				<nav className="flex justify-between items-center">
					<div className={style["logo-wrapper"]}>
						<Image src="./logo.svg" alt={"logo"} objectFit={"cover"} fill={true} />
					</div>
					<Button variant={"secondary"}>Sign Up</Button>
				</nav>
			</div>
			<div className="flex flex-col items-center justify-center pt-4 md:pt-14 ">{children}</div>
		</main>
	)
}

export default AuthLayout
