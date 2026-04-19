<script lang="ts">
  import type { Tool } from "@mainhub/shared";
  export let tool: Tool | undefined;
</script>

{#if !tool}
  <div style="color: var(--muted)">Unbekanntes Tool</div>
{:else if tool.typ === "extern"}
  <iframe title={tool.name} src={tool.quelle} referrerpolicy="no-referrer" />
{:else}
  <div>
    <strong>{tool.name}</strong>
    <div style="color: var(--muted); font-size: 0.8rem">quelle: {tool.quelle}</div>
    <div style="margin-top: 0.5rem">Internes Tool (Platzhalter in V0).</div>
  </div>
{/if}
