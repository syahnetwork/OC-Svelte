<script>
  export let schema;
  console.log(schema);

  let addParticipant = () => {
    const newParticipant = {
      study_subject_id: schema.length + 1,
      label: schema.label,
      study_id: schema.study_id
    };
    schema = schema.concat(addParticipant);
    schema = {
      study_subject_id: null,
      label: "",
      study_id: ""
    };
  };

let isEdit = false;

  let editParticipant = schema => {
    isEdit = true;
    data = schema;
  };
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

<!-- <article>
		<h1>{schema.name}</h1>
		<small>
			Schema : <b>{schema.schema}</b>		
		</small><br/>
		<small>
			Database of : <b>{schema.database}</b>
		</small><br/>
</article> -->
<article>
  <h1>study_subject_id = {schema.study_subject_id}</h1>
  <small>
    Label :
    <b>{schema.label}</b>
  </small>
  <br />
  <small>
    study_id :
    <b>{schema.study_id}</b>
  </small>
  <br />
</article>

<section>
  <div class="container">
    <div class="row mt-5 ">
      <div class="col-md-6">
        <div class="card p-2 shadow">
          <div class="card-body">
            <h5 class="card-title mb-4">Add New Participant</h5>
            <form>
              <div class="form-group">
                <label for="title">label</label>
                <input
                  bind:value={schema.label}
                  type="text"
                  class="form-control"
                  id="text"
                  placeholder="label" />
              </div>

              <div class="form-group">
                <label for="category">study_id</label>
                <input
                  bind:value={schema.study_id}
                  type="text"
                  class="form-control"
                  id="text"
                  placeholder="study_id" />
              </div>

              <!-- <div class="form-group">
                <label for="content">Content</label>
                <textarea
                  bind:value={data.content}
                  class="form-control"
                  id="content"
                  rows="3"
                  placeholder="Note Content" />
              </div> -->
              {#if isEdit === false}
                <button
                  type="submit"
                  on:click|preventDefault={addParticipant}
                  class="btn btn-primary">
                  Add Participant
                </button>
              <!-- {:else}
                <button
                  type="submit"
                  on:click|preventDefault={updateNote}
                  class="btn btn-info">
                  Edit Note
                </button> -->
              {/if}
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
