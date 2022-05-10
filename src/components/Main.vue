<template>
<div class="main-div hoge">
  <h2>Excel JSONifier</h2>
  <p>created by Masashi Kawakami</p>
  <div class="form-width">
    <b-form-file
      v-model="file1"
      :state="Boolean(file1)"
      drop-placeholder="Drop file here..."
      accept=".xlsx"
    ></b-form-file>
    <Select
      :values="columnOptions"
      :keyForOptions="`num`"
      :value="selectedColumn"
      :disabled="!isExcelUploaded"
      @input="inputValue"
    />
    <Select
      :values="columnOptionsTwo"
      :keyForOptions="`num`"
      :value="selectedColumnTwo"
      :disabled="!isExcelUploaded"
      @input="inputValueTwo"
    />
  </div>
  <button
    :class="isExcelUploaded ? `btn btn-success` : `btn btn-primary`"
    @click="isExcelUploaded ? jsonify() : readFile()" :disabled="!file1"
  >
    {{ isExcelUploaded ? `JSONIFY!` : `READ!` }}
  </button>
</div>
</template>
<script>
import Select from '@/components/Select';
export default {
  components: {
    Select
  },
  data () {
    return {
      file1: null,
      columnOptions: [],
      columnOptionsTwo: [],
      selectedColumn: '',
      selectedColumnTwo: '',
      isExcelUploaded: false
    };
  },
  methods: {
    jsonify () {
      this.$toasted.show(`JSONFIED!`);
    },
    readFile () {
      this.isExcelUploaded = true;
    },
    inputValue (newVal) {
      this.selectedColumn = newVal;
    },
    inputValueTwo (newVal) {
      this.selectedColumnTwo = newVal;
    }
  }
}
</script>