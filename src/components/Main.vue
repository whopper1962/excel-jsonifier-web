<template>
<div class="main-div">
  <h2>Excel JSONifier</h2>
  <p>created by Masashi Kawakami</p>
  <div class="form-width">
    <b-form-file
      v-model="file1"
      :state="Boolean(file1)"
      drop-placeholder="Drop file here..."
      accept=".xlsx"
    ></b-form-file>
  </div>
  <button class="btn btn-success" @click="jsonify()" :disabled="!file1">
    JSONIFY!
  </button>
</div>
</template>
<script>
export default {
  components: {
  },
  data () {
    return {
      file1: null
    };
  },
  methods: {
    jsonify () {
      this.$toasted.show(`JSONFIED!`);
    }
  }
}
</script>
<style>
.main-div {
  padding-top: 20vh;
}
.form-width {
  width: 500px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 3vh;
  padding-top: 2vh;
}
</style>