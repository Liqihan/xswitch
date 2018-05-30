require.config({ paths: { vs: 'lib/monaco-editor/min/vs' } });
let editors = [];
let config_setting = [];
chrome.storage.sync.get('config_for_shown', result => {
  console.log(result);
  window.require(['vs/editor/editor.main'], () => {
    console.log(typeof result.config_for_shown);
    if (typeof result.config_for_shown === 'string') {
      result.config_for_shown = [{
        value: result.config_for_shown,
        disabled: ''
      }];
    }
    if (typeof result.config_for_shown === 'undefined') {
      result.config_for_shown = [{
        value: window.DEFAULT_DATA,
        disabled: ''
      }];
    }
    config_setting = result.config_for_shown;
    editors = result.config_for_shown.map(function(config, index) {
      createItem(index);
      document.getElementById('J_SwitchArea' + index).style.opacity = 1;
      if (config.disabled === 'disabled') {
        turnOff(index);
      } else {
        turnOn(index);
      }
      return window.monaco.editor.create(
        document.getElementById('container' + index),
        {
          value: config.value,
          language: 'json',
  
          minimap: {
            enabled: false
          },
          fontFamily: 'Fira Code, monospace',
          fontSize: 13,
          fontLigatures: true,
  
          contextmenu: false,
          scrollBeyondLastLine: false,
          folding: true,
          showFoldingControls: 'always',
  
          useTabStops: true,
          wordBasedSuggestions: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true
        }
      );
    })


    setStorage();

    window.monaco.languages.registerCompletionItemProvider('json', {
      provideCompletionItems: () => {
        const textArr = [];
        chrome.extension.getBackgroundPage().urls.forEach(item => {
          if (item) {
            textArr.push({
              label: item,
              kind: window.monaco.languages.CompletionItemKind.Text
            });
          }
        });

        const extraItems = [
          {
            label: 'rule',
            kind: window.monaco.languages.CompletionItemKind.Method,
            insertText: {
              value: `[
  "\${1:from}",
  "\${1:to}"
]\${0}`
            }
          }
        ];
        return [...textArr, ...extraItems];
      }
    });
    editors.forEach(function(editor) {
      editor.onDidChangeModelContent(() => {
        setStorage();
      });
    })
  });
});
function setStorage() {
  const datas = config_setting.map(function(config, index) {
      return {
        value: editors[index].getValue(),
        disabled: config.disabled
      }
  }) 
  // const datas = editors.map(function (editor) {
  //     return editor.getValue();
  // })
  let configs = datas.reduce(function(result, data) {
    var newConfig = window
    .stripJsonComments(data.value)
    .replace(/\s+/g, '')
    .replace(window.cleanJSONReg, ($0, $1, $2) => $2);
    newConfig = JSON.parse(newConfig).proxy;
    result = result.concat(newConfig);
    return result;
  }, []);
  configs = JSON.stringify({
    proxy: configs
  })
  try {
    console.log('=========data');
    console.log(datas);
    console.log('=========config');
    console.log(configs);
  } catch (e) {
    console.error(e);
  }
  chrome.storage.sync.set(
    {
      config_for_shown: datas,
      config: configs
    },
    () => {}
  );
}
function preventSave() {
  document.addEventListener(
    'keydown',
    e => {
      if (
        e.keyCode === 83 &&
        (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
      }
    },
    false
  );
}

function turnOn(index) {
  document.getElementById(`J_Switch${index}`).classList.add('ant-switch-checked');
  document.getElementById(`J_SwitchInner${index}`).innerHTML = 'On';
}

function turnOff(index) {
  document.getElementById(`J_Switch${index}`).classList.remove('ant-switch-checked');
  document.getElementById(`J_SwitchInner${index}`).innerHTML = 'Off';
}
function createItem(index) {
   var template = `
      <div id="J_SwitchArea${index}" class="switch-area" title="control">
        <span class="ant-switch" index="${index}" id="J_Switch${index}"><span class="ant-switch-inner" id="J_SwitchInner${index}">Off</span></span>
        <button>删除</button>
      </div>
      <div id="container${index}" class="container"></div>
    `
    var dom = document.createElement('div');
    dom.classList.add("J_SwitchContainer");
    dom.innerHTML = template;
    document.getElementById('J_SwitchList').appendChild(dom);
}


document.getElementById('J_SwitchList').addEventListener('click', ev => {
  var target = null;
  if (ev.target.classList.contains('ant-switch-inner')) {
    target = ev.target.parentNode;
  } else if (ev.target.classList.contains('ant-switch')) {
    target = ev.target;
  }
  if (!target) {
    return;
  }
  var index = target.getAttribute('index')
  if (target.classList.contains('ant-switch-checked')) {
    turnOff(index);
    config_setting[index].disabled = 'disabled';
  } else {
    turnOn(index);
    config_setting[index].disabled = '';
  }
  setStorage();
})
document.getElementById('J_OpenInNewTab').addEventListener('click', ev => {
  chrome.tabs.create({ url: chrome.extension.getURL('XSwitch.html') }, function(
    tab
  ) {
    // Tab opened.
  });
});
document.getElementById('J_AddNewTab').addEventListener('click', ev => {
  var length = config_setting.length;
  createItem(length);
  config_setting.push({
    value: window.DEFAULT_DATA,
    disabled: 'disabled'
  });
  editors.push(window.monaco.editor.create(
    document.getElementById('container' + length),
    {
      value: window.DEFAULT_DATA,
      language: 'json',

      minimap: {
        enabled: false
      },
      fontFamily: 'Fira Code, monospace',
      fontSize: 13,
      fontLigatures: true,

      contextmenu: false,
      scrollBeyondLastLine: false,
      folding: true,
      showFoldingControls: 'always',

      useTabStops: true,
      wordBasedSuggestions: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true
    }
  ));
  setStorage();
})
preventSave();
