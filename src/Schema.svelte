<script>
	export let schema;
</script>

<style>
	article {
		margin: 0 0 1em 0;
	}

	h1 {
		font-size: 1.4em;
		margin: 0;
		display: block;
	}
</style>

<article>
		<h1>{schema.name}</h1>
		<small>
			Schema : <b>{schema.schema}</b>		
		</small><br/>
		<small>
			Database of : <b>{schema.database}</b>
		</small><br/>
		<!-- <small>
			Continent's size: <b>{continent.area}</b>
		</small> -->
</article>