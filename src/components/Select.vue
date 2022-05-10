<template>
<div class="select-form">
  <select class="form-control" v-model="selectValue" :disabled="disabled">
    <template v-for="(val, index) in values">
      <option :key="`value_${index}`">{{ val[keyForOptions] }}</option>
    </template>
  </select>
</div>
</template>
<script>

export default {
  props: {
    values: {type: Array},
    value: {type: String},
    keyForOptions: {type: String},
    disabled: {type: Boolean, default: false}
  },
  computed: {
    selectValue: {
      get () {
        return this.value;
      },
      set (value) {
        this.$emit('input', value);
      }
    }
  }
}
</script>
