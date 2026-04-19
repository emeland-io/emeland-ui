{{/*
Expand the name of the chart.
*/}}
{{- define "emeland-ui.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name. Truncated to 63 chars.
*/}}
{{- define "emeland-ui.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Chart label value.
*/}}
{{- define "emeland-ui.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels.
*/}}
{{- define "emeland-ui.labels" -}}
helm.sh/chart: {{ include "emeland-ui.chart" . }}
{{ include "emeland-ui.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels.
*/}}
{{- define "emeland-ui.selectorLabels" -}}
app.kubernetes.io/name: {{ include "emeland-ui.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
ServiceAccount name.
*/}}
{{- define "emeland-ui.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "emeland-ui.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{/*
Name of the Secret that holds the root-admin token. Honors
`.Values.rootAdmin.existingSecret` so operators can bring their own.
*/}}
{{- define "emeland-ui.rootAdminSecretName" -}}
{{- if .Values.rootAdmin.existingSecret -}}
{{- .Values.rootAdmin.existingSecret -}}
{{- else -}}
{{- printf "%s-root-admin" (include "emeland-ui.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/*
  The root-admin token is resolved inline in templates/bootstrap.yaml so both
  the Secret and the ConfigMap see the same generated value. Extracting it into
  a named template would invoke randAlphaNum twice and produce mismatched
  hashes between the two resources on first install.
*/}}
