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
  IconSearch,
  IconX,
} from '@tabler/icons-vue'
import ViewHeader from '@/components/view/ViewHeader.vue'
import ViewModeSwitch from '@/components/ViewModeSwitch.vue'
import ListPaneBar from '@/components/view/ListPaneBar.vue'
import ResourceListRow from '@/components/list/ResourceListRow.vue'
import YamlCodeEditor from '@/components/editor/YamlCodeEditor.vue'
import ResourceForm from '@/components/editor/ResourceForm.vue'
import ValidationIssues from '@/components/editor/ValidationIssues.vue'
import BundleList from '@/components/editor/BundleList.vue'
import {
  RESOURCE_TYPE_BY_NAME,
  RESOURCE_TYPE_DEFS,
  blankDocument,
  phaseLabel,
} from '@/editor/kinds'
import {
  bundleDownloadFilename,
  downloadFilename,
  downloadYaml,
  documentLabel,
  documentResourceId,
  issuesToFieldErrors,
  loadPersistedBundle,
  newBundleItemId,
  parseDocument,
  persistBundle,
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
import { matchesQuery } from '@/utils/search'

type EditorMode = 'form' | 'yaml' | 'bundle'

const mode = ref<EditorMode>('form')
const modeOptions = [
  { value: 'form', label: 'Form', icon: IconForms },
  { value: 'yaml', label: 'YAML', icon: IconCode },
  { value: 'bundle', label: 'Bundle', icon: IconStack2 },
]

const DEFAULT_RESOURCE_TYPE = RESOURCE_TYPE_DEFS[0]!.resourceType

const bundle = ref<BundleItem[]>(loadPersistedBundle())
/** null = drafting a doc not yet in the bundle */
const activeId = ref<string | null>(null)

const document = ref<IngressDocument>(blankDocument(DEFAULT_RESOURCE_TYPE))
const yamlText = ref(stringifyDocument(document.value))
const yamlParseIssues = ref<ValidationIssue[]>([])
const switchError = ref<string | null>(null)
const typeSearch = ref('')

const filteredResourceTypes = computed(() =>
  RESOURCE_TYPE_DEFS.filter((k) =>
    matchesQuery(
      typeSearch.value,
      k.label,
      k.resourceType,
      k.description,
      k.phase,
      k.phase ? phaseLabel(k.phase) : undefined,
    ),
  ),
)

const { copy, isCopied } = useClipboard()

watch(
  bundle,
  (items) => {
    persistBundle(items)
  },
  { deep: true },
)

const resourceTypeDef = computed(
  () => RESOURCE_TYPE_BY_NAME[document.value.kind] ?? RESOURCE_TYPE_DEFS[0]!,
)

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
      : { ok: false, issues: [{ path: '', message: 'Bundle is empty. Add documents first' }] }
  }
  if (mode.value === 'yaml') {
    return validateYamlText(yamlText.value)
  }
  return validateDocument(document.value)
})

const fieldErrors = computed(() => issuesToFieldErrors(validation.value.issues))

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
  // JSON round-trip: structuredClone cannot clone Vue reactive proxies
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
    loadDocument(blankDocument(document.value.kind || DEFAULT_RESOURCE_TYPE))
  }
}

function onClearBundle() {
  bundle.value = []
  activeId.value = null
  if (mode.value === 'bundle') mode.value = 'form'
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
    // Flush form edits into yamlText so Bundle→YAML doesn't reopen stale text
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
  const docs = hasBundle.value ? bundleDocs.value : [currentDocument() ?? document.value]
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

const editingFromBundle = computed(() => !!activeId.value && mode.value !== 'bundle')

const activeBundleLabel = computed(() => documentLabel(document.value))
</script>

<template>
  <div class="flex h-full min-w-0 flex-col overflow-hidden">
    <ViewHeader title="YAML editor">
      <template #actions>
        <div class="flex max-w-full items-center justify-end gap-1.5 overflow-x-auto">
          <ViewModeSwitch
            :model-value="mode"
            :options="modeOptions"
            @update:model-value="setMode"
          />

          <button
            type="button"
            class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border-1 px-2 text-meta text-text-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40 min-[1100px]:px-2.5"
            :disabled="!canExport"
            :title="exportHint"
            aria-label="Copy"
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
            <span class="hidden min-[1100px]:inline">Copy</span>
          </button>

          <button
            type="button"
            class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border-1 px-2 font-mono text-meta text-text-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40 min-[1100px]:px-2.5"
            :disabled="!canExport"
            title="Copy emelandctl create … command(s) for the active doc or bundle"
            aria-label="emelandctl"
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
            <span class="hidden min-[1100px]:inline">emelandctl</span>
          </button>

          <button
            type="button"
            class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border-1 px-2 text-meta text-text-2 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40 min-[1100px]:px-2.5"
            :disabled="!canAddToBundle"
            :title="
              activeId
                ? 'Update this document in the bundle'
                : 'Add the active document to the bundle'
            "
            :aria-label="activeId ? 'Update bundle' : 'Add to bundle'"
            @click="onAddToBundle"
          >
            <IconPlus
              :size="13"
              :stroke-width="1.75"
              class="shrink-0"
            />
            <!-- Invisible longest label keeps width stable when toggling Add/Update -->
            <span class="relative hidden min-[1100px]:inline">
              <span
                class="invisible"
                aria-hidden="true"
              >
                Add to bundle
              </span>
              <span class="absolute inset-0 flex items-center justify-center whitespace-nowrap">
                {{ activeId ? 'Update bundle' : 'Add to bundle' }}
              </span>
            </span>
          </button>

          <button
            type="button"
            class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-border-1 bg-bg-1 px-2 text-meta text-text-1 transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40 min-[1100px]:px-2.5"
            :disabled="!canExport"
            :title="exportHint"
            aria-label="Download"
            @click="onDownload"
          >
            <IconDownload
              :size="13"
              :stroke-width="1.75"
              class="shrink-0"
            />
            <span class="hidden tabular-nums min-[1100px]:inline">
              Download ({{ bundle.length }})
            </span>
          </button>
        </div>
      </template>
    </ViewHeader>

    <div
      class="grid min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
      style="grid-template-columns: minmax(14rem, 16rem) minmax(18rem, 1fr) minmax(14rem, 16rem)"
    >
      <aside class="flex min-h-0 min-w-0 flex-col border-r border-border-1">
        <div class="shrink-0 border-b border-border-1 px-2 py-2">
          <div
            class="flex w-full items-center gap-2 rounded bg-bg-2 px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-border-2"
          >
            <IconSearch
              :size="13"
              :stroke-width="1.5"
              class="shrink-0 text-text-4"
            />
            <input
              v-model="typeSearch"
              type="text"
              data-search-input
              placeholder="Search types…"
              class="w-full min-w-0 bg-transparent font-mono text-label text-text-2 outline-none placeholder:text-meta placeholder:text-text-4"
              spellcheck="false"
              autocomplete="off"
            />
            <button
              v-if="typeSearch"
              type="button"
              class="shrink-0 rounded p-0.5 text-text-4 transition-colors hover:bg-bg-3 hover:text-text-2"
              title="Clear search"
              aria-label="Clear search"
              @click="typeSearch = ''"
            >
              <IconX
                :size="12"
                :stroke-width="2"
              />
            </button>
          </div>
        </div>
        <ListPaneBar
          label="Resource types"
          :count="filteredResourceTypes.length"
          :total="RESOURCE_TYPE_DEFS.length"
        />
        <nav
          class="min-h-0 flex-1 overflow-y-auto"
          aria-label="Resource types"
        >
          <p
            v-if="!filteredResourceTypes.length"
            class="px-4 py-3 text-meta text-text-4"
          >
            No matching types
          </p>
          <ResourceListRow
            v-for="k in filteredResourceTypes"
            :id="k.resourceType"
            :key="k.resourceType"
            :title="k.label"
            :selected="!activeId && activeResourceType === k.resourceType"
            compact
            @select="onNewResourceType"
          >
            <span
              class="truncate text-micro text-text-4"
              :title="k.description"
            >
              {{ k.description }}
            </span>
            <template
              v-if="k.phase"
              #badges
            >
              <span
                class="rounded-full bg-bg-2 px-1.5 py-0.5 font-mono text-micro tabular-nums text-text-4"
                :title="phaseLabel(k.phase)"
              >
                {{ k.phase }}
              </span>
            </template>
          </ResourceListRow>
        </nav>
      </aside>

      <div class="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <div class="shrink-0 space-y-2 border-b border-border-1 px-5 py-3">
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
            Bundle has validation issues. Fix or remove invalid documents before export.
          </p>
        </div>

        <div class="min-h-0 flex-1 overflow-hidden">
          <div
            v-if="mode === 'form'"
            class="h-full overflow-y-auto px-5 py-5"
          >
            <div class="mx-auto max-w-2xl">
              <div class="mb-4 flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-title font-medium text-text-1">
                      {{ resourceTypeDef.label }}
                    </h2>
                    <span
                      v-if="resourceTypeDef.phase"
                      class="rounded-full bg-bg-2 px-2 py-0.5 font-mono text-micro tabular-nums text-text-3"
                      :title="phaseLabel(resourceTypeDef.phase)"
                    >
                      {{ resourceTypeDef.phase }}
                    </span>
                  </div>
                  <p class="mt-1 text-label text-text-3">
                    {{ resourceTypeDef.description }}
                  </p>
                </div>
                <div
                  v-if="editingFromBundle"
                  class="inline-flex shrink-0 items-center gap-1.5 rounded bg-accent/10 px-2.5 py-1 text-meta text-accent-text"
                  role="status"
                  :title="`Editing from bundle: ${activeBundleLabel}`"
                >
                  <IconStack2
                    :size="13"
                    :stroke-width="1.75"
                    class="shrink-0"
                  />
                  <span class="max-w-[10rem] truncate">
                    {{ activeBundleLabel }}
                  </span>
                </div>
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
            class="flex h-full flex-col gap-2 p-3"
          >
            <div
              v-if="editingFromBundle"
              class="flex shrink-0 items-center justify-end"
            >
              <div
                class="inline-flex items-center gap-1.5 rounded bg-accent/10 px-2.5 py-1 text-meta text-accent-text"
                role="status"
                :title="`Editing from bundle: ${activeBundleLabel}`"
              >
                <IconStack2
                  :size="13"
                  :stroke-width="1.75"
                  class="shrink-0"
                />
                <span class="max-w-[12rem] truncate">
                  {{ activeBundleLabel }}
                </span>
              </div>
            </div>
            <div class="min-h-0 flex-1">
              <YamlCodeEditor
                v-model="yamlText"
                :issues="displayIssues"
              />
            </div>
          </div>

          <div
            v-else
            class="flex h-full flex-col gap-2 p-3"
          >
            <p class="shrink-0 text-meta text-text-4">
              Read-only preview of the multi-document YAML that Copy / Download export
              <span v-if="hasBundle">({{ bundle.length }} docs, separated by ---)</span>
              .
            </p>
            <div class="min-h-0 flex-1">
              <YamlCodeEditor
                :model-value="bundleYaml"
                :issues="displayIssues"
                read-only
                :copy-disabled="!hasBundle"
              />
            </div>
          </div>
        </div>
      </div>

      <aside class="flex min-h-0 min-w-0 flex-col border-l border-border-1">
        <BundleList
          class="min-h-0 flex-1"
          :items="bundle"
          :selected-id="activeId"
          @select="onSelectBundleItem"
          @remove="onRemoveBundleItem"
          @clear="onClearBundle"
        />
      </aside>
    </div>
  </div>
</template>
