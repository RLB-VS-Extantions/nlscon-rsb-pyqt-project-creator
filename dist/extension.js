"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
function activate(context) {
  console.log("NLScon-RSB PyQT Project Creator \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D");
  let disposable = vscode.commands.registerCommand(
    "nlscon-rsb-pyqt-project-creator.createProject",
    () => createProject(context)
  );
  context.subscriptions.push(disposable);
}
async function createProject(context) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      const openFolder = await vscode.window.showWarningMessage(
        "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0440\u0430\u0431\u043E\u0447\u0443\u044E \u043F\u0430\u043F\u043A\u0443 \u043F\u0435\u0440\u0435\u0434 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
        "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043F\u043A\u0443"
      );
      if (openFolder === "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043F\u043A\u0443") {
        await vscode.commands.executeCommand("vscode.openFolder");
        return;
      }
      return;
    }
    const projectName = await vscode.window.showInputBox({
      prompt: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
      placeHolder: "my_nlscon_project",
      validateInput: validateProjectName
    });
    if (!projectName) {
      return;
    }
    const projectPath = path.join(workspaceFolders[0].uri.fsPath, projectName);
    if (fs.existsSync(projectPath)) {
      const overwrite = await vscode.window.showWarningMessage(
        `\u041F\u0440\u043E\u0435\u043A\u0442 \u0441 \u0438\u043C\u0435\u043D\u0435\u043C "${projectName}" \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442. \u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C?`,
        "\u0414\u0430",
        "\u041D\u0435\u0442"
      );
      if (overwrite !== "\u0414\u0430") {
        return;
      }
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    const templatesDir = path.join(context.extensionPath, "templates");
    if (!fs.existsSync(templatesDir)) {
      vscode.window.showErrorMessage("\u041F\u0430\u043F\u043A\u0430 templates \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0432 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0438");
      return;
    }
    const templateFolders = fs.readdirSync(templatesDir).filter((file) => {
      try {
        return fs.statSync(path.join(templatesDir, file)).isDirectory();
      } catch (e) {
        return false;
      }
    });
    if (templateFolders.length === 0) {
      vscode.window.showErrorMessage("\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0432 \u043F\u0430\u043F\u043A\u0435 templates");
      return;
    }
    const selectedTemplate = await vscode.window.showQuickPick(templateFolders, {
      placeHolder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0448\u0430\u0431\u043B\u043E\u043D \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
      canPickMany: false
    });
    if (!selectedTemplate) {
      return;
    }
    const createProjectPromise = new Promise((resolve, reject) => {
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 ${projectName}...`,
        cancellable: false
      }, async (progress) => {
        try {
          progress.report({ message: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B \u043F\u0430\u043F\u043E\u043A", increment: 20 });
          createProjectStructure(projectPath);
          progress.report({ message: `\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 "${selectedTemplate}"`, increment: 40 });
          await copyTemplateFiles(context, projectPath, projectName, selectedTemplate);
          progress.report({ message: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0435\u0439", increment: 20 });
          setTimeout(() => {
            checkDependenciesInBackground(projectPath);
          }, 100);
          progress.report({ message: "\u0413\u043E\u0442\u043E\u0432\u043E!", increment: 10 });
          context.globalState.update(`lastCreatedProject:${projectName}`, {
            path: projectPath,
            template: selectedTemplate,
            timestamp: Date.now()
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
    await createProjectPromise;
    const openProject = await vscode.window.showInformationMessage(
      `\u041F\u0440\u043E\u0435\u043A\u0442 ${projectName} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 "${selectedTemplate}"!`,
      "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442",
      "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443"
    );
    if (openProject === "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442") {
      await vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(projectPath),
        { forceNewWindow: false }
      );
    } else if (openProject === "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443") {
      vscode.commands.executeCommand(
        "revealInExplorer",
        vscode.Uri.file(projectPath)
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      error instanceof Error ? error.message : "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
    );
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430:", error);
  }
}
function validateProjectName(name) {
  if (!name) {
    return "\u0418\u043C\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C";
  }
  if (!/^[a-zA-Z0-9_\-]+$/.test(name)) {
    return "\u0418\u043C\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u043C\u043E\u0436\u0435\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u043A\u0432\u044B, \u0446\u0438\u0444\u0440\u044B, \u0434\u0435\u0444\u0438\u0441 \u0438 \u043F\u043E\u0434\u0447\u0435\u0440\u043A\u0438\u0432\u0430\u043D\u0438\u0435";
  }
  if (name.length < 3) {
    return "\u0418\u043C\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043D\u0435 \u043A\u043E\u0440\u043E\u0447\u0435 3 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432";
  }
  return null;
}
function createProjectStructure(projectPath) {
  const directories = [
    projectPath,
    path.join(projectPath, "ui"),
    path.join(projectPath, ".vscode")
  ];
  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}
async function copyTemplateFiles(context, projectPath, projectName, templateName) {
  const templatePath = path.join(context.extensionPath, "templates", templateName);
  await copyDirectory(templatePath, projectPath, projectName);
}
async function copyDirectory(src, dest, projectName) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, projectName);
    } else {
      let content = fs.readFileSync(srcPath, "utf-8");
      content = content.replace(/\$\{projectName\}/g, projectName).replace(/%PROJECT_NAME%/g, projectName);
      fs.writeFileSync(destPath, content);
      if (entry.name === "run.sh") {
        fs.chmodSync(destPath, "755");
      }
    }
  }
}
function checkDependenciesInBackground(projectPath) {
  const terminal = vscode.window.createTerminal(`\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0435\u0439 \u0434\u043B\u044F ${path.basename(projectPath)}`);
  terminal.show();
  terminal.sendText('echo "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 PyQt5..."');
  terminal.sendText(`python3 -c "import PyQt5; print('PyQt5 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D')" || echo "PyQt5 \u043D\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D. \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C: sudo apt-get install python3-pyqt5"`);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
