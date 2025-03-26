/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: "./",
})

// Add any custom config to be passed to Jest
const config: Config = {
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	coverageProvider: "v8",
	testEnvironment: "jsdom",
	// Add more setup options before each test is run
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^nanoid$": "<rootDir>/src/lib/__mocks__/nanoid.ts",
		"^nanoid/.*$": "<rootDir>/src/lib/__mocks__/nanoid.ts",
	},
	preset: "ts-jest",
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.json",
				useESM: true,
			},
		],
		"^.+\\.m?js$": ["babel-jest", { presets: ["@babel/preset-env"] }],
	},
	transformIgnorePatterns: [
		"/node_modules/(?!(uuid|hono|node-fetch-native-with-agent|node-appwrite)/.*)"
	],
	testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "mjs"],
	globals: {
		"ts-jest": {
			tsconfig: "tsconfig.json",
			isolatedModules: true,
			useESM: true,
		},
	},
	extensionsToTreatAsEsm: [".ts", ".tsx"]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
