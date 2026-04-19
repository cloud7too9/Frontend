<script lang="ts">
  import { onMount } from "svelte";
  import { workspaceStore } from "./lib/workspace.store.js";
  import EditorToolbar from "./components/EditorToolbar.svelte";
  import WorkspaceGrid from "./components/WorkspaceGrid.svelte";

  onMount(() => {
    workspaceStore.loadInitial();
  });
</script>

{#if $workspaceStore.status === "loading" && !$workspaceStore.workspace}
  <main><p>Lade Workspace...</p></main>
{:else if $workspaceStore.status === "error" && !$workspaceStore.workspace}
  <main><p style="color: #b42318">Fehler: {$workspaceStore.message}</p></main>
{:else if $workspaceStore.workspace}
  <EditorToolbar
    tools={$workspaceStore.tools}
    editor={$workspaceStore.editor}
    status={$workspaceStore.status}
    message={$workspaceStore.message}
  />
  <main>
    <WorkspaceGrid
      workspace={$workspaceStore.workspace}
      tools={$workspaceStore.tools}
      editor={$workspaceStore.editor}
    />
  </main>
{/if}
