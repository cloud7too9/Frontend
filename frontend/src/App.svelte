<script lang="ts">
  import { onMount } from "svelte";
  import { workspaceStore } from "./lib/workspace.store.js";
  import EditorToolbar from "./components/EditorToolbar.svelte";
  import WorkspaceGrid from "./components/WorkspaceGrid.svelte";
  import ContainerDetailPanel from "./components/ContainerDetailPanel.svelte";

  onMount(() => {
    workspaceStore.loadInitial();
  });

  $: selectedContainer =
    $workspaceStore.workspace && $workspaceStore.selectedContainerId
      ? $workspaceStore.workspace.container.find((c) => c.id === $workspaceStore.selectedContainerId) ?? null
      : null;
  $: showSidebar = $workspaceStore.editor && selectedContainer !== null;
</script>

{#if $workspaceStore.isLoading && !$workspaceStore.workspace}
  <main><p>Lade Workspace...</p></main>
{:else if $workspaceStore.errorMessage && !$workspaceStore.workspace}
  <main><p style="color: #b42318">Fehler: {$workspaceStore.errorMessage}</p></main>
{:else if $workspaceStore.workspace}
  <EditorToolbar
    tools={$workspaceStore.tools}
    editor={$workspaceStore.editor}
    saveState={$workspaceStore.saveState}
    errorMessage={$workspaceStore.errorMessage}
    isLoading={$workspaceStore.isLoading}
  />
  <main class="workspace" class:with-sidebar={showSidebar}>
    <WorkspaceGrid
      workspace={$workspaceStore.workspace}
      tools={$workspaceStore.tools}
      editor={$workspaceStore.editor}
      selectedContainerId={$workspaceStore.selectedContainerId}
    />
    {#if showSidebar && selectedContainer}
      <ContainerDetailPanel
        container={selectedContainer}
        tools={$workspaceStore.tools}
      />
    {/if}
  </main>
{/if}
