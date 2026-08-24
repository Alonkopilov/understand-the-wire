/**
 * The failures worth writing up, from docs/problems-solutions.md.
 *
 * Entries with an empty `title` are skipped when rendering, so this can be
 * filled in one at a time. `nodeId` links a card to a box on the map.
 */
export type Problem = {
  id: string
  title: string
  symptom: string
  cause: string
  fix: string
  nodeId?: string
}

export const PROBLEMS: Problem[] = [
  {
    id: 'ssm-agent',
    title: '',
    symptom: '',
    cause: '',
    fix: '',
    nodeId: 'ec2',
  },
  {
    id: 'spot',
    title: '',
    symptom: '',
    cause: '',
    fix: '',
    nodeId: 'ec2',
  },
  {
    id: 'gitops-layout',
    title: '',
    symptom: '',
    cause: '',
    fix: '',
    nodeId: 'flux',
  },
  {
    id: 'double-kustomization',
    title: '',
    symptom: '',
    cause: '',
    fix: '',
    nodeId: 'flux',
  },
]
