import type { Context, ContextType } from '@/types/context'

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

export const contextTypes: ContextType[] = [
  {
    contextTypeId: T.organization,
    displayName: 'Organization',
    description: 'Die oberste Organisation.',
    annotations: { 'emeland.io/organization': 'root' },
  },
  {
    contextTypeId: T.businessDomain,
    displayName: 'Business domain',
    description: 'Ein Geschäftsbereich, der Systeme und Teams gruppiert.',
    annotations: {},
  },
  {
    contextTypeId: T.environment,
    displayName: 'Environment',
    description:
      'Eine Deployment-Umgebung (prod, staging, dev), abgebildet auf einen Mandanten der Private Cloud.',
    annotations: {},
  },
  {
    contextTypeId: T.region,
    displayName: 'Region',
    description:
      'Ein Rechenzentrums-Standort innerhalb einer Umgebung (Berlin, Strausberg), georedundant.',
    annotations: {},
  },
  {
    contextTypeId: T.tenant,
    displayName: 'Tenant',
    description: 'Eine isolierte fachliche Einheit innerhalb eines Geschäftsbereichs.',
    annotations: {},
  },
]

export const contexts: Context[] = [
  {
    contextId: C.org,
    displayName: 'BWI GmbH',
    description: 'Root-Context der BWI.',
    contextTypeId: T.organization,
    annotations: {
      'eximpl.emeland.io/org-id': 'bwi',
      'eximpl.emeland.io/legal-entity': 'BWI GmbH',
      'eximpl.emeland.io/sitz': 'Berlin',
      'eximpl.emeland.io/traeger': 'Bund',
      'eximpl.emeland.io/datenschutz': 'DSGVO',
    },
  },
  {
    contextId: C.betriebsplattform,
    displayName: 'Betriebsplattform',
    description: 'Betreibt die gemeinsame Infrastruktur, CI/CD und die pCloud der Bundeswehr.',
    contextTypeId: T.businessDomain,
    parentId: C.org,
    annotations: {
      'eximpl.emeland.io/owner': 'team-betrieb',
      'eximpl.emeland.io/kostenstelle': 'KST-1001',
      'eximpl.emeland.io/einstufung': 'offen',
    },
  },
  {
    contextId: C.datenmanagement,
    displayName: 'Datenmanagement',
    description: 'Betreibt Data-Lake, Streaming und Analyse-Plattform.',
    contextTypeId: T.businessDomain,
    parentId: C.org,
    annotations: {
      'eximpl.emeland.io/owner': 'team-daten',
      'eximpl.emeland.io/kostenstelle': 'KST-1002',
      'eximpl.emeland.io/einstufung': 'offen',
    },
  },
  {
    contextId: C.identitaetsmgmt,
    displayName: 'Identitätsmanagement',
    description: 'Geschäftsbereich für Identitäts- und Zugriffsverwaltung.',
    contextTypeId: T.businessDomain,
    parentId: C.org,
    annotations: {
      'eximpl.emeland.io/owner': 'team-iam',
      'eximpl.emeland.io/kostenstelle': 'KST-2002',
      'eximpl.emeland.io/compliance': 'BSI',
    },
  },
  {
    contextId: C.production,
    displayName: 'Production',
    description: 'Primäre Produktionsumgebung auf der Private Cloud der Bundeswehr.',
    contextTypeId: T.environment,
    parentId: C.betriebsplattform,
    annotations: {
      'eximpl.emeland.io/tier': 'prod',
      'eximpl.emeland.io/cloud': 'pcloud-bw',
      'eximpl.emeland.io/network-zone': 'bw-netz',
      'eximpl.emeland.io/einstufung': 'VS-NfD',
      'eximpl.emeland.io/sla': '99.9',
      'eximpl.emeland.io/compliance': 'BSI',
    },
  },
  {
    contextId: C.berlin,
    displayName: 'Berlin',
    description: 'Rechenzentrum Berlin (ber), Primärstandort der Produktion.',
    contextTypeId: T.region,
    parentId: C.production,
    annotations: {
      'eximpl.emeland.io/standort': 'ber',
      'eximpl.emeland.io/rechenzentrum': 'RZ-BER-1',
      'eximpl.emeland.io/stadt': 'Berlin',
      'eximpl.emeland.io/data-residency': 'DE',
      'eximpl.emeland.io/georedundanz': 'primär',
    },
  },
  {
    contextId: C.strausberg,
    displayName: 'Strausberg',
    description: 'Rechenzentrum Strausberg (srb), georedundanter Sekundärstandort.',
    contextTypeId: T.region,
    parentId: C.production,
    annotations: {
      'eximpl.emeland.io/standort': 'srb',
      'eximpl.emeland.io/rechenzentrum': 'RZ-SRB-2',
      'eximpl.emeland.io/stadt': 'Strausberg',
      'eximpl.emeland.io/data-residency': 'DE',
      'eximpl.emeland.io/georedundanz': 'sekundär',
    },
  },
  {
    contextId: C.staging,
    displayName: 'Staging',
    description: 'Pre-Production-Umgebung, spiegelt die Produktionstopologie.',
    contextTypeId: T.environment,
    parentId: C.production,
    annotations: {
      'eximpl.emeland.io/tier': 'staging',
      'eximpl.emeland.io/cloud': 'pcloud-bw',
      'eximpl.emeland.io/mandant': 'bw-staging',
      'eximpl.emeland.io/standort': 'srb',
      'eximpl.emeland.io/deploy-strategy': 'rolling',
    },
  },
  {
    contextId: C.development,
    displayName: 'Development',
    description: 'Gemeinsame Entwicklungs- und Integrationsumgebung.',
    contextTypeId: T.environment,
    parentId: C.staging,
    annotations: {
      'eximpl.emeland.io/tier': 'dev',
      'eximpl.emeland.io/cloud': 'pcloud-bw',
      'eximpl.emeland.io/mandant': 'bw-dev',
      'eximpl.emeland.io/standort': 'ber',
      'eximpl.emeland.io/ephemeral': 'true',
    },
  },
  {
    contextId: C.analyseSandbox,
    displayName: 'Analyse-Sandbox',
    description: 'Isolierte Sandbox für Datenanalyse-Experimente.',
    contextTypeId: T.environment,
    parentId: C.datenmanagement,
    annotations: {
      'eximpl.emeland.io/tier': 'sandbox',
      'eximpl.emeland.io/cloud': 'pcloud-bw',
      'eximpl.emeland.io/mandant': 'bw-analyse',
      'eximpl.emeland.io/einstufung': 'offen',
      'eximpl.emeland.io/budget-cap-eur': '4000',
    },
  },
  {
    contextId: C.altsystem,
    displayName: 'Altsystem',
    description: 'Abzulösende Alt-Infrastruktur, übergeordneter Context noch nicht modelliert.',
    contextTypeId: T.environment,
    parentId: MISSING_PARENT,
    annotations: {
      'eximpl.emeland.io/tier': 'legacy',
      'eximpl.emeland.io/betrieb': 'alt-vertrag',
      'eximpl.emeland.io/standort': 'RZ Berlin',
      'eximpl.emeland.io/abschaltung-geplant': '2027-Q2',
    },
  },
]
