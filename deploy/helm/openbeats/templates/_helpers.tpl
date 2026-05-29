{{- define "openbeats.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "openbeats.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "openbeats.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "openbeats.labels" -}}
app.kubernetes.io/name: {{ include "openbeats.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "openbeats.apiName" -}}
{{- printf "%s-api" (include "openbeats.fullname" .) -}}
{{- end -}}

{{- define "openbeats.webName" -}}
{{- printf "%s-web" (include "openbeats.fullname" .) -}}
{{- end -}}

{{- define "openbeats.postgresName" -}}
{{- printf "%s-postgres" (include "openbeats.fullname" .) -}}
{{- end -}}

{{/* The database connection string used by the API. */}}
{{- define "openbeats.databaseUrl" -}}
{{- if .Values.postgresql.enabled -}}
{{- printf "postgres://%s:%s@%s:5432/%s?sslmode=disable" .Values.postgresql.username .Values.postgresql.password (include "openbeats.postgresName" .) .Values.postgresql.database -}}
{{- else -}}
{{- .Values.externalDatabase.url -}}
{{- end -}}
{{- end -}}

{{/* Resolve image tags, defaulting to the chart appVersion. */}}
{{- define "openbeats.apiImage" -}}
{{- printf "%s:%s" .Values.api.image.repository (default .Chart.AppVersion .Values.api.image.tag) -}}
{{- end -}}
{{- define "openbeats.webImage" -}}
{{- printf "%s:%s" .Values.web.image.repository (default .Chart.AppVersion .Values.web.image.tag) -}}
{{- end -}}
