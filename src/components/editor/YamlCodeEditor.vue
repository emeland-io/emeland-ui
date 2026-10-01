<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IconCheck, IconCopy } from '@tabler/icons-vue'
import { EditorView, keymap, lineNumbers, highlightActiveLine, placeholder } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { yaml } from '@codemirror/lang-yaml'
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import type { ValidationIssue } from '@/editor/document'
import { useClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  modelValue: string
  issues?: ValidationIssue[]
  readOnly?: boolean
  /** When true, the overlay copy control is disabled (e.g. empty bundle preview). */
  copyDisabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const host = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
const editableCompartment = new Compartment()
const lintCompartment = new Compartment()
const themeCompartment = new Compartment()
const highlightCompartment = new Compartment()

const COPY_ID = 'yaml-code-editor'
const { copy, isCopied } = useClipboard()

function onCopyYaml() {
  if (props.copyDisabled) return
  const text = view?.state.doc.toString() ?? props.modelValue
  void copy(text, COPY_ID)
}

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

function buildHighlightStyle(): HighlightStyle {
  return HighlightStyle.define([
    { tag: t.comment, color: 'var(--color-text-3)', fontStyle: 'italic' },
    { tag: t.propertyName, color: 'var(--color-editor-key)', fontWeight: '600' },
    { tag: t.attributeName, color: 'var(--color-editor-key)', fontWeight: '600' },
    { tag: t.definition(t.propertyName), color: 'var(--color-editor-key)', fontWeight: '600' },
    { tag: t.string, color: 'var(--color-text-1)' },
    { tag: t.number, color: 'var(--color-warning)' },
    { tag: t.bool, color: 'var(--color-accent)' },
    { tag: t.null, color: 'var(--color-accent)' },
    { tag: t.atom, color: 'var(--color-accent)' },
    { tag: t.keyword, color: 'var(--color-editor-key)', fontWeight: '600' },
    { tag: t.punctuation, color: 'var(--color-text-3)' },
    { tag: t.meta, color: 'var(--color-text-3)' },
    { tag: t.name, color: 'var(--color-text-1)' },
    { tag: t.content, color: 'var(--color-text-1)' },
    { tag: t.literal, color: 'var(--color-text-1)' },
  ])
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
        color: 'var(--color-text-3)',
        borderRight: '1px solid var(--color-border-1)',
      },
      '.cm-activeLineGutter': { backgroundColor: 'var(--color-bg-2)' },
      '.cm-activeLine': {
        backgroundColor: 'color-mix(in srgb, var(--color-bg-2) 70%, transparent)',
      },
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

function reconfigureChrome() {
  view?.dispatch({
    effects: [
      themeCompartment.reconfigure(buildTheme()),
      highlightCompartment.reconfigure(syntaxHighlighting(buildHighlightStyle())),
    ],
  })
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
        highlightCompartment.of(syntaxHighlighting(buildHighlightStyle())),
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
    reconfigureChrome()
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
  <div class="relative h-full min-h-0">
    <button
      type="button"
      class="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded border border-border-1 bg-bg-1/95 text-text-3 transition-colors hover:bg-bg-2 hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-bg-1/95 disabled:hover:text-text-3"
      title="Copy YAML"
      aria-label="Copy YAML"
      :disabled="copyDisabled"
      @click="onCopyYaml"
    >
      <IconCheck
        v-if="isCopied(COPY_ID)"
        :size="14"
        :stroke-width="2"
        class="text-accent"
      />
      <IconCopy
        v-else
        :size="14"
        :stroke-width="1.75"
      />
    </button>
    <div
      ref="host"
      class="h-full min-h-0 overflow-hidden rounded border border-border-1 bg-bg-1"
    />
  </div>
</template>
