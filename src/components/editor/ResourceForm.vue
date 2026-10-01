<script setup lang="ts">
import type { FieldDef, ResourceTypeDef } from '@/editor/kinds'
import { fieldValidationRule } from '@/editor/kinds'
import SectionLabel from '@/components/SectionLabel.vue'
import AnnotationMapEditor from '@/components/editor/AnnotationMapEditor.vue'
import BundleRefInput, { type BundleRefOption } from '@/components/editor/BundleRefInput.vue'
import EditorSelect from '@/components/editor/EditorSelect.vue'

const props = defineProps<{
  resourceTypeDef: ResourceTypeDef
  modelValue: Record<string, unknown>
  fieldErrors?: Record<string, string>
  bundleRefs?: BundleRefOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function setField(key: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function asString(key: string): string {
  const v = props.modelValue[key]
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function asBool(key: string): boolean {
  return Boolean(props.modelValue[key])
}

function asStringList(key: string): string {
  const v = props.modelValue[key]
  return Array.isArray(v) ? v.map(String).join(', ') : ''
}

function setStringList(key: string, raw: string) {
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  setField(key, items)
}

function asAnnotations(key: string): Record<string, string> {
  const v = props.modelValue[key]
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, String(val ?? '')]),
    )
  }
  return {}
}

function errorFor(field: FieldDef): string | undefined {
  const errors = props.fieldErrors
  if (!errors) return undefined
  // Annotation rows render their own key-specific errors
  if (field.type === 'annotations') return undefined
  const direct = errors[field.key] ?? errors[`spec.${field.key}`]
  if (direct) return direct
  // Nested Zod paths (e.g. metricRef.metricId) → show on parent field
  const nested = Object.entries(errors).find(
    ([k]) => k.startsWith(`${field.key}.`) || k.startsWith(`spec.${field.key}.`),
  )
  return nested?.[1]
}

function isRefUuid(field: FieldDef): boolean {
  return field.type === 'uuid' && !!field.refType
}

function ruleFor(field: FieldDef): string {
  return fieldValidationRule(field)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <p
      v-if="resourceTypeDef.formHint"
      class="rounded border border-border-1 bg-bg-1 px-3 py-2 text-label text-text-3"
    >
      {{ resourceTypeDef.formHint }}
    </p>

    <div
      v-for="field in resourceTypeDef.fields"
      :key="field.key"
      class="flex flex-col gap-1.5"
    >
      <div class="flex items-baseline justify-between gap-2">
        <label
          class="text-label font-medium text-text-2"
          :for="`field-${field.key}`"
        >
          {{ field.label }}
          <span
            v-if="field.required"
            class="text-error"
            title="Required"
          >
            *
          </span>
          <span
            v-else
            class="ml-1 font-normal text-text-4"
          >
            optional
          </span>
        </label>
      </div>

      <p
        v-if="field.description"
        class="text-meta text-text-4"
      >
        {{ field.description }}
      </p>

      <!-- UUID reference (bundle suggestions) -->
      <BundleRefInput
        v-if="isRefUuid(field)"
        :input-id="`field-${field.key}`"
        :model-value="asString(field.key)"
        :ref-type="field.refType!"
        :options="bundleRefs ?? []"
        :invalid="!!errorFor(field)"
        @update:model-value="setField(field.key, $event)"
      />

      <!-- Own primary UUID -->
      <input
        v-else-if="field.type === 'uuid'"
        :id="`field-${field.key}`"
        class="h-8 w-full rounded border bg-bg-0 px-2 font-mono text-data text-text-1 focus:outline-none"
        :class="errorFor(field) ? 'border-error/50' : 'border-border-1 focus:border-border-2'"
        :value="asString(field.key)"
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        spellcheck="false"
        @input="setField(field.key, ($event.target as HTMLInputElement).value)"
      />

      <!-- String -->
      <input
        v-else-if="field.type === 'string'"
        :id="`field-${field.key}`"
        class="h-8 rounded border bg-bg-0 px-2 text-body text-text-1 focus:outline-none"
        :class="errorFor(field) ? 'border-error/50' : 'border-border-1 focus:border-border-2'"
        :value="asString(field.key)"
        @input="setField(field.key, ($event.target as HTMLInputElement).value)"
      />

      <!-- Boolean -->
      <label
        v-else-if="field.type === 'boolean'"
        class="inline-flex w-fit items-center gap-2 text-body text-text-2"
      >
        <input
          :id="`field-${field.key}`"
          type="checkbox"
          class="size-3.5 rounded border-border-2"
          :checked="asBool(field.key)"
          @change="setField(field.key, ($event.target as HTMLInputElement).checked)"
        />
        {{ asBool(field.key) ? 'true' : 'false' }}
      </label>

      <!-- Enum -->
      <EditorSelect
        v-else-if="field.type === 'enum'"
        :input-id="`field-${field.key}`"
        :model-value="asString(field.key)"
        :options="field.enumValues ?? []"
        :invalid="!!errorFor(field)"
        @update:model-value="setField(field.key, $event)"
      />

      <!-- String list (comma-separated) -->
      <input
        v-else-if="field.type === 'stringList'"
        :id="`field-${field.key}`"
        class="h-8 rounded border bg-bg-0 px-2 font-mono text-data text-text-1 focus:outline-none"
        :class="errorFor(field) ? 'border-error/50' : 'border-border-1 focus:border-border-2'"
        :value="asStringList(field.key)"
        :placeholder="field.refType ? 'uuid-1, uuid-2' : 'value-1, value-2'"
        spellcheck="false"
        @input="setStringList(field.key, ($event.target as HTMLInputElement).value)"
      />

      <!-- Annotations -->
      <div v-else-if="field.type === 'annotations'">
        <SectionLabel>Key / value</SectionLabel>
        <AnnotationMapEditor
          :model-value="asAnnotations(field.key)"
          :resource-type="resourceTypeDef.resourceType"
          :field-errors="fieldErrors"
          @update:model-value="setField(field.key, $event)"
        />
      </div>

      <p
        v-if="errorFor(field)"
        class="text-meta text-error"
      >
        {{ errorFor(field) }}
      </p>
      <p
        v-else
        class="text-meta text-text-4"
      >
        {{ ruleFor(field) }}
      </p>
    </div>
  </div>
</template>
