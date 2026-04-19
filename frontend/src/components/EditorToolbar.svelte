<script lang="ts">
  import type { Tool } from "@mainhub/shared";
  import { workspaceStore } from "../lib/workspace.store.js";

  export let tools: Tool[];
  export let editor: boolean;
  export let status: string;
  export let message: string;

  let auswahl: string = "";
  $: if (!auswahl && tools.length > 0) auswahl = tools[0].id;

  function addContainer() {
    if (!auswahl) return;
    workspaceStore.addContainer(auswahl);
  }
</script>

<header class="toolbar">
  <h1>MainHub V0</h1>
  <button on:click={() => workspaceStore.toggleEditor()}>
    Editor: {editor ? "an" : "aus"}
  </button>
  {#if editor}
    <select bind:value={auswahl} aria-label="Tool auswaehlen">
      {#each tools as t}
        <option value={t.id}>{t.name}</option>
      {/each}
    </select>
    <button on:click={addContainer}>Container hinzufuegen</button>
  {/if}
  <button class="primary" on:click={() => workspaceStore.saveNow()}>Speichern</button>
  <span class="status">{status}{message ? `: ${message}` : ""}</span>
</header>
