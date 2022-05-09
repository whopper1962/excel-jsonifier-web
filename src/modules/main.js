const XLSX = require('xlsx');
const { exec } = require('child_process');
const FILE_SYSTEM = require('fs');
const CURRENT_DIRECTORY_PATH = process.cwd();
const QUESTIONS = require('../lib/interface');
const OBJECT_CREATOR = require('../lib/objectCreator');
const DUPLICATE_CHECKER = require('../lib/duplicateChecker');
const COLORS = require('colors');
const ALL_FILE_NAMES = FILE_SYSTEM.readdirSync(`${CURRENT_DIRECTORY_PATH}/target_excel/`);
const FILE_NAMES = ALL_FILE_NAMES.filter(((name) => {
  return name !== '.gitkeep' && (name.indexOf('~$') === -1);
}));

console.log('HOGE');

let EXCEL_FILE_CONTENTS = '';
let COLUMN_RANGE = '';
let MIN_RANGE_NUMBER = '';
let MAX_RANGE_NUMBER = '';
let NUMBER_OF_PARENT_KEYS = '';
let SHEET_COLUMNS = [];
let NUMBER_OF_COLUMNS = [];
let OBJECT_TO_JSON = {};
let PARENT_KEY_COLUMNS = [];
let SELECTED_FILE = '';
let SELECTED_SHEET = '';
let VALUE_COLUMN = '';
let KEY_COLUMN = '';
let SELECTED_DELETE_FLAG_COLUMN = '';
let EXCEL_DATA = {
  keys: [],
  values: []
};
let UNDEFINED_KEY_CELL = [];
let UNDEFINED_VALUE_CELL = [];
let IS_DELETE_FLAG_NEEDED = false;

start();

function executeShellScript () {
  return new Promise((resolve) => {
    let script = exec('sh introduction.sh',
      (error, stdout, stderr) => {
        console.log(stdout);
        if (error !== null) {
          console.log(`exec error: ${error}`);
        }
        resolve();
      }
    );
  });
}

async function start () {
  await executeShellScript();
  getData();
}

function initData () {
  EXCEL_FILE_CONTENTS = '';
  COLUMN_RANGE = '';
  MIN_RANGE_NUMBER = '';
  MAX_RANGE_NUMBER = '';
  EXCEL_DATA = {
    keys: [],
    values: []
  };
  NUMBER_OF_PARENT_KEYS = '';
  SHEET_COLUMNS = [];
  NUMBER_OF_COLUMNS = [];
  OBJECT_TO_JSON = {};
  PARENT_KEY_COLUMNS = [];
  SELECTED_FILE = '';
  SELECTED_SHEET = '';
  VALUE_COLUMN = '';
  KEY_COLUMN = '';
  SELECTED_DELETE_FLAG_COLUMN = '';
  IS_DELETE_FLAG_NEEDED = false;
}

async function getData () {
  const result = await QUESTIONS.userInfoFileSelecter(FILE_NAMES);
  SELECTED_FILE = result.selectedFile;
  EXCEL_FILE_CONTENTS = XLSX.readFile(`${CURRENT_DIRECTORY_PATH}/target_excel/${result.selectedFile}`);
  const sheetSelecterResult = await QUESTIONS.userInfoSheetSelecter(EXCEL_FILE_CONTENTS.Props.SheetNames);
  SELECTED_SHEET = sheetSelecterResult.selectedSheetName;
  COLUMN_RANGE = EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET]['!ref'].split(':');
  MIN_RANGE_NUMBER = Number(COLUMN_RANGE[0].replace(/[^0-9]/g, ''));
  MAX_RANGE_NUMBER = Number(COLUMN_RANGE[1].replace(/[^0-9]/g, ''));
  let getMinRangeResult = await QUESTIONS.getMinRange(MIN_RANGE_NUMBER, MAX_RANGE_NUMBER - 1);
  MIN_RANGE_NUMBER = Number(getMinRangeResult.selectedMinRange);
  let getMaxRangeResult = await QUESTIONS.getMaxRange(MIN_RANGE_NUMBER + 1, MAX_RANGE_NUMBER);
  MAX_RANGE_NUMBER = Number(getMaxRangeResult.selectedMaxRange);
  let sheetData = Object.keys(EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET]).filter((keys) => {
    return keys !== '!ref' && keys !== '!margins';
  });
  let sheetNumbers = sheetData.map((data) => {
    return data.replace(/[0-9]/g, '');
  });
  SHEET_COLUMNS = [...new Set(sheetNumbers)];
  for (let i = 0; i < SHEET_COLUMNS.length; i++) {
    NUMBER_OF_COLUMNS.push(i + 1);
  }
  const isDeleteFlagNeededResult = await QUESTIONS.isDeleteFlagNeeded();
  IS_DELETE_FLAG_NEEDED = isDeleteFlagNeededResult.isDeleteFlagNeeded === 'YES';
  if (IS_DELETE_FLAG_NEEDED) {
    const result = await QUESTIONS.getDeleteFlagColumn(SHEET_COLUMNS);
    SELECTED_DELETE_FLAG_COLUMN = result.selectedDeleteColumn
    SHEET_COLUMNS = SHEET_COLUMNS.filter((column) => {
      return column !== SELECTED_DELETE_FLAG_COLUMN;
    });
  }
  if (SHEET_COLUMNS.length > 2) {
    await getNumberOfParentKeysData(NUMBER_OF_COLUMNS);
    userInterfaceKeyColumnSelecter();
  } else if (SHEET_COLUMNS.length < 2) {
    console.log('');
    console.log('===================================================='.yellow);
    console.log('JSONの作成にはデータが1つ以上必要です。');
    console.log('データの数が下限(1つ)未満、または全てのデータに削除フラグが適用されています。');
    console.log('===================================================='.yellow);
    console.log('');
  } else {
    userInterfaceKeyColumnSelecter();
  }
}

async function getNumberOfParentKeysData (NUMBER_OF_COLUMNS) {
  for (let i = 0; i < 2; i++) {
    NUMBER_OF_COLUMNS.pop();
  }
  const isParentKeysSelecterNeededResult = await QUESTIONS.isParentKeysSelecterNeeded();
  if (isParentKeysSelecterNeededResult.isParentKeysSelecterNeeded === 'YES') {
    const result = await QUESTIONS.userInfoNumberOfParentKeySelecter(NUMBER_OF_COLUMNS);
    NUMBER_OF_PARENT_KEYS = result.selectedNumberOfParentKeys;
    await getParentKeysColumnData();
  }
}

async function getParentKeysColumnData () {
  for (let i = 0; i < NUMBER_OF_PARENT_KEYS; i++) {
    const result = await QUESTIONS.userInfoParentKeyColumnSelecter(SHEET_COLUMNS, i + 1);
    SHEET_COLUMNS = SHEET_COLUMNS.filter(column => {
      return column !== result.selectedParentKeyColumn;
    });
    PARENT_KEY_COLUMNS.push(result.selectedParentKeyColumn);
  }
}

async function userInterfaceKeyColumnSelecter () {
  let answer = {
    selectedKeyColumn: '',
    selectedValueColumn: ''
  };
  const result = await QUESTIONS.userInfoKeyColumnSelecter(SHEET_COLUMNS);
  KEY_COLUMN = result.selectedKeyColumn;
  answer.selectedKeyColumn = KEY_COLUMN;
  SHEET_COLUMNS = SHEET_COLUMNS.filter((column) => {
    return column !== KEY_COLUMN;
  });
  const valueColumnResult = await QUESTIONS.userInfoValueColumnSelecter(SHEET_COLUMNS);
  VALUE_COLUMN = valueColumnResult.selectedValueColumn;
  answer.selectedValueColumn = VALUE_COLUMN;
  const isConfirmedResult = await QUESTIONS.userInfoConfirmation();
  if (isConfirmedResult.confirmed === 'YES') {
    getFileInfo(answer);
  } else {
    console.log('');
    console.log('===================================================='.yellow);
    console.log('初めから情報を入力してください。');
    console.log('===================================================='.yellow);
    console.log('');
    initData();
    getData();
  }
}

function checkDeleteFlag (targetIndex) {
  if (EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${SELECTED_DELETE_FLAG_COLUMN}${targetIndex}`]) {
    return EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${SELECTED_DELETE_FLAG_COLUMN}${targetIndex}`].w;
  }
}

function getFileInfo (answer) {
  let objectBlueprint = [];
  for (let i = MIN_RANGE_NUMBER; i <= MAX_RANGE_NUMBER; i++) {
    let objectBlueprintData = {
      parents: [],
      keyAndValue: {
        key: '',
        value: ''
      }
    };
    const dataInDeleteFlagCell = checkDeleteFlag(i);
    if (dataInDeleteFlagCell !== undefined) {
      continue;
    }
    for (let parentIndex = 0; parentIndex < PARENT_KEY_COLUMNS.length; parentIndex++) {
      if (EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${PARENT_KEY_COLUMNS[parentIndex]}${i}`]) {
        objectBlueprintData.parents.push(EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${PARENT_KEY_COLUMNS[parentIndex]}${i}`].w);
      } else {
        objectBlueprintData.parents.push(null);
      }
    }
    if (EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${answer.selectedKeyColumn}${i}`]) {
      objectBlueprintData.keyAndValue.key = EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${answer.selectedKeyColumn}${i}`].w;
    } else {
      objectBlueprintData.keyAndValue.key = null;
      UNDEFINED_KEY_CELL.push(`${answer.selectedKeyColumn}${i}`);
    }
    if (EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${answer.selectedValueColumn}${i}`]) {
      objectBlueprintData.keyAndValue.value = EXCEL_FILE_CONTENTS.Sheets[SELECTED_SHEET][`${answer.selectedValueColumn}${i}`].w;
    } else {
      objectBlueprintData.keyAndValue.value = null;
      UNDEFINED_VALUE_CELL.push(`${answer.selectedValueColumn}${i}`);
    }
    objectBlueprint.push(objectBlueprintData);
  }
  if (objectBlueprint.length < 1) {
    console.log('');
    console.log('===================================================='.yellow);
    console.log('JSONの作成にはデータが1つ以上必要です。');
    console.log('データの数が下限(1つ)未満、または全てのデータに削除フラグが適用されています。');
    console.log('===================================================='.yellow);
    console.log('');
    return;
  }
  const isNumberOfKeysAndValuesEqual = DUPLICATE_CHECKER.checkNumberOfKeysAndValues(objectBlueprint);
  if (isNumberOfKeysAndValuesEqual) {
    const duplicateCheckResults = DUPLICATE_CHECKER.checkKeyDuplicate(objectBlueprint);
    if (duplicateCheckResults.isDuplicated) {
      console.log('');
      console.log('===================================================='.yellow);
      console.log('重複したキーを検知した為、処理を中断しました。');
      console.log('以下のキーを確認してください。')
      console.log(duplicateCheckResults.duplicatedKey.green);
      console.log('===================================================='.yellow);
      console.log('');
    } else {
      OBJECT_TO_JSON = OBJECT_CREATOR.createObjectBasedOnBlueprint(objectBlueprint);
      generateJSON();
    }
  } else {
    console.log('');
    console.log('===================================================='.yellow);
    console.log('キー(' + `${KEY_COLUMN}列`.green + ')の数とバリュー(' +  `${VALUE_COLUMN}列`.green +')のデータの数が一致しません。');
    if (UNDEFINED_KEY_CELL.length > 0) {
      console.log(`データが入っていないセル(キー):${UNDEFINED_KEY_CELL}`);
    }
    if (UNDEFINED_VALUE_CELL.length > 0) {
      console.log(`データが入っていないセル(バリュー):${UNDEFINED_VALUE_CELL}`)
    }
    console.log('===================================================='.yellow);
    console.log('');
  }
}

async function generateJSON () {
  const result = await QUESTIONS.userInfoJSONFileName();
  const fileName = result.selectedJSONFileName;
  const json = JSON.stringify(OBJECT_TO_JSON, null, 4);
  FILE_SYSTEM.writeFileSync(`${CURRENT_DIRECTORY_PATH}/generated_json/${fileName}.json`, json);
  console.log('');
  console.log('===================================================='.yellow);
  console.log('JSONファイル(' + `${fileName}.json`.green + ')が正常に作成されました。');
  console.log('===================================================='.yellow);
  console.log('');
}
