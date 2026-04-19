import "./styles.css";
import App from "./App.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("Root-Element #app fehlt");

new App({ target });
