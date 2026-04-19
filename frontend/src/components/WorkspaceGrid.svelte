<script lang="ts">
  import { onMount } from "svelte";
  import type { Tool, Workspace } from "@mainhub/shared";
  import { metricsFor, gridHeightRows, GAP_PX } from "../lib/grid.js";
  import { workspaceStore } from "../lib/workspace.store.js";
  import ContainerView from "./ContainerView.svelte";

  export let workspace: Workspace;
  export let tools: Tool[];
  export let editor: boolean;
  export let selectedContainerId: string | null;

  let gridEl: HTMLDivElement | undefined;
  let widthPx = 800;

  onMount(() => {
    if (!gridEl) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        widthPx = entry.contentRect.width;
      }
    });
    ro.observe(gridEl);
    widthPx = gridEl.clientWidth;
    return () => ro.disconnect();
  });

  $: metrics = metricsFor(workspace, widthPx);
  $: rows = gridHeightRows(workspace.container);
  $: heightPx = rows * metrics.zeilenHoehe + (rows + 1) * metrics.gap;

  function onBackgroundClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      workspaceStore.clearSelection();
    }
  }
</script>

<div
  class="grid"
  bind:this={gridEl}
  style="height: {heightPx}px; padding-bottom: {GAP_PX}px;"
  on:click={onBackgroundClick}
  role="presentation"
>
  {#each workspace.container as c (c.id)}
    <ContainerView
      container={c}
      {tools}
      {metrics}
      {editor}
      selected={editor && c.id === selectedContainerId}
    />
  {/each}
</div>
