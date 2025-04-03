import packageJson from '../../package.json'

export function Version() {
  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-400 pointer-events-none select-none">
      v{packageJson.version}
    </div>
  )
}