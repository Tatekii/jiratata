"use server"
import { redirect } from "next/navigation"

// 暂时禁用 OAuth 功能，直到实现 MongoDB 版本
export async function signUpWithGithub() {
  // TODO: 实现基于 MongoDB 的 GitHub OAuth
  console.log("GitHub OAuth 尚未实现")
  return redirect("/signup?error=oauth_not_implemented")
}

export async function signUpWithGoogle() {
  // TODO: 实现基于 MongoDB 的 Google OAuth  
  console.log("Google OAuth 尚未实现")
  return redirect("/signup?error=oauth_not_implemented")
}
