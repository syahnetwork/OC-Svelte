<script>
  import { onMount } from "svelte";
  import Schema from "./Schema.svelte";
  import Schemas from "./Schemas.svelte";

  let schemas;
  let schema;

</script>

<svelte:head>
  <title>Svelte Open Clinica</title>
</svelte:head>

<style>

main {
  background-color: lavenderblush;
  font-size: 15px;
}
  h1 {
    font-size: 25px;
	}

</style>

  <h1>The Open Clinica Svelte App</h1>
<main>
		<Schemas {schemas} />
</main>