<script>
	import { onMount } from "svelte";
	import Schema from "./Schema.svelte";

	let schemas;

	onMount(async () => {
		await fetch(`http://0.0.0.0:3010/openclinica/s_02052020test`)
			.then(r => r.json())
			.then(data => {
				schemas = data;
			});
	})


</script>

<style>
	.loading {
		opacity: 0;
		animation: 0.4s 0.8s forwards fade-in;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	li {
		list-style-type: georgian;
	}
</style>

{#if schemas}
	{#each schemas as schema }
		<ul>
			<li>		
				<Schema {schema} />
			</li>
		</ul>
	{/each}

{:else}
	<p class="loading">loading...</p>
{/if}
