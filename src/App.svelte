<script>
  let employee = [
    { firstName: 'adam', lastName: 'man' },
    { firstName: 'bill', lastName: 'gates' },
    { firstName: 'mark', lastName: 'zuckerberg' },
  ]

  let searchFirstName = ''
  let firstName = ''
  let lastName = ''
  let i = 0

  $: filterEmployee = searchFirstName
    ? employee.filter(theEmployee => {
        const name = `${theEmployee.lastName},${theEmployee.firstName}`
        return name.toLowerCase().startsWith(searchFirstName.toLowerCase())
      })
    : employee

  $: selected = filterEmployee[i]

  $: reset_inputs(selected)

  function create() {
    employee = employee.concat({ firstName, lastName })
    i = employee.length - 1
    firstName = lastName = ''
  }

  function update() {
    selected.firstName = firstName
    selected.lastName = lastName
    employee = employee
  }

  function deleteEmployee() {
    const index = employee.indexOf(selected)
    employee = [...employee.slice(0, index), ...employee.slice(index + 1)]

    firstName = lastName = ''
    i = Math.min(i, filterEmployee.length - 2)
  }

  function reset_inputs(theEmployee) {
    firstName = theEmployee ? theEmployee.firstName : ''
    lastName = theEmployee ? theEmployee.lastName : ''
  }
</script>

<style>
  * {
    font-family: inherit;
    font-size: inherit;
  }

  input {
    display: block;
    margin: 0 0 0.5em 0;
  }

  select {
    float: left;
    margin: 0 1em 1em 0;
    width: 14em;
  }

  .buttons {
    clear: both;
  }
</style>

<input type="text" placeholder="search employee" bind:value={searchFirstName} />

<select name="" id="" bind:value={i} size={5}>
  {#each filterEmployee as theEmployee, i}
    <option value={i}>{theEmployee.lastName},{theEmployee.firstName}</option>
  {/each}
</select>

<label for="">
  <input type="text" bind:value={firstName} placeholder="first name" />
</label>
<label for="">
  <input type="text" bind:value={lastName} placeholder="last name" />
</label>

<div class="buttons">
  <button on:click={create} disabled={!firstName || !lastName}>Create</button>
  <button on:click={update} disabled={!firstName || !lastName || !selected}>
    update
  </button>
  <button on:click={deleteEmployee} disabled={!selected}>delete</button>

</div>
