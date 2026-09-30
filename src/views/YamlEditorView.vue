<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IconCode,
  IconForms,
  IconDownload,
  IconCopy,
  IconCheck,
  IconPlus,
  IconTerminal2,
  IconStack2,
} from '@tabler/icons-vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import YamlCodeEditor from '@/components/editor/YamlCodeEditor.vue'
import ResourceForm from '@/components/editor/ResourceForm.vue'
import ValidationIssues from '@/components/editor/ValidationIssues.vue'
import BundleList from '@/components/editor/BundleList.vue'
import { RESOURCE_TYPE_BY_NAME, RESOURCE_TYPE_DEFS, blankDocument } from '@/editor/kinds'
import {
  bundleDownloadFilename,
  downloadFilename,
  downloadYaml,
  documentLabel,
  documentResourceId,
  newBundleItemId,
  parseDocument,
  stringifyBundle,
  stringifyDocument,
  validateBundle,
  validateDocument,
  validateYamlText,
  type BundleItem,
  type IngressDocument,
  type ValidationIssue,
} from '@/editor/document'
import type { BundleRefOption } from '@/components/editor/BundleRefInput.vue'
import { useClipboard } from '@/composables/useClipboard'
import { emelandctlCreateScript } from '@/editor/emelandctl'

type EditorMode = 'form' | 'yaml' | 'bundle'

const mode = ref<EditorMode>('form')
const modeOptions = [
  { value: 'form', label: 'Form', icon: IconForms },
  { value: 'yaml', label: 'YAML', icon: IconCode },
  { value: 'bundle', label: 'Bundle', icon: IconStack2 },
]

const bundle = ref<BundleItem[]>([])
const activeId = ref<string | null>(null)

const document = ref<IngressDocument>(blankDocument('System'))
const yamlText = ref(stringifyDocument(document.value))
const yamlParseIssues = ref<ValidationIssue[]>([])
const switchError = ref<string | null>(null)

const { copy, isCopied } = useClipboard()

const resourceTypeDef = computed(() => RESOURCE_TYPE_BY_NAME[document.value.kind] ?? RESOURCE_TYPE_DEFS[0]!)

const activeResourceType = computed(() => {
  if (mode.value !== 'yaml') return document.value.kind
  const { document: parsed } = parseDocument(yamlText.value)
  return parsed?.kind ?? document.value.kind
})

const hasBundle = computed(() => bundle.value.length > 0)

const bundleDocs = computed(() => bundle.value.map((i) => i.document))

const bundleValidation = computed(() => validateBundle(bundleDocs.value))

const bundleYaml = computed(() =>
  hasBundle.value
    ? stringifyBundle(bundleDocs.value)
    : '# Bundle is empty\n# Add documents with “Add to bundle”, then view them here.\n',
)

const validation = computed(() => {
  if (mode.value === 'bundle') {
    return hasBundle.value
      ? bundleValidation.value
      : { ok: false, issues: [{ path: '', message: 'Bundle is empty — add documents first' }] }
  }
  if (mode.value === 'yaml') {
    return validateYamlText(yamlText.value)
  }
  return validateDocument(document.value)
})

const fieldErrors = computed(() => {
  const map: Record<string, string> = {}
  for (const issue of validation.value.issues) {
    const key = issue.path.replace(/^spec\./, '')
    if (key && !map[key]) map[key] = issue.message
    if (issue.path && !map[issue.path]) map[issue.path] = issue.message
  }
  return map
})

const activeExportText = computed(() => {
  if (mode.value === 'yaml') return yamlText.value
  return stringifyDocument(document.value)
})

const exportText = computed(() =>
  hasBundle.value ? stringifyBundle(bundleDocs.value) : activeExportText.value,
)

const canExport = computed(() =>
  hasBundle.value ? bundleValidation.value.ok : validation.value.ok,
)

const canAddToBundle = computed(() => {
  if (mode.value === 'bundle') return false
  if (mode.value === 'yaml') return validateYamlText(yamlText.value).ok
  return validateDocument(document.value).ok
})

const bundleRefs = computed<BundleRefOption[]>(() => {
  const selfId = documentResourceId(document.value)
  const opts: BundleRefOption[] = []
  for (const item of bundle.value) {
    const id = documentResourceId(item.document)
    if (!id || id === selfId) continue
    opts.push({
      id,
      resourceType: item.document.kind,
      label: documentLabel(item.document),
    })
  }
  return opts
})

function cloneDoc(doc: IngressDocument): IngressDocument {
  return JSON.parse(JSON.stringify(doc)) as IngressDocument
}

function currentDocument(): IngressDocument | null {
  if (mode.value === 'yaml') {
    return parseDocument(yamlText.value).document ?? null
  }
  return document.value
}

function loadDocument(doc: IngressDocument) {
  document.value = cloneDoc(doc)
  yamlText.value = stringifyDocument(document.value)
  yamlParseIssues.value = []
  switchError.value = null
}

function syncActiveToBundle() {
  if (!activeId.value || mode.value === 'bundle') return
  const doc = currentDocument()
  if (!doc) return
  const idx = bundle.value.findIndex((i) => i.id === activeId.value)
  if (idx < 0) return
  bundle.value[idx] = { id: activeId.value, document: cloneDoc(doc) }
}

watch(
  [document, yamlText, mode],
  () => {
    syncActiveToBundle()
  },
  { deep: true },
)

function onNewResourceType(resourceType: string) {
  activeId.value = null
  loadDocument(blankDocument(resourceType))
}

function onSelectBundleItem(id: string) {
  const item = bundle.value.find((i) => i.id === id)
  if (!item) return
  activeId.value = id
  loadDocument(item.document)
  if (mode.value === 'bundle') mode.value = 'form'
}

function onRemoveBundleItem(id: string) {
  const wasActive = activeId.value === id
  bundle.value = bundle.value.filter((i) => i.id !== id)
  if (!bundle.value.length && mode.value === 'bundle') {
    mode.value = 'form'
  }
  if (!wasActive) return
  const next = bundle.value[0]
  if (next) {
    activeId.value = next.id
    loadDocument(next.document)
  } else {
    activeId.value = null
    loadDocument(blankDocument(document.value.kind || 'System'))
  }
}

function onAddToBundle() {
  if (!canAddToBundle.value) return
  const doc = currentDocument()
  if (!doc) return

  if (activeId.value) {
    const idx = bundle.value.findIndex((i) => i.id === activeId.value)
    if (idx >= 0) {
      bundle.value[idx] = { id: activeId.value, document: cloneDoc(doc) }
      return
    }
  }

  const id = newBundleItemId()
  bundle.value.push({ id, document: cloneDoc(doc) })
  activeId.value = id
}

function onSpecUpdate(spec: Record<string, unknown>) {
  document.value = {
    ...document.value,
    spec: { ...spec },
  }
  // Keep yaml buffer in sync while editing the form so mode switches can't
  // revive a stale document and autosave it over the bundle.
  yamlText.value = stringifyDocument(document.value)
  syncActiveToBundle()
}

function setMode(next: string) {
  const target = next as EditorMode
  if (target === mode.value) return
  switchError.value = null

  if (target === 'bundle') {
    if (mode.value === 'form') {
      yamlText.value = stringifyDocument(document.value)
    } else if (mode.value === 'yaml') {
      const parsed = parseDocument(yamlText.value).document
      if (parsed) document.value = parsed
    }
    syncActiveToBundle()
    mode.value = 'bundle'
    return
  }

  if (target === 'yaml') {
    if (mode.value === 'form' || mode.value === 'bundle') {
      yamlText.value = stringifyDocument(document.value)
    }
    yamlParseIssues.value = []
    mode.value = 'yaml'
    return
  }

  if (mode.value === 'yaml') {
    const { document: parsed, issues } = parseDocument(yamlText.value)
    if (!parsed) {
      switchError.value = issues[0]?.message ?? 'Cannot switch to form: invalid YAML'
      yamlParseIssues.value = issues
      return
    }
    document.value = parsed
    yamlParseIssues.value = []
  }
  mode.value = 'form'
}

function onCopy() {
  if (!canExport.value) return
  void copy(exportText.value, exportText.value)
}

function emelandctlSnippet(): string {
  const docs = hasBundle.value
    ? bundleDocs.value
    : [currentDocument() ?? document.value]
  return emelandctlCreateScript(docs)
}

const emelandctlCopyKey = 'emelandctl-snippet'

function onCopyEmelandctl() {
  if (!canExport.value) return
  const text = emelandctlSnippet()
  if (!text.trim()) return
  void copy(text, emelandctlCopyKey)
}

function onDownload() {
  if (!canExport.value) return
  if (hasBundle.value) {
    downloadYaml(exportText.value, bundleDownloadFilename())
    return
  }
  const doc = currentDocument() ?? document.value
  downloadYaml(exportText.value, downloadFilename(doc))
}

const displayIssues = computed(() => {
  if (mode.value === 'bundle') return validation.value.issues
  if (mode.value === 'yaml' && yamlParseIssues.value.length) {
    return [...yamlParseIssues.value, ...validation.value.issues]
  }
  return validation.value.issues
})

const exportHint = computed(() => {
  if (hasBundle.value) {
    return `Download / copy exports all ${bundle.value.length} bundle documents as one multi-doc YAML`
  }
  return 'Download / copy exports the active document'
})
</script>

<template>
  <div class="flex h-full flex-col">
    <ViewHeader title="YAML editor">
      <template #actions>
        <div class="ml-auto flex items-center gap-2">
          <ViewModeSwitch
            :model-value="mode"
            :options="modeOptions"
            @update:model-value="setMode"
          />

          <button
            type="button"
            class="inline-flex h-7 items-center gap-1.5 rounded border border-border-1 px-2.5 text-meta text-text-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canAddToBundle"
            :title="
              activeId
                ? 'Update this document in the bundle'
                : 'Add the active document to the bundle'
            "
            @click="onAddToBundle"
          >
            <IconPlus
              :size="13"
              :stroke-width="1.75"
            />
            {{ activeId ? 'Update bundle' : 'Add to bundle' }}
          </button>

          <button
            type="button"
            class="inline-flex h-7 items-center gap-1.5 rounded border border-border-1 px-2.5 text-meta text-text-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canExport"
            :title="exportHint"
            @click="onCopy"
          >
            <IconCheck
              v-if="isCopied(exportText)"
              :size="13"
              :stroke-width="2"
              class="text-accent"
            />
            <IconCopy
              v-else
              :size="13"
              :stroke-width="1.75"
            />
            Copy
          </button>

          <button
            type="button"
            class="inline-flex h-7 items-center gap-1.5 rounded border border-border-1 px-2.5 font-mono text-meta text-text-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canExport"
            title="Copy emelandctl create … command(s) for the active doc or bundle"
            @click="onCopyEmelandctl"
          >
            <IconCheck
              v-if="isCopied(emelandctlCopyKey)"
              :size="13"
              :stroke-width="2"
              class="text-accent"
            />
            <IconTerminal2
              v-else
              :size="13"
              :stroke-width="1.75"
            />
            emelandctl
          </button>

          <button
            type="button"
            class="inline-flex h-7 items-center gap-1.5 rounded border border-border-1 bg-bg-1 px-2.5 text-meta text-text-1 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canExport"
            :title="exportHint"
            @click="onDownload"
          >
            <IconDownload
              :size="13"
              :stroke-width="1.75"
            />
            Download{{ hasBundle ? ` (${bundle.length})` : '' }}
          </button>
        </div>
      </template>
    </ViewHeader>

    <div class="flex min-h-0 flex-1">
      <aside class="flex min-h-0 w-56 shrink-0 flex-col border-r border-border-1 bg-bg-0">
        <div class="flex min-h-0 flex-[7] flex-col">
          <div class="shrink-0 border-b border-border-1 px-3 py-2 text-meta font-semibold uppercase tracking-widest text-text-4">
            Resource types
          </div>
          <nav
            class="min-h-0 flex-1 overflow-y-auto p-2"
            aria-label="Resource types"
          >
            <button
              v-for="k in RESOURCE_TYPE_DEFS"
              :key="k.resourceType"
              type="button"
              class="mb-0.5 flex w-full items-center rounded px-2.5 py-1.5 text-left text-meta font-medium transition-colors"
              :class="
                !activeId && activeResourceType === k.resourceType
                  ? 'bg-accent/10 text-accent-text'
                  : 'text-text-3 hover:bg-bg-1 hover:text-text-1'
              "
              :title="k.description"
              @click="onNewResourceType(k.resourceType)"
            >
              {{ k.label }}
            </button>
          </nav>
        </div>

        <BundleList
          class="min-h-0 flex-[3] border-t border-border-1"
          :items="bundle"
          :selected-id="activeId"
          @select="onSelectBundleItem"
          @remove="onRemoveBundleItem"
        />
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <div class="shrink-0 space-y-2 border-b border-border-1 px-5 py-3">
          <p class="text-label text-text-3">
            Guided editor for modelsrv ingress documents. Queue several into a bundle, then download
            one multi-doc YAML for
            <span class="font-mono text-text-2">emelandctl</span>
            / modelsrv.
          </p>
          <ValidationIssues
            :issues="displayIssues"
            :valid="validation.ok && !switchError"
          />
          <p
            v-if="switchError"
            class="text-meta text-error"
          >
            {{ switchError }}
          </p>
          <p
            v-if="hasBundle && !bundleValidation.ok"
            class="text-meta text-error"
          >
            Bundle has validation issues — fix or remove invalid documents before export.
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-hidden">
          <div
            v-if="mode === 'form'"
            class="h-full overflow-y-auto px-5 py-5"
          >
            <div class="mx-auto max-w-2xl">
              <div class="mb-4">
                <h2 class="text-title font-medium text-text-1">
                  {{ resourceTypeDef.label }}
                </h2>
                <p class="mt-1 text-label text-text-3">
                  {{ resourceTypeDef.description }}
                </p>
              </div>
              <ResourceForm
                :resource-type-def="resourceTypeDef"
                :model-value="document.spec"
                :field-errors="fieldErrors"
                :bundle-refs="bundleRefs"
                @update:model-value="onSpecUpdate"
              />
            </div>
          </div>

          <div
            v-else-if="mode === 'yaml'"
            class="h-full p-3"
          >
            <YamlCodeEditor
              v-model="yamlText"
              :issues="displayIssues"
            />
          </div>

          <div
            v-else
            class="flex h-full flex-col gap-2 p-3"
          >
            <p class="shrink-0 text-meta text-text-4">
              Read-only preview of the multi-document YAML that Copy / Download export
              <span v-if="hasBundle">({{ bundle.length }} docs, separated by ---)</span>.
            </p>
            <div class="min-h-0 flex-1">
              <YamlCodeEditor
                :model-value="bundleYaml"
                :issues="displayIssues"
                read-only
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
