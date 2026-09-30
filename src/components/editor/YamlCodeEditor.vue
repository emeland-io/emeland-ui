<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { yaml } from '@codemirror/lang-yaml'
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import type { ValidationIssue } from '@/editor/document'

const props = defineProps<{
  modelValue: string
  issues?: ValidationIssue[]
  readOnly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const host = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
const editableCompartment = new Compartment()
const lintCompartment = new Compartment()
const themeCompartment = new Compartment()

function issuesToDiagnostics(doc: EditorState, issues: ValidationIssue[]): Diagnostic[] {
  // Map path-based issues to the whole document; YAML AST line mapping is out of scope for v1
  if (!issues.length) return []
  const from = 0
  const to = Math.min(doc.doc.length, Math.max(1, doc.doc.line(1).to))
  return issues.map((issue) => ({
    from,
    to,
    severity: 'error' as const,
    message: issue.path ? `${issue.path}: ${issue.message}` : issue.message,
  }))
}

function buildTheme(): ReturnType<typeof EditorView.theme> {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light'
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '13px',
        backgroundColor: 'var(--color-bg-1)',
        color: 'var(--color-text-1)',
      },
      '.cm-content': {
        fontFamily: 'var(--font-mono)',
        caretColor: 'var(--color-accent)',
        padding: '12px 0',
      },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-accent)' },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 28%, transparent)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--color-bg-1)',
        color: 'var(--color-text-4)',
        borderRight: '1px solid var(--color-border-1)',
      },
      '.cm-activeLineGutter': { backgroundColor: 'var(--color-bg-2)' },
      '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-bg-2) 70%, transparent)' },
      '.cm-foldPlaceholder': {
        backgroundColor: 'var(--color-bg-2)',
        border: 'none',
        color: 'var(--color-text-3)',
      },
      '.cm-tooltip': {
        backgroundColor: 'var(--color-bg-2)',
        color: 'var(--color-text-1)',
        border: '1px solid var(--color-border-1)',
      },
      '.cm-diagnostic-error': { borderLeftColor: 'var(--color-error)' },
    },
    { dark },
  )
}

function makeLinter() {
  return linter((view) => issuesToDiagnostics(view.state, props.issues ?? []))
}

onMounted(() => {
  if (!host.value) return

  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        yaml(),
        placeholder('version: emeland.io/v1\nkind: System\nspec:\n  …'),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        themeCompartment.of(buildTheme()),
        editableCompartment.of(EditorView.editable.of(!props.readOnly)),
        lintCompartment.of([lintGutter(), makeLinter()]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
        EditorView.lineWrapping,
      ],
    }),
  })

  const observer = new MutationObserver(() => {
    view?.dispatch({ effects: themeCompartment.reconfigure(buildTheme()) })
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  onBeforeUnmount(() => observer.disconnect())
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(
  () => props.modelValue,
  (value) => {
    if (!view) return
    if (view.state.doc.toString() === value) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    })
  },
)

watch(
  () => props.readOnly,
  (ro) => {
    view?.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(!ro)),
    })
  },
)

watch(
  () => props.issues,
  () => {
    view?.dispatch({
      effects: lintCompartment.reconfigure([lintGutter(), makeLinter()]),
    })
  },
  { deep: true },
)
</script>

<template>
  <div
    ref="host"
    class="h-full min-h-0 overflow-hidden rounded border border-border-1 bg-bg-1"
  />
</template>
