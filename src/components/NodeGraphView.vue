<script setup lang="ts">
import { computed } from "vue";

import { GRAPH_NODES } from "@/lib/model";
import type { GraphNode } from "@/lib/types";

type LaidOutNode = GraphNode & { x: number; y: number; column: number };
type Edge = { from: LaidOutNode; to: LaidOutNode };

/**
 * Layered layout: each node sits in a column equal to its longest distance
 * from any source. Sensors land in column 0, structural filters in column 1,
 * reference filters in column 2, and so on.
 */
const layout = computed<{ nodes: LaidOutNode[]; edges: Edge[]; width: number; height: number }>(() => {
  const byId = new Map(GRAPH_NODES.map((n) => [n.id, n]));
  const incoming = new Map<string, string[]>();
  for (const node of GRAPH_NODES) {
    for (const sub of node.subscribers) {
      const list = incoming.get(sub) ?? [];
      list.push(node.id);
      incoming.set(sub, list);
    }
  }

  const column = new Map<string, number>();
  const computeColumn = (id: string, stack: Set<string>): number => {
    if (column.has(id)) return column.get(id)!;
    if (stack.has(id)) return 0; // cycle guard
    stack.add(id);
    const parents = incoming.get(id) ?? [];
    const result = parents.length === 0
      ? 0
      : Math.max(...parents.map((p) => computeColumn(p, stack) + 1));
    stack.delete(id);
    column.set(id, result);
    return result;
  };
  for (const node of GRAPH_NODES) computeColumn(node.id, new Set());

  const byColumn = new Map<number, GraphNode[]>();
  for (const node of GRAPH_NODES) {
    const col = column.get(node.id)!;
    const list = byColumn.get(col) ?? [];
    list.push(node);
    byColumn.set(col, list);
  }

  const COL_W = 220;
  const ROW_H = 90;
  const PAD_X = 30;
  const PAD_Y = 30;

  const laidOut: LaidOutNode[] = [];
  for (const [col, list] of byColumn.entries()) {
    list.forEach((node, i) => {
      laidOut.push({
        ...node,
        column: col,
        x: PAD_X + col * COL_W,
        y: PAD_Y + i * ROW_H,
      });
    });
  }

  const lookup = new Map(laidOut.map((n) => [n.id, n]));
  const edges: Edge[] = [];
  for (const node of laidOut) {
    for (const sub of node.subscribers) {
      const target = lookup.get(sub);
      if (target) edges.push({ from: node, to: target });
    }
  }

  const maxCol = laidOut.reduce((m, n) => Math.max(m, n.column), 0);
  const maxRows = Math.max(...Array.from(byColumn.values()).map((l) => l.length), 1);
  const width = PAD_X * 2 + (maxCol + 1) * COL_W;
  const height = PAD_Y * 2 + maxRows * ROW_H;

  return { nodes: laidOut, edges, width, height };
});

const NODE_W = 170;
const NODE_H = 56;

const edgePath = (edge: Edge): string => {
  const x1 = edge.from.x + NODE_W;
  const y1 = edge.from.y + NODE_H / 2;
  const x2 = edge.to.x;
  const y2 = edge.to.y + NODE_H / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 6} ${y2}`;
};

const arrowHead = (edge: Edge): string => {
  const x = edge.to.x;
  const y = edge.to.y + NODE_H / 2;
  return `M ${x - 6} ${y - 4} L ${x} ${y} L ${x - 6} ${y + 4} Z`;
};
</script>

<template>
  <div class="graph-shell" aria-label="Node graph">
    <header>
      <h2>Node graph</h2>
      <p>
        Sensors, filters, and (later) injectors form a directed pipeline. Each Node publishes events to the Nodes
        listed in its <code>subscribers</code> relation; this view derives the graph from those edges.
      </p>
    </header>

    <div class="graph-legend">
      <span><span class="graph-legend-swatch sensor" />Sensor</span>
      <span><span class="graph-legend-swatch filter" />Filter</span>
      <span><span class="graph-legend-swatch injector" />Injector</span>
    </div>

    <div class="graph-canvas">
      <svg
        :width="layout.width"
        :height="layout.height"
        :viewBox="`0 0 ${layout.width} ${layout.height}`"
        role="img"
        aria-label="Directed graph of nodes"
      >
        <g aria-label="edges">
          <g v-for="(edge, i) in layout.edges" :key="`e-${i}`">
            <path class="graph-edge" :d="edgePath(edge)" />
            <path class="graph-edge-head" :d="arrowHead(edge)" />
          </g>
        </g>
        <g aria-label="nodes">
          <g v-for="node in layout.nodes" :key="node.id" :transform="`translate(${node.x},${node.y})`">
            <rect
              class="graph-node-rect"
              :class="node.kind"
              :width="NODE_W"
              :height="NODE_H"
              rx="6"
              ry="6"
              stroke-width="1.5"
            />
            <text class="graph-node-label" x="12" y="22">{{ node.displayName }}</text>
            <text class="graph-node-kind" x="12" y="40">{{ node.kind }} · {{ node.nodeType }}</text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>
