<script lang="ts">
  import type { Container, Tool } from "@mainhub/shared";
  import type { GridMetrics } from "../lib/grid.js";
  import { cellToPixel, pixelDeltaToCells } from "../lib/grid.js";
  import { resolveTool } from "../lib/tool-registry.js";
  import { workspaceStore } from "../lib/workspace.store.js";
  import ToolContent from "./ToolContent.svelte";

  export let container: Container;
  export let tools: Tool[];
  export let metrics: GridMetrics;
  export let editor: boolean;
  export let selected: boolean = false;

  $: box = cellToPixel(container.x, container.y, container.breite, container.hoehe, metrics);
  $: tool = resolveTool(tools, container.toolId);

  let dragStartX = 0;
  let dragStartY = 0;
  let dragAccX = 0;
  let dragAccY = 0;

  function onContainerClick(e: MouseEvent) {
    if (!editor) return;
    e.stopPropagation();
    workspaceStore.selectContainer(container.id);
  }

  function startMove(e: PointerEvent) {
    if (!editor) return;
    e.preventDefault();
    e.stopPropagation();
    workspaceStore.selectContainer(container.id);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragAccX = 0;
    dragAccY = 0;
  }

  function onMove(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (!target.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - dragStartX - dragAccX * (metrics.spaltenBreite + metrics.gap);
    const dy = e.clientY - dragStartY - dragAccY * (metrics.zeilenHoehe + metrics.gap);
    const { dxCells, dyCells } = pixelDeltaToCells(dx, dy, metrics);
    if (dxCells !== 0 || dyCells !== 0) {
      workspaceStore.moveContainer(container.id, dxCells, dyCells);
      dragAccX += dxCells;
      dragAccY += dyCells;
    }
  }

  function endMove(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  }

  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeAccW = 0;
  let resizeAccH = 0;

  function startResize(e: PointerEvent) {
    if (!editor) return;
    e.preventDefault();
    e.stopPropagation();
    workspaceStore.selectContainer(container.id);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeAccW = 0;
    resizeAccH = 0;
  }

  function onResize(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (!target.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - resizeStartX - resizeAccW * (metrics.spaltenBreite + metrics.gap);
    const dy = e.clientY - resizeStartY - resizeAccH * (metrics.zeilenHoehe + metrics.gap);
    const { dxCells, dyCells } = pixelDeltaToCells(dx, dy, metrics);
    if (dxCells !== 0 || dyCells !== 0) {
      workspaceStore.resizeContainer(container.id, dxCells, dyCells);
      resizeAccW += dxCells;
      resizeAccH += dyCells;
    }
  }

  function endResize(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  }
</script>

<div
  class="container-view"
  class:editing={editor}
  class:selected
  style="left: {box.left}px; top: {box.top}px; width: {box.width}px; height: {box.height}px;"
  on:click={onContainerClick}
  role="presentation"
>
  <div class="container-header">
    {#if editor}
      <span
        class="drag-handle"
        role="button"
        tabindex="0"
        aria-label="Container verschieben"
        on:pointerdown={startMove}
        on:pointermove={onMove}
        on:pointerup={endMove}
        on:pointercancel={endMove}
      >&#x2630;</span>
    {/if}
    <span class="title">{container.titel ?? tool?.name ?? container.toolId}</span>
    <span class="status">{container.breite}&times;{container.hoehe}</span>
  </div>
  <div class="container-body">
    <ToolContent {tool} />
  </div>
  {#if editor}
    <div
      class="resize-handle"
      role="button"
      tabindex="0"
      aria-label="Container-Groesse aendern"
      on:pointerdown={startResize}
      on:pointermove={onResize}
      on:pointerup={endResize}
      on:pointercancel={endResize}
    ></div>
  {/if}
</div>
