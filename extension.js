const vscode = require('vscode');

function activate(context) {
  let currentPanel = null;

  console.log('activate  my markdown!!!!!!!!!!')
  console.log('activate  my markdown!!!!!!!!!!')
  console.log('activate  my markdown!!!!!!!!!!')
  console.log('activate  my markdown!!!!!!!!!!')
  
  const openPreview = (editor) => {
    if (!editor || editor.document.languageId !== 'markdown') {
      return;
    }

    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Beside);
      updateWebview(editor);
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      'markdownPreview',
      'Markdown Preview (Editable)',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true
      }
    );

    const updateWebview = (editor) => {
      const text = editor.document.getText();
      currentPanel.webview.html = getWebviewContent(text);
    };

    updateWebview(editor);

    const changeDocSub = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === editor.document) {
        updateWebview(editor);
      }
    });

    currentPanel.webview.onDidReceiveMessage(message => {
      if (message.command === 'updateText') {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          editor.document.positionAt(0),
          editor.document.positionAt(editor.document.getText().length)
        );
        edit.replace(editor.document.uri, fullRange, message.text);
        vscode.workspace.applyEdit(edit);
      }
    });

    currentPanel.onDidDispose(() => {
      changeDocSub.dispose();
      currentPanel = null;
    });
  };

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && editor.document.languageId === 'markdown') {
      openPreview(editor);
    }
  });

  vscode.workspace.onDidOpenTextDocument(doc => {
    if (doc.languageId === 'markdown') {
      const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
      if (editor) {
        openPreview(editor);
      }
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('markdownViewer.openPreview', () => {
      openPreview(vscode.window.activeTextEditor);
    })
  );
}

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}

function getWebviewContent(markdown) {
  const escaped = escapeHtml(markdown);
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      html, body { height: 100%; margin: 0; }
      textarea {
        width: 100%; height: 100%;
        font-family: monospace;
        font-size: 1rem;
        padding: 1rem;
        border: none;
        box-sizing: border-box;
        resize: none;
        outline: none;
      }
    </style>
  </head>
  <body>
    <textarea id="editor">${escaped}</textarea>
    <script>
      const vscode = acquireVsCodeApi();
      const editor = document.getElementById("editor");
      editor.focus();
      editor.addEventListener("input", () => {
        vscode.postMessage({
          command: "updateText",
          text: editor.value
        });
      });
    </script>
  </body>
  </html>`;
}

exports.activate = activate;
exports.deactivate = () => {};
