import type { DependencyWire } from '@/api/capabilityGraph'

/**
 * Dependency mockups (flat landscape resources). Joined onto variants via
 * variant id — mirrors GET /landscape/dependencies/{id}
 */
export const dependencies = [
  {
    dependencyId: '1d147d83-0714-4b21-823f-f6f7075e7863',
    displayName: 'dep-1',
    variant: '4b242d05-b10b-4eba-8e2f-c7a899651ada',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009',
  },
  {
    dependencyId: 'e613144f-d110-4a42-8b2f-599fd862421d',
    displayName: 'dep-2',
    variant: '4b242d05-b10b-4eba-8e2f-c7a899651ada',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    mappings: [
      {
        fromValidValueId: '7ad25102-e2e4-4141-85fb-7feff99c704d',
        toValidValueId: 'ee0fae56-6cba-4c07-84be-71686e7532e7',
      },
    ],
  },
  {
    dependencyId: '82f1e1d0-f15a-45cb-8ee0-f6c75b6d4202',
    displayName: 'dep-1',
    variant: '504bc330-341e-4416-82cd-63bc546cb651',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009',
  },
  {
    dependencyId: '1e7e30e8-ae99-48d2-8018-de4ec3d997a9',
    displayName: 'dep-2',
    variant: '504bc330-341e-4416-82cd-63bc546cb651',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    mappings: [
      {
        fromValidValueId: '80025a24-422c-4e39-8895-08821a455064',
        toValidValueId: '2cd57977-fdb7-48a9-838e-d7e52755fb9a',
      },
    ],
  },
  {
    dependencyId: '2fdb8d88-3572-4484-851a-017581d6203d',
    displayName: 'dep-3',
    variant: '504bc330-341e-4416-82cd-63bc546cb651',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b',
    mappings: [
      {
        fromValidValueId: '80025a24-422c-4e39-8895-08821a455064',
        toValidValueId: '29a0a175-f21e-456f-89a4-0b2ef4fe7f13',
      },
    ],
  },
  {
    dependencyId: '625f5025-16ba-4e73-88b6-719874d3198f',
    displayName: 'dep-1',
    variant: 'e1fe2446-b88c-4da8-8197-ae68d770fb98',
    capability: 'ffffffff-0000-4a3b-8c1d-0000000000ff',
  },
  {
    dependencyId: 'c77a8b7e-c0d0-4a90-8a8e-2e2eba1a5cc3',
    displayName: 'dep-1',
    variant: 'b481a38b-9624-4c21-8fbf-cbde41f21c70',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009',
  },
  {
    dependencyId: '95e5b33c-8167-4b74-80e6-9fa5686ec4f1',
    displayName: 'dep-2',
    variant: 'b481a38b-9624-4c21-8fbf-cbde41f21c70',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b',
    mappings: [
      {
        fromValidValueId: '60cc1bfc-e5cd-4ee9-8d84-1a8de989dd6f',
        toValidValueId: '1a2931d5-983c-4df6-8ad4-b76ff5d210b9',
      },
    ],
  },
  {
    dependencyId: 'e8263b0c-953e-4965-85bd-dfec88a2b18c',
    displayName: 'dep-3',
    variant: 'b481a38b-9624-4c21-8fbf-cbde41f21c70',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    mappings: [
      {
        fromValidValueId: '60cc1bfc-e5cd-4ee9-8d84-1a8de989dd6f',
        toValidValueId: '2cd57977-fdb7-48a9-838e-d7e52755fb9a',
      },
    ],
  },
  {
    dependencyId: 'f40ea0a2-c993-4420-8838-868caca34d6e',
    displayName: 'dep-1',
    variant: '9993cb2c-6e79-4d71-83dc-1278ea9bd380',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000009',
  },
  {
    dependencyId: 'a92a5313-ecac-446f-85c1-d35b34be0ed0',
    displayName: 'dep-2',
    variant: '9993cb2c-6e79-4d71-83dc-1278ea9bd380',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b',
    mappings: [
      {
        fromValidValueId: '71617bb2-dc33-45ba-8574-b1b98201b7f5',
        toValidValueId: '29a0a175-f21e-456f-89a4-0b2ef4fe7f13',
      },
    ],
  },
  {
    dependencyId: 'a2b400cf-d76b-49c2-8343-01726ef2648f',
    displayName: 'dep-3',
    variant: '9993cb2c-6e79-4d71-83dc-1278ea9bd380',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    mappings: [
      {
        fromValidValueId: '71617bb2-dc33-45ba-8574-b1b98201b7f5',
        toValidValueId: '5734764c-0d30-409d-853d-60610c451029',
      },
    ],
  },
  {
    dependencyId: '7ca14a80-60c8-4684-80e7-db7f8bac1086',
    displayName: 'dep-4',
    variant: '9993cb2c-6e79-4d71-83dc-1278ea9bd380',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000003',
  },
  {
    dependencyId: 'e6527d1e-2da0-4686-8b5e-baad150bd602',
    displayName: 'dep-1',
    variant: 'b2fb08de-cbab-48b8-8602-3154a214dee9',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002',
    mappings: [
      {
        fromValidValueId: '53bd4390-d313-4ca4-8707-eb9b0ee149bd',
        toValidValueId: '3301d335-18a4-45aa-80fd-13b596e9c42e',
      },
    ],
  },
  {
    dependencyId: 'f93e4ac8-1c4f-44bd-859d-6688ff5ba120',
    displayName: 'dep-2',
    variant: 'b2fb08de-cbab-48b8-8602-3154a214dee9',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    mappings: [
      {
        fromValidValueId: '53bd4390-d313-4ca4-8707-eb9b0ee149bd',
        toValidValueId: 'ee0fae56-6cba-4c07-84be-71686e7532e7',
      },
    ],
  },
  {
    dependencyId: 'bf644672-21d0-4a79-83ca-fe38e4f92d49',
    displayName: 'dep-1',
    variant: '02d39a2b-d828-4c13-8c5e-f9b7b42924c6',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002',
  },
  {
    dependencyId: '09fa3241-58f4-43fc-8168-64cc703a06ba',
    displayName: 'dep-1',
    variant: '9d773dca-979c-4d9f-8172-d24dad7f3a80',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    mappings: [
      {
        fromValidValueId: 'ee0fae56-6cba-4c07-84be-71686e7532e7',
        toValidValueId: '2cd57977-fdb7-48a9-838e-d7e52755fb9a',
      },
    ],
  },
  {
    dependencyId: '07136f2e-99e3-409a-8e5f-765fbeb34897',
    displayName: 'dep-1',
    variant: '96cf687e-bc4f-45b2-81db-9d41017b9c11',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002',
  },
  {
    dependencyId: '89325f6b-ddeb-4734-8e42-e95a4943b097',
    displayName: 'dep-2',
    variant: '96cf687e-bc4f-45b2-81db-9d41017b9c11',
    capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000f',
  },
] satisfies DependencyWire[]
