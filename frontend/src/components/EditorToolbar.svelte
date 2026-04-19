<script lang="ts">
  import type { Tool } from "@mainhub/shared";
  import type { SaveState } from "../lib/workspace.store.js";
  import { workspaceStore } from "../lib/workspace.store.js";

  export let tools: Tool[];
  export let editor: boolean;
  export let saveState: SaveState;
  export let errorMessage: string | null;
  export let isLoading: boolean;

  let auswahl: string = "";
  $: if (!auswahl && tools.length > 0) auswahl = tools[0].id;

  const SAVE_LABEL: Record<SaveState, string> = {
    ungespeichert: "ungespeichert",
    speichert: "speichert…",
    gespeichert: "gespeichert",
    fehler: "fehler",
  };

  function addContainer() {
    if (!auswahl) return;
    workspaceStore.addContainer(auswahl);
  }
</script>

<header class="toolbar">
  <h1>MainHub V1</h1>
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
  <span class="save-badge" data-state={saveState}>{SAVE_LABEL[saveState]}</span>
  {#if isLoading}
    <span class="status">lädt…</span>
  {/if}
  {#if errorMessage}
    <span class="error">Fehler: {errorMessage}</span>
  {/if}
</header>
