import type { VariantWire } from '@/api/capabilityGraph'

/**
 * Variant mockups (flat landscape resources). Joined onto capability versions
 * via capabilityVersion — mirrors GET /landscape/variants/{id}
 */
export const variants = [
  {
    variantId: '4b242d05-b10b-4eba-8e2f-c7a899651ada',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
    requires: ['7ad25102-e2e4-4141-85fb-7feff99c704d', '8bb0ae2f-118c-4fcd-8abc-74bac421430a'],
  },
  {
    variantId: '504bc330-341e-4416-82cd-63bc546cb651',
    displayName: 'variant-2',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
    requires: ['80025a24-422c-4e39-8895-08821a455064'],
  },
  {
    variantId: 'f52e5f23-8c7f-4f67-81e6-d100130de955',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v200',
    requires: ['3301d335-18a4-45aa-80fd-13b596e9c42e', 'a7c391ba-706e-4fe8-8c5a-841e19eaf4b1'],
  },
  {
    variantId: 'e1fe2446-b88c-4da8-8197-ae68d770fb98',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v700',
    requires: [],
  },
  {
    variantId: 'b481a38b-9624-4c21-8fbf-cbde41f21c70',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v901',
    requires: [
      '60cc1bfc-e5cd-4ee9-8d84-1a8de989dd6f',
      '71617bb2-dc33-45ba-8574-b1b98201b7f5',
      '382c087f-9625-443e-87ee-e40d3f5d2974',
      'a8d9fc3d-f869-4535-8a39-cf8ec06ffe9a',
      '1c3b5e16-dce8-4f07-8369-b88df6611702',
      '1a2931d5-983c-4df6-8ad4-b76ff5d210b9',
    ],
  },
  {
    variantId: '9993cb2c-6e79-4d71-83dc-1278ea9bd380',
    displayName: 'variant-2',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v901',
    requires: [
      '71617bb2-dc33-45ba-8574-b1b98201b7f5',
      'e44ecd8b-07c3-4a82-8c4d-f985f0f424fc',
      '33337a1d-ba4f-493a-8452-27ab869487a3',
      '2cce91f1-9a1f-4359-8c0d-c87e608f9a36',
      '29a0a175-f21e-456f-89a4-0b2ef4fe7f13',
    ],
  },
  {
    variantId: 'b2fb08de-cbab-48b8-8602-3154a214dee9',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000va01',
    requires: [
      '53bd4390-d313-4ca4-8707-eb9b0ee149bd',
      '74df44fe-3994-4501-8365-8254cd48bbd2',
      '3d05c9c3-97b2-4e5f-8d2f-c1b8eedec16e',
    ],
  },
  {
    variantId: '02d39a2b-d828-4c13-8c5e-f9b7b42924c6',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000vb01',
    requires: [],
  },
  {
    variantId: '9d773dca-979c-4d9f-8172-d24dad7f3a80',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000vc01',
    requires: ['ee0fae56-6cba-4c07-84be-71686e7532e7', '2cd57977-fdb7-48a9-838e-d7e52755fb9a'],
  },
  {
    variantId: '96cf687e-bc4f-45b2-81db-9d41017b9c11',
    displayName: 'variant-1',
    capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000vd01',
    requires: [
      '5c11591c-3c8c-4e88-840a-0b1b155e9e8f',
      '6499a569-feda-4a43-8295-f200c98eec2b',
      '1c3b5e16-dce8-4f07-8369-b88df6611702',
      '33337a1d-ba4f-493a-8452-27ab869487a3',
    ],
  },
] satisfies VariantWire[]
