import { useEffect, useId, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/shared/lib/index'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
})

interface MermaidBlockProps {
  code: string
  className?: string
}

export function MermaidBlock({ code, className }: MermaidBlockProps) {
  const id = useId().replace(/:/g, '_')
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, code.trim())
        if (!cancelled) {
          setSvg(renderedSvg)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Mermaid 렌더링 실패')
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [code, id])

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive', className)}>
        <p className="font-medium">다이어그램 렌더링 오류</p>
        <pre className="mt-1 text-xs opacity-70">{error}</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('not-prose flex justify-center overflow-x-auto rounded-lg border bg-background p-4', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
