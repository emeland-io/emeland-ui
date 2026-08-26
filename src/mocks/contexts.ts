import type { Context as ContextWire, ContextType as ContextTypeWire } from '@/api/gen/types.gen'

const T = {
  organization: '1a2b3c4d-0001-4211-8000-000000000001',
  environment: '7fbc930a-4874-4b52-9598-6481977e203c',
  businessDomain: 'd34e29b1-7a5b-4e92-bc11-9ec07672ec1d',
  region: '1a2b3c4d-0002-4211-8000-000000000002',
  tenant: '1a2b3c4d-0003-4211-8000-000000000003',
}

const C = {
  org: '0a000000-0000-4211-8000-000000000001',
  betriebsplattform: '0a000000-0000-4211-8000-000000000002',
  datenmanagement: '0a000000-0000-4211-8000-000000000003',
  berlin: '0a000000-0000-4211-8000-000000000004',
  strausberg: '0a000000-0000-4211-8000-000000000005',
  analyseSandbox: '0a000000-0000-4211-8000-000000000006',
  saspf: '0a000000-0000-4211-8000-000000000007',
  altsystem: '0a000000-0000-4211-8000-000000000008',
  production: 'a157790b-33ce-4ca8-9844-32386da44b6c',
  staging: 'c82b137d-5e63-471a-8260-032a920be38e',
  development: 'b2d4f6a8-1357-4a9b-8c2d-3e4f5a6b7c8d',
  identitaetsmgmt: 'd4f6a8b1-3579-4c2d-8e4f-5a6b7c8d9e1f',
}

const MISSING_PARENT = 'ffffffff-0000-4211-8000-0000000000ff'

export const contextTypes = [
  {
    contextTypeId: T.organization,
    displayName: 'Organization',
    description: 'Die oberste Organisation.',
    annotations: [{ key: 'emeland.io/organization', value: 'root' }],
  },
  {
    contextTypeId: T.businessDomain,
    displayName: 'Business domain',
    description: 'Ein Geschäftsbereich, der Systeme und Teams gruppiert.',
    annotations: [],
  },
  {
    contextTypeId: T.environment,
    displayName: 'Environment',
    description:
      'Eine Deployment-Umgebung (prod, staging, dev), abgebildet auf einen Mandanten der Private Cloud.',
    annotations: [],
  },
  {
    contextTypeId: T.region,
    displayName: 'Region',
    description:
      'Ein Rechenzentrums-Standort innerhalb einer Umgebung (Berlin, Strausberg), georedundant.',
    annotations: [],
  },
  {
    contextTypeId: T.tenant,
    displayName: 'Tenant',
    description: 'Eine isolierte fachliche Einheit innerhalb eines Geschäftsbereichs.',
    annotations: [],
  },
] satisfies ContextTypeWire[]

export const contexts = [
  {
    contextId: C.org,
    displayName: 'BWI GmbH',
    description: 'Root-Context der BWI.',
    type: T.organization,
    annotations: [
      { key: 'eximpl.emeland.io/org-id', value: 'bwi' },
      { key: 'eximpl.emeland.io/legal-entity', value: 'BWI GmbH' },
      { key: 'eximpl.emeland.io/sitz', value: 'Berlin' },
      { key: 'eximpl.emeland.io/traeger', value: 'Bund' },
      { key: 'eximpl.emeland.io/datenschutz', value: 'DSGVO' },
    ],
  },
  {
    contextId: C.betriebsplattform,
    displayName: 'Betriebsplattform',
    description: 'Betreibt die gemeinsame Infrastruktur, CI/CD und die pCloud der Bundeswehr.',
    type: T.businessDomain,
    parent: C.org,
    annotations: [
      { key: 'eximpl.emeland.io/owner', value: 'team-betrieb' },
      { key: 'eximpl.emeland.io/kostenstelle', value: 'KST-1001' },
      { key: 'eximpl.emeland.io/einstufung', value: 'offen' },
    ],
  },
  {
    contextId: C.datenmanagement,
    displayName: 'Datenmanagement',
    description: 'Betreibt Data-Lake, Streaming und Analyse-Plattform.',
    type: T.businessDomain,
    parent: C.org,
    annotations: [
      { key: 'eximpl.emeland.io/owner', value: 'team-daten' },
      { key: 'eximpl.emeland.io/kostenstelle', value: 'KST-1002' },
      { key: 'eximpl.emeland.io/einstufung', value: 'offen' },
    ],
  },
  {
    contextId: C.identitaetsmgmt,
    displayName: 'Identitätsmanagement',
    description: 'Geschäftsbereich für Identitäts- und Zugriffsverwaltung.',
    type: T.businessDomain,
    parent: C.org,
    annotations: [
      { key: 'eximpl.emeland.io/owner', value: 'team-iam' },
      { key: 'eximpl.emeland.io/kostenstelle', value: 'KST-2002' },
      { key: 'eximpl.emeland.io/compliance', value: 'BSI' },
    ],
  },
  {
    contextId: C.production,
    displayName: 'Production',
    description: 'Primäre Produktionsumgebung auf der Private Cloud der Bundeswehr.',
    type: T.environment,
    parent: C.betriebsplattform,
    annotations: [
      { key: 'eximpl.emeland.io/tier', value: 'prod' },
      { key: 'eximpl.emeland.io/cloud', value: 'pcloud-bw' },
      { key: 'eximpl.emeland.io/network-zone', value: 'bw-netz' },
      { key: 'eximpl.emeland.io/einstufung', value: 'VS-NfD' },
      { key: 'eximpl.emeland.io/sla', value: '99.9' },
      { key: 'eximpl.emeland.io/compliance', value: 'BSI' },
    ],
  },
  {
    contextId: C.berlin,
    displayName: 'Berlin',
    description: 'Rechenzentrum Berlin (ber), Primärstandort der Produktion.',
    type: T.region,
    parent: C.production,
    annotations: [
      { key: 'eximpl.emeland.io/standort', value: 'ber' },
      { key: 'eximpl.emeland.io/rechenzentrum', value: 'RZ-BER-1' },
      { key: 'eximpl.emeland.io/stadt', value: 'Berlin' },
      { key: 'eximpl.emeland.io/data-residency', value: 'DE' },
      { key: 'eximpl.emeland.io/georedundanz', value: 'primär' },
    ],
  },
  {
    contextId: C.strausberg,
    displayName: 'Strausberg',
    description: 'Rechenzentrum Strausberg (srb), georedundanter Sekundärstandort.',
    type: T.region,
    parent: C.production,
    annotations: [
      { key: 'eximpl.emeland.io/standort', value: 'srb' },
      { key: 'eximpl.emeland.io/rechenzentrum', value: 'RZ-SRB-2' },
      { key: 'eximpl.emeland.io/stadt', value: 'Strausberg' },
      { key: 'eximpl.emeland.io/data-residency', value: 'DE' },
      { key: 'eximpl.emeland.io/georedundanz', value: 'sekundär' },
    ],
  },
  {
    contextId: C.staging,
    displayName: 'Staging',
    description: 'Pre-Production-Umgebung, spiegelt die Produktionstopologie.',
    type: T.environment,
    parent: C.production,
    annotations: [
      { key: 'eximpl.emeland.io/tier', value: 'staging' },
      { key: 'eximpl.emeland.io/cloud', value: 'pcloud-bw' },
      { key: 'eximpl.emeland.io/mandant', value: 'bw-staging' },
      { key: 'eximpl.emeland.io/standort', value: 'srb' },
      { key: 'eximpl.emeland.io/deploy-strategy', value: 'rolling' },
    ],
  },
  {
    contextId: C.development,
    displayName: 'Development',
    description: 'Gemeinsame Entwicklungs- und Integrationsumgebung.',
    type: T.environment,
    parent: C.staging,
    annotations: [
      { key: 'eximpl.emeland.io/tier', value: 'dev' },
      { key: 'eximpl.emeland.io/cloud', value: 'pcloud-bw' },
      { key: 'eximpl.emeland.io/mandant', value: 'bw-dev' },
      { key: 'eximpl.emeland.io/standort', value: 'ber' },
    ],
  },
  {
    contextId: C.analyseSandbox,
    displayName: 'Analyse-Sandbox',
    description: 'Isolierte Sandbox für Datenanalyse-Experimente.',
    type: T.environment,
    parent: C.datenmanagement,
    annotations: [
      { key: 'eximpl.emeland.io/tier', value: 'sandbox' },
      { key: 'eximpl.emeland.io/cloud', value: 'pcloud-bw' },
      { key: 'eximpl.emeland.io/mandant', value: 'bw-analyse' },
      { key: 'eximpl.emeland.io/einstufung', value: 'offen' },
      { key: 'eximpl.emeland.io/budget-cap-eur', value: '4000' },
    ],
  },
  {
    contextId: C.altsystem,
    displayName: 'Altsystem',
    description: 'Abzulösende Alt-Infrastruktur, übergeordneter Context noch nicht modelliert.',
    type: T.environment,
    parent: MISSING_PARENT,
    annotations: [
      { key: 'eximpl.emeland.io/tier', value: 'legacy' },
      { key: 'eximpl.emeland.io/betrieb', value: 'alt-vertrag' },
      { key: 'eximpl.emeland.io/standort', value: 'RZ Berlin' },
      { key: 'eximpl.emeland.io/abschaltung-geplant', value: '2027-Q2' },
    ],
  },
] satisfies ContextWire[]
