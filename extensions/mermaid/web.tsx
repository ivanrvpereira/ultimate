import { CodeIcon, Maximize2Icon, WorkflowIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Suspense, use, useId, useLayoutEffect, useMemo, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { CodeBlock, CodeBlockContainer, CodeBlockCopyButton, CodeBlockHeader } from 'streamdown'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { defineWebExtension } from '@/sdk'
import type { CodeBlockRenderer } from '@/sdk'

// Pele (about 230 kB gzipped) loads when a page first shows a finished diagram, not with the app.
type Pele = typeof import('pele')
let pele: Promise<Pele> | undefined
const loadPele = () => (pele ??= import('pele'))

/** Pele's colours in the theme's tokens; CSS variables, so a theme switch needs no new render. */
const theme =
  '[--pele-bg:var(--terminal)] [--pele-fg:var(--foreground)] [--pele-muted:var(--muted-foreground)] ' +
  '[--pele-line:var(--muted-foreground)] [--pele-surface:var(--card)] [--pele-surface-alt:var(--accent)] ' +
  '[--pele-border:var(--input)] [--pele-accent:var(--brand)]'

type IconButtonProps = ComponentProps<'button'> & { icon: LucideIcon; label: string }

/** Props pass through, so a `DialogTrigger asChild` can wire it up. */
function IconButton({ icon: Icon, label, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className="cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground"
      title={label}
      type="button"
      {...props}
    >
      <Icon aria-hidden size={14} />
    </button>
  )
}

/** The code block's own actions box, top right, as Streamdown's `CodeBlock` draws it. */
function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute top-2 right-2 z-10 flex items-center">
      <div
        className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-md border border-sidebar bg-sidebar/80 px-1.5 py-1 supports-[backdrop-filter]:bg-sidebar/70 supports-[backdrop-filter]:backdrop-blur"
        data-streamdown="code-block-actions"
      >
        {children}
      </div>
    </div>
  )
}

type DrawingProps = {
  code: string
  mount: Pele['mount']
  idPrefix: string
  zoom: boolean
  className: string
}

/**
 * Pele drawing into its element, laid out for the element's width and again when it resizes: below 640 px a
 * left-to-right chart too wide for it turns top-to-bottom when that is narrower, and what is still too wide shrinks.
 */
function Drawing({ code, mount, idPrefix, zoom, className }: DrawingProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    if (!element) return undefined
    const mounted = mount(element, code, { fontSize: 14, idPrefix, zoom: zoom && { always: true } })
    return () => mounted.destroy()
  }, [code, element, idPrefix, mount, zoom])
  return <div className={`${className} ${theme}`} ref={setElement} />
}

function Diagram({ code, core }: { code: string; core: ReactNode }) {
  const { mount, render } = use(loadPele())
  const idPrefix = `mermaid-${useId().replace(/\W/g, '')}-`
  const parses = useMemo(() => {
    try {
      return !!render(code)
    } catch {
      return false
    }
  }, [code, render])
  const [source, setSource] = useState(false)
  if (!parses) return core
  if (source)
    return (
      <CodeBlock code={code} language="mermaid" lineNumbers={false}>
        <IconButton icon={WorkflowIcon} label="Show diagram" onClick={() => setSource(false)} />
        <CodeBlockCopyButton />
      </CodeBlock>
    )
  return (
    <CodeBlockContainer language="mermaid">
      <CodeBlockHeader language="mermaid" />
      <Actions>
        {/* The trigger inside the dialog's root, so closing it returns focus to the button. */}
        <Dialog>
          <DialogTrigger asChild>
            <IconButton icon={Maximize2Icon} label="Expand" />
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            className="flex h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 bg-terminal p-0 sm:max-w-[calc(100vw-4rem)]"
          >
            <DialogTitle className="sr-only">Mermaid diagram</DialogTitle>
            <Drawing
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6 [--pele-zoom-bottom:12px] [--pele-zoom-right:12px] [--pele-zoom-top:auto] [&_svg]:max-h-full"
              code={code}
              idPrefix={`${idPrefix}expanded-`}
              mount={mount}
              zoom
            />
          </DialogContent>
        </Dialog>
        <IconButton icon={CodeIcon} label="Show code" onClick={() => setSource(true)} />
        <CodeBlockCopyButton code={code} />
      </Actions>
      <Drawing
        className="px-3 pt-1 pb-3 [&_svg]:mx-auto [&_svg]:block"
        code={code}
        idPrefix={idPrefix}
        mount={mount}
        zoom={false}
      />
    </CodeBlockContainer>
  )
}

/** A diagram once the block is complete and parses; until then, or when Pele cannot read it, the plain code. */
const Mermaid: CodeBlockRenderer = ({ code, core, incomplete }) =>
  incomplete ? (
    core
  ) : (
    <Suspense fallback={core}>
      <Diagram code={code} core={core} />
    </Suspense>
  )

export default defineWebExtension({ codeBlocks: { mermaid: Mermaid } })
