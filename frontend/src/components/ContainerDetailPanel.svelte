<script lang="ts">
  import type { Container, Tool } from "@mainhub/shared";
  import { workspaceStore } from "../lib/workspace.store.js";

  export let container: Container;
  export let tools: Tool[];

  let titelDraft = container.titel ?? "";
  $: if (container.id) titelDraft = container.titel ?? "";

  function commitTitle() {
    workspaceStore.renameContainer(container.id, titelDraft);
  }

  function onTitleKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  }

  function onToolChange(e: Event) {
    const toolId = (e.currentTarget as HTMLSelectElement).value;
    workspaceStore.changeContainerTool(container.id, toolId);
  }

  function onDelete() {
    workspaceStore.removeContainer(container.id);
  }
</script>

<aside class="detail-panel" aria-label="Container-Details">
  <h2>Container</h2>
  <dl>
    <dt>Id</dt>
    <dd class="mono">{container.id}</dd>
    <dt>Position</dt>
    <dd>{container.x}, {container.y}</dd>
    <dt>Größe</dt>
    <dd>{container.breite} × {container.hoehe}</dd>
  </dl>

  <label class="field">
    <span>Titel</span>
    <input
      type="text"
      bind:value={titelDraft}
      on:blur={commitTitle}
      on:keydown={onTitleKey}
      placeholder="optional"
    />
  </label>

  <label class="field">
    <span>Tool</span>
    <select value={container.toolId} on:change={onToolChange}>
      {#each tools as t}
        <option value={t.id}>{t.name}</option>
      {/each}
    </select>
  </label>

  <button class="danger" on:click={onDelete}>Löschen</button>
</aside>
