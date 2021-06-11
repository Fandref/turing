    var ctlTape;
    var ctlProgram;
    var ctlErrorType;
    var ctlErrorMessage;
    var ctlConfig;
    var ctlState;
    var ctlNewState;
    var ctlSpeed;
    var ctlNextCommand;
    var ctlTapeContainer;
    var flTMDoStop = true;

    var btnSetConfig = document.getElementById('btnSetConfig');
    var tmMoreStatesButton = document.getElementById('tmMoreStatesButton');
    var btnShowNextCommand = document.getElementById('btnShowNextCommand');
    var btnStep = document.getElementById('btnStep');
    var btnStart = document.getElementById('btnStart');

    var btnStop = document.getElementById('btnStop');

    var btnSetState = document.getElementById('btnSetState');

    

    

    
    

    // Поддержка алфавита
    var chkDigitIds = "0 1 2 3 4 5 6 7 8 9";
    var smbDigit = "0123456789";
    var chkAlphaIds = "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z";
    var smbAlpha = "abcdefghijklmnopqrstuvwxyz";
    var chkSymbolIds = "Less Greater Equal Plus Minus Star Slash Hat Percent";
    var smbSymbol = "<>=+-*/^%";
    var nExtraSymbolNumber = 14;


    // Поддержка множества состояний
    var chkStateIds = "Q1 Q2 Q3 Q4 Q5 Q6 Q7 Q8 Q9 Q10 Q11 Q12 Q13 Q14 Q15 Q16 Q17 Q18 Q19";
    var stState = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9",
                   "q10", "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19"];
    var cellWidth = 30;
    var nExtraStateNumber = 10;

    var arTMTape = [];
    var tapeShift = 100;
    var setTMProgram;
    var setTMAlphabet;
    var setTMStates;
    var strTMCurrentState;
    var idxTMCurrentCell;

    var storage = localStorage;

    function init() {
      ctlTape         = document.getElementById("tape");

      ctlProgram      = document.getElementById("program");
      ctlErrorType    = document.getElementById("errorType");
      ctlErrorMessage = document.getElementById("errorMessage");
      ctlConfig       = document.getElementById("config");
      ctlState        = document.getElementById("state");
      ctlNewState     = document.getElementById("newState");
      ctlSpeed        = document.getElementById("speed");
      ctlNextCommand  = document.getElementById("ctlNextCommand");
      ctlTapeContainer  = document.getElementById("ctlTapeContainer");
      // smbNBSP = document.getElementById("ctlNBSP").firstChild.nodeValue;


      for(var i = -tapeShift; i < tapeShift; i++) {
        createCell(i);
       }
      tmClearTape();
      loadLocalStorageSave();
     }

    function createCell(n) {
      // var cell = document.createElement("div");
      var cell = document.createElement("td");
      var input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("size", 1);
      cell.appendChild(input);
      cell.setAttribute("tabindex", "1");
      cell = ctlTape.appendChild(cell);
      cell.firstChild.readOnly = true;
      cell.tabIndex = 1;
      cell.tapeIndex = n;
      cell.className = "blankSymbol";
      cell.onclick = function() { ctlTape_click(this.tapeIndex+1); };
      // cell.setAttribute("style", "left: " + (30 * (n + tapeShift)) + "px");
      return cell;
     }

    function tmFocusCell(n) {
      if(!isNaN(idxTMCurrentCell)) {
        var cell = ctlTape.childNodes[idxTMCurrentCell + tapeShift];
        cell.className = cell.className.replace(/focused/, "")
            .replace(/\s+/g, " ").replace(/^\s+/, "").replace(/\s+$/, "");
       }
      var cell = ctlTape.childNodes[n + tapeShift];
      cell.className = "focused" + (cell.className ? " " + cell.className : "");
      idxTMCurrentCell = n;
      cell.firstChild.focus();
      // if(ctlTapeContainer.doScroll) {
      //   var th = Math.floor(600 / (tapeShift*2) * (n + tapeShift));
      //   window.setTimeout(function() {
      //   while(th--)
      //     ctlTapeContainer.doScroll("scrollbarRight");
      //   }, 50);
      //   //alert(100 / (tapeShift*2) * (n + tapeShift));
      // }
     }

    function tmSetCellValue(n, v) {
      if(v == 'B')
        v = '';
      arTMTape[n + tapeShift] = v;
      
       
      var cell = ctlTape.childNodes[n + tapeShift];
      
      cell.className = cell.className.replace(/blankSymbol/, "")
          .replace(/\s+/g, " ").replace(/^\s+/, "").replace(/\s+$/, "");
      if(v == '')
        cell.className = "blankSymbol" + (cell.className ? " " + cell.className: "");
      cell.firstChild.value = v;
     }

    function tmGetCellValue(n) {
      var v = arTMTape[n + tapeShift];
      return v == '' ? 'B' : v;
     }
     let error_content = document.querySelector(".error-container");
    function tmClearErrors() {
      error_content.classList.remove('show');
      while(ctlErrorType.childNodes.length)
        ctlErrorType.removeChild(ctlErrorType.lastChild);
      while(ctlErrorMessage.childNodes.length)
        ctlErrorMessage.removeChild(ctlErrorMessage.lastChild);

     }

    function tmCompileError(strType, b = -1, e = -1) {
      if(ctlProgram.setSelectionRange && typeof(ctlProgram.setSelectionRange) == "function" && b <= e && b >= 0 && e >= 0) {
        ctlProgram.select();
        ctlProgram.setSelectionRange(b, e);
       }
      var errT = document.createTextNode(strType);
      ctlErrorType.appendChild(errT);
      var strMessage = ctlProgram.value.substring(b, e);
      var errM = document.createTextNode(strMessage);
      ctlErrorMessage.appendChild(errM);
      error_content.classList.add('show');
      // alert(strType);
     }

    function tmCompile(text) {
      tmClearErrors();
      function nextE(bb) {
        var ee = text.substring(bb, text.length).indexOf("\n");
        return ee == -1 ? text.length : bb + ee;
       }
      var arNewProgram = {};
      for(var idxline = 1, b = 0, e = nextE(b); b < text.length; b = e + 1, e = nextE(b), idxline++ ) {
        var line = text.substring(b, e);
        line = line.replace(/\/\/.*$/, "");
        line = line + " ";
        // var arMatch = line.match(/^\s*(?:([^\s][a-zA-Z0-9][a-zA-GI-KM-QS-Z0-9\_\^\*]*\-\>[^\s][a-zA-Z0-9][a-zA-GI-KM-QS-Z0-9\_\^\*]*[LRH]?)\s+)*$/);
        var arMatch = line.match(/^\s*(?:([^\s][a-zA-Z0-9](?:[^\s\-\>]*[^\s\-\>LRH])*\-\>[^\s][a-zA-Z0-9](?:[^\s\-\>]*[^\s\-\>LRH])*[LRH]?)\s+)*$/);
        if(!arMatch)
          return tmCompileError("Синтаксичка помилка в " + idxline + "-й стрічкі", b, e);
        for(var idxCmd = 1; idxCmd < arMatch.length; idxCmd++) {
          var strCmd = arMatch[idxCmd];
          if(!strCmd)
            continue;
          var parsedCommand = tmParseCommand(strCmd, idxline);
          if(!parsedCommand)
            return tmCompileError("Непередбаченна помилка в " + idxline + "-й стрічкі", b, e);
          if("errorMessage" in parsedCommand)
            return tmCompileError(parsedCommand.errorMessage, b, e);
          var prefix = "" + parsedCommand.smbFrom + parsedCommand.stFrom;
          if(prefix in arNewProgram)
            return tmCompileError("Стрічка " + idxline + ": Повторення команди " + strCmd + " для символа '"
                                    + parsedCommand.smbFrom + "' і стану " + parsedCommand.stFrom, b, e);
          arNewProgram[prefix] = parsedCommand;
         }
       }
      setTMProgram = arNewProgram;
      return true;
     }

    function tmParseCommand(str, idxline) {
      // var arMatch = str.match(/(.)([a-zA-Z0-9][a-zA-GI-KM-QS-Z0-9\_\^\*]*)\-\>(.)([a-zA-Z0-9][a-zA-GI-KM-QS-Z0-9\_\^\*]*)([LRH]?)/);
      var arMatch = str.match(/(.)([a-zA-Z0-9](?:[^\s\-\>]*[^\s\-\>LRH])*)\-\>(.)([a-zA-Z0-9](?:[^\s\-\>]*[^\s\-\>LRH])*)([LRH]?)/);
      if(!arMatch || arMatch.length != 6)
        return {
          errorMessage: "Стрічка " + idxline + ": Непередбачена помилка в команді" + str
         };
      var smbFrom = arMatch[1];
      var stFrom  = arMatch[2];
      var smbTo   = arMatch[3];
      var stTo    = arMatch[4];
      var mvTo    = arMatch[5];
      if(!(smbFrom in setTMAlphabet))
        return {
          errorMessage: "Стрічка " + idxline + ": В команді " + str + " символ '" + smbFrom + "' не входить в алвфавіт вашої машини Тьюрінга"
         };
      if(!(stFrom in setTMStates))
        return {
          errorMessage: "Стрічка " + idxline + ": В команді " + str + " стан '" + stFrom + "' не входить в множину станів вашої машини Тьюрінга"
         };
      if(!(smbTo in setTMAlphabet))
        return {
          errorMessage: "Стрічка " + idxline + ": В команді " + str + " символ '" + smbTo + "' не входить в алвфавіт вашої машини Тьюрінга"
         };
      if(!(stTo in setTMStates))
        return {
          errorMessage: "Стрічка " + idxline + ": В команді " + str + " стан '" + stTo + "' не входить в множину станів вашої машини Тьюрінга"
         };
      if(!mvTo)
        mvTo = 'H';
      return {
        smbFrom : smbFrom,
        smbTo   : smbTo,
        stFrom  : stFrom,
        stTo    : stTo,
        mvTo    : mvTo
       };
     }

    function tmClearTape() {
      for(var idxCell = 0; idxCell < tapeShift; idxCell++) {
        tmSetCellValue(idxCell, "");
       }
     }

    function tmSetConfig(strConfig) {
      tmClearErrors();
      for(var idxSymbol = 0; idxSymbol < strConfig.length; idxSymbol++)
        if(!(strConfig.charAt(idxSymbol) in setTMAlphabet))
          return tmCompileError("Символ '" + strConfig.charAt(idxSymbol) + "' не входить в алфавіт вашої машини Тьюрінга");
      tmClearTape();
      for(var idxSymbol = 0; idxSymbol < strConfig.length; idxSymbol++)
        tmSetCellValue(idxSymbol, strConfig.charAt(idxSymbol));
      tmFocusCell(strConfig.length + 1);
      tmFocusCell(0);
     }

    function tmSetState(strState) {
      tmClearErrors();
      if(!strState)
        return tmCompileError("Не встановленно стан машини Тьюрінга");
      if(!(strState in setTMStates))
        return tmCompileError("Стан '" + strState + "' не входить в множину станів вашої машини Тьюрінга");
      while(ctlState.childNodes.length)
        ctlState.removeChild(ctlState.lastChild);
      tnState = document.createTextNode(strState);
      ctlState.appendChild(tnState);
      strTMCurrentState = strState;
      return true;
     }

    function tmStep() {
      tmClearErrors();
      if(strTMCurrentState == "STOP") {
        showMessage("Робота машини Тьюрінга успішно завершена");
        return false;
      }
      if(!strTMCurrentState)
        return tmCompileError("Не встановлено стан машини Тьюрінга");
      if(!(strTMCurrentState in setTMStates))
        return tmCompileError("Стан '" + strTMCurrentState + "' не входить в множину станів вашої машини Тьюрінга");
      if(isNaN(idxTMCurrentCell))
        return tmCompileError("Не встановлена поточна комірка машини Тьюрінга");
      var smbCurrent = tmGetCellValue(idxTMCurrentCell);
      if(!smbCurrent)
        smbCurrent = 'B';
      if(!(smbCurrent in setTMAlphabet))
        return tmCompileError("Символ '" + smbCurrent + "' не входит в алфавит Вашей машини Тьюрінга");
      var prefix = "" + smbCurrent + strTMCurrentState;
      if(!setTMProgram)
        return tmCompileError("Немає команд для виконання");
      if(!(prefix in setTMProgram)) 
        return tmCompileError("Немає команди для символа '" + smbCurrent + "' і стан '" + strTMCurrentState + "'");
      var cmd = setTMProgram[prefix];
      if(!(cmd.smbTo in setTMAlphabet))
        return tmCompileError("Символ '" + cmd.smbTo + "' не входить в алфавіт вашої машини Тьюрінга\n" +
                              "При виконанні команди для символа '" + smbCurrent + "' і стану '" + strTMCurrentState + "'");
      if(!(cmd.stTo in setTMStates))
        return tmCompileError("Стан '" + cmd.stTo + "' не входить в множину станів вашої машини Тьюрінга\n" +
                              "При виконанні команди для символа '" + smbCurrent + "' і стану '" + strTMCurrentState + "'");
      if(!(cmd.mvTo == 'L' || cmd.mvTo == 'R' || cmd.mvTo == 'H'))
        return tmCompileError("Непередбачена ошибка при виконанні переміщення в команді для символа '" + smbCurrent + "' і стану '" + strTMCurrentState + "'");
      tmSetCellValue(idxTMCurrentCell, cmd.smbTo);
      tmSetState(cmd.stTo);
      switch(cmd.mvTo) {
        case 'L':
          tmFocusCell(idxTMCurrentCell - 1);
          break;
        case 'R':
          tmFocusCell(idxTMCurrentCell + 1);
          break;
        case 'H':
          break;
        default:
          return tmCompileError("Непередбачена ошибка при виконанні переміщення в команді для символа '" + smbCurrent + "' і стану '" + strTMCurrentState + "'");
       }
      return true;
     }

    function tmStart() {
      var ids = ["btnStep", "btnStart", "btnSetState", "btnSetConfig", "btnShowNextCommand"];
      for(var i = 0; i < ids.length; i++)
        document.getElementById(ids[i]).disabled = true;
      document.getElementById("btnStop").disabled = false;
      flTMDoStop = false;
      tmShowNextCommand();
      window.setTimeout(tmRepeatStep, ctlSpeed.value);
     }

    function tmRepeatStep() {
      if(!flTMDoStop && tmStep()) {
        tmShowNextCommand();
        window.setTimeout(tmRepeatStep, ctlSpeed.value);
        return;
       }
      document.getElementById("btnStop").disabled = true;
      var ids = ["btnStep", "btnStart", "btnSetState", "btnSetConfig", "btnShowNextCommand"];
      for(var i = ids.length; i--; )
        document.getElementById(ids[i]).disabled = false;
     }

    function tmStop() {
      flTMDoStop = true;
     }

    function tmSetAlphabet() {
      tmClearErrors();
      var alphabet = {};
      alphabet['B'] = 'B';
      var ids = (chkDigitIds + " " + chkAlphaIds + " " + chkSymbolIds).split(" ");
      var smbs = (smbDigit + smbAlpha + smbSymbol);
      for(var i = 0; i < ids.length; i++)
        if(document.getElementById("symbol" + ids[i]).checked)
          alphabet[smbs.charAt(i)] = smbs.charAt(i);
      for(var i = 0; i < nExtraSymbolNumber; i++) {
        var smb = document.getElementById("extraSymbol" + i).value;
        if(!smb)
          continue;
        if(smb in alphabet)
          return tmCompileError("Неможливо включити символ '" + smb +
                                "' в алфавіт два рази");
        if(smb.length != 1)
          return tmCompileError("Неможливо включити в алфавіт " + smb.length + "-буквене слово '" + smb + "'");
        alphabet[smb] = smb;
       }
      setTMAlphabet = alphabet;
      return true;
     }

    function tmSetStates() {
      tmClearErrors();
      var states = {};
      states['STOP'] = 'STOP';
      var ids = chkStateIds.split(" ");
      for(var i = 0; i < ids.length; i++)
        if(document.getElementById("state" + ids[i]).checked)
          states[stState[i]] = stState[i];
      for(var i = 0; i < nExtraStateNumber; i++) {
        var st = document.getElementById("extraState" + i).value;
        if(!st)
          continue;
        if(st in states)
          return tmCompileError("Неможливо включити стан '" + st +
                                "' в множину станів машини Тьюрінга два рази");
        // if(!st.match(/^[a-zA-Z0-9][a-zA-GI-KM-QS-Z0-9\_\^\*]*$/))
        if(!st.match(/^[a-zA-Z0-9][^\s\-\>]*$/))
          return tmCompileError("Некорректне ім'я для стану: '" + st + "'");
        states[st] = st;
       }
      setTMStates = states;
      return true;
     }

    function tmAddStateInput(trParent, tdBefore) {
      var td = document.createElement("td");
      var input = document.createElement("input");
      input.setAttribute("type", "text");
      input.setAttribute("id", "extraState" + nExtraStateNumber++);
      input.setAttribute("class", "extraState");
      td.appendChild(input);
      if(tdBefore)
        td = trParent.insertBefore(td, tdBefore);
      else
        td = trParent.appendChild(td);
      td.firstChild.className = "extraState";
      return td;
     }

    function tmMoreStates() {
      var tdMoreStates = document.getElementById("tdMoreStates");
      var parent = tdMoreStates.parentNode;
      var percentWidth = tdMoreStates.width;
      for(var td = parent.firstChild; td != tdMoreStates; td = td.nextSibling)
        if(td.nodeName.toLowerCase() == "td")
          td.setAttribute("width", percentWidth);
      tdMoreStates.setAttribute("width", percentWidth);
      var tdStateInput = tmAddStateInput(parent, tdMoreStates);
      tdStateInput.setAttribute("width", percentWidth + "%");
      for(var tr = parent.nextSibling; tr; tr = tr.nextSibling)
        if(tr.nodeName.toLowerCase() == "tr")
          var td = tmAddStateInput(tr);
     }

    function tmShowNextCommand() {
      tmClearNextCommand();
      var prefix = "" + tmGetCellValue(idxTMCurrentCell) + strTMCurrentState;
      if(!setTMProgram || !(prefix in setTMProgram))
        return;
      var cmd = setTMProgram[prefix];
      var txt = prefix + "->" + cmd.smbTo + cmd.stTo + cmd.mvTo;
      var tn = document.createTextNode(txt);
      ctlNextCommand.appendChild(tn);
      
     }

    function tmClearNextCommand() {
      while(ctlNextCommand.childNodes.length)
        ctlNextCommand.removeChild(ctlNextCommand.lastChild);
     }

    function btnShowNextCommand_click() {
      tmClearNextCommand();
      var text = ctlProgram.value;
      if(!(tmSetAlphabet() && tmSetStates()))
        return;
      if(!tmSetState(strTMCurrentState))
        return;
      if(tmCompile(text))
        tmShowNextCommand();
     }

    function btnStep_click() {
      tmClearNextCommand();
      var text = ctlProgram.value;
      if(!(tmSetAlphabet() && tmSetStates()))
        return;
      if(!tmSetState(strTMCurrentState))
        return;
      if(tmCompile(text) && tmStep())
        tmShowNextCommand();
     }

    function btnStart_click() {
      tmClearNextCommand();
      var text = ctlProgram.value;
      if(!(tmSetAlphabet() && tmSetStates()))
        return;
      if(!tmSetState(strTMCurrentState))
        return;
      if(tmCompile(text))
        tmStart();
     }

    function btnStop_click() {
      tmStop();
     }

    function btnSetConfig_click() {
      tmClearNextCommand();
      var strConfig = ctlConfig.value;
      
      if(tmSetAlphabet() && tmSetConfig(strConfig))
        tmShowNextCommand();
     }

    function btnSetState_click() {
      tmClearNextCommand();
      var strState = ctlNewState.value;
      if(tmSetStates() && tmSetState(strState))
        tmShowNextCommand();
     }

    function ctlTape_click(n) {
      if(flTMDoStop) {
        tmFocusCell(n);
        tmShowNextCommand();
       }
     }

    function chkAllDigit_click(checked) {
      var ids = chkDigitIds.split(" ");
      for(var i = 0; i < ids.length; i++)
        document.getElementById("symbol" + ids[i]).checked = checked;
     }

    function chkAllAlpha_click(checked) {
      var ids = chkAlphaIds.split(" ");
      for(var i = 0; i < ids.length; i++)
        document.getElementById("symbol" + ids[i]).checked = checked;
     }

    function chkAllSymbol_click(checked) {
      var ids = chkSymbolIds.split(" ");
      for(var i = 0; i < ids.length; i++)
        document.getElementById("symbol" + ids[i]).checked = checked;
     }


    let close_manual_button = document.getElementById("close-manual");
    close_manual_button.addEventListener('click', closeManual);
    function closeManual(){
        let block = document.querySelector("#manual-block");
        block.classList.remove('show');
        setTimeout(()=> block.style.display = 'none', 300);
     }

    let open_manual_button = document.getElementById("open-manual");
    open_manual_button.addEventListener('click', openManual);
    function openManual(){
      let block = document.querySelector("#manual-block");
      block.style.display = 'flex';
      setTimeout(()=> block.classList.add('show'), 1) ;
    }

    let toggle_specification = document.getElementById("header-specification");

    toggle_specification.addEventListener('click', toggleSpecification);

    function toggleSpecification(e){
      let specification_block   = document.querySelector(".specification");
          specification_block.classList.toggle('open');
    }


    let start_save_button = document.getElementById('start-save');
    start_save_button.addEventListener('click', openSaveForm);
    function openSaveForm(){
      let block = document.querySelector("#file-save-block");
      block.style.display = 'flex';
      setTimeout(()=> block.classList.add('show'), 1) ;
    }

    

    let close_save_form_button = document.getElementById('close-save-form');
    close_save_form_button.addEventListener('click', closeSaveForm);

    function closeSaveForm(){
      let block = document.querySelector("#file-save-block");
      block.classList.remove('show');
      setTimeout(()=> block.style.display = 'none', 300);
    }




    function formatToSave(){
   
      if(tmSetAlphabet() === true && tmSetStates() === true){
        let saving_data =  {
          'config': ctlConfig.value,
          'newState': ctlNewState.value,
          'program': ctlProgram.value,
          'states': setTMStates,
          'alphavite': setTMAlphabet,
        };

        return JSON.stringify(saving_data);
      }
      
      return false;

    }
    function getFileNameToSave(){
      let input_file_name = document.getElementById("name-saving-file"),
          value = input_file_name.value
          filename = value.replace(" ", "").length > 0 ? value : 'untitled';
      filename = filename.replace(".tm", "")+".tm";
      return filename;
    }
    function saveFile(){
      let element = document.createElement('a'),
          tm_date = formatToSave(),
          filename = getFileNameToSave();
      if(tm_date){
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(tm_date));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);   
        closeSaveForm();  
        document.getElementById("name-saving-file").value = '';
      }
                                                
    }

    let save_file_button = document.getElementById('save-file');

    save_file_button.addEventListener('click', saveFile);

    example_data_button = document.getElementById('example-data-load');
    example_data_button.addEventListener('click', loadExample);

    function loadExample(){
      let example_data = {
        config: '10111',
        newState:'q1',
        program: "// Додавання одиниці\n// до двійково числа\n\t1q1->1q1R\n\t0q1->0q1R\n\tBq1->Bq2L\n\t1q2->0q2L\n\t0q2->1q3L\n\tBq2->1STOP\n\t0q3->0q3L\n\t1q3->1q3L\n\tBq3->BSTOPR\n",
        states:{"STOP":"STOP","q1":"q1","q2":"q2","q3":"q3"},
        alphavite:{"0":"0","1":"1","B":"B"}
      };

        loadSaveData(example_data);
    }
    function loadLocalStorageSave(){
      try {
        let config = storage.getItem('config'),
          newState = storage.getItem('newState'),
          program  = storage.getItem('program'),
          states   = storage.getItem('states'),
          alphavite = storage.getItem('alphavite');
          if(config && newState && program && states && alphavite){
            let storage_data = {
              'config': JSON.parse(config),
              'newState': JSON.parse(newState),
              'program': JSON.parse(program),
              'states': JSON.parse(states),
              'alphavite': JSON.parse(alphavite)
            };

            loadSaveData(storage_data);
          }
          else{
            loadExample();
          }
        
      } catch (error) {
        tmCompileError("Помилка завантаження");
      }
      
      
    }
    function localStorageSave(){
      let saved_data = formatToSave();
      saved_data = JSON.parse(saved_data);
      for(field in saved_data){
        
        storage.setItem(field, JSON.stringify(saved_data[field]));
      }
    }

    let erase_data_button = document.getElementById('erase-data');

    erase_data_button.addEventListener('click', eraseProgramData);

    function eraseProgramData(){
      let program_input        = document.querySelectorAll(".program-container input"),
          program              = document.getElementById('program'),
          output_field         = document.querySelectorAll(".output-field");
      output_field.forEach(element=>{
        element.innerText =  "";
      });
      program.value = "";
      program_input.forEach(element=>{
        if(element.type == "checkbox"){
          if(!element.disabled)
            element.checked = false;
        }
        else{
          element.value = "";
        }
      });
      btnSetConfig_click();
      btnSetState_click();
      tmSetAlphabet();
      tmSetStates();
    }

    function loadSaveData(app_data){
      let states               = app_data.states,
          alphavite            = app_data.alphavite,
          config               = app_data.config,
          state                = app_data.newState,
          program              = app_data.program,
          name_state           = "state",
          extra_state          = "extraState",
          extra_state_counter  = 0,
          name_symbol          = "symbol",
          extra_symbol         = "extraSymbol",
          extra_symbol_counter = 0,
          symbolToName         =  {
            '<': 'Less',
            '>': 'Greater',
            '=': 'Equal',
            '+': 'Plus',
            '-': 'Minus',
            '*': 'Star',
            '/': 'Slash',
            '^': 'Hat',
            '%': 'Percent'
          };
      if(states && alphavite && (config || typeof(config) == 'string') && (state || typeof(state) == 'string') && (program || typeof(program) == 'string')){
        eraseProgramData();

        ctlConfig.value = config;
        ctlNewState.value = state;
        ctlProgram.value = program;

        for(state in states){ 
          if(state != "STOP"){
          
            let state_element = document.getElementById(name_state+state.toUpperCase());
            if(state_element){
              state_element.checked = true;
            }
            else{
              let extra_state_element = document.getElementById(extra_state+(extra_state_counter++));
              if(!extra_state_element){
                tmMoreStates();
                extra_state_element = document.getElementById(extra_state+(extra_state_counter-1));
              }
              if(extra_state_element){
                extra_state_element.value = states[state];
              }
              

            }
            
          }   
        }

        for(symbol in alphavite){
          if(symbol != 'B'){
            let current_symbol = symbol.toUpperCase();
            if(symbolToName[symbol])
              current_symbol = symbolToName[symbol];
            let current_symbol_element = document.getElementById(name_symbol+current_symbol);
            if(current_symbol_element){
              current_symbol_element.checked = true;
            }
            else{
              let extra_symbol_element = document.getElementById(extra_symbol+(extra_symbol_counter++));
              extra_symbol_element.value = alphavite[symbol];
            }

          }
          
        }
        tmClearNextCommand();
        btnSetConfig_click();
        btnSetState_click();
        tmSetAlphabet();
        tmSetStates();
      }
      else
        throw 1;
      


    }

    let load_file_button = document.getElementById('load-file');

    load_file_button.addEventListener('change', loadFile);  

    function loadFile(e){
      try {
        var file = e.target.files.item(0);
        var reader = new FileReader();
        var file_data;
        reader.onload = function() {
          file_data = reader.result;
          try {
            loadSaveData(JSON.parse(file_data));
          } catch (error) {
            tmCompileError("Помилка завантаження файлу");
          }
          
        }
        
        if(file)
          reader.readAsText(file);
      } catch (error) {
        tmCompileError("Помилка завантаження файлу");
      }
      
      
    }
    window.addEventListener("load", (event) => {
      init();
    });
    
    btnSetConfig.addEventListener('click', (event) => {
      btnSetConfig_click();
    });
    tmMoreStatesButton.addEventListener('click', (event) => {
      tmMoreStates();
    });

    btnShowNextCommand.addEventListener('click', (event) => {
      btnShowNextCommand_click();
    });

    btnStep.addEventListener('click', (event) => {
      btnStep_click();
    });

    btnStart.addEventListener('click', (event) => {
      btnStart_click();
    });

    btnStop.addEventListener('click', (event) => {
      btnStop_click();
    });

    btnSetState.addEventListener('click', (event) => {
      btnSetState_click();
    });


    window.addEventListener('beforeunload', (event) => {
      localStorageSave();
    });




    function showMessage(message){
      let message_container = document.querySelector(".message-container"),
          message_block     = document.getElementById("message");
      message_block.innerText = message;
      message_container.classList.add('show');
      setTimeout(()=>message_container.classList.remove('show'), 2000);
    }

    
  