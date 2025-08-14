"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    console.log('NLScon-RSB PyQT Project Creator активирован');
    // Регистрация команды создания проекта
    let disposable = vscode.commands.registerCommand('nlscon-rsb-pyqt-project-creator.createProject', () => createProject(context));
    context.subscriptions.push(disposable);
}
async function createProject(context) {
    try {
        // Проверяем наличие рабочей папкиа
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const openFolder = await vscode.window.showWarningMessage('Откройте рабочую папку перед созданием проекта', 'Открыть папку');
            if (openFolder === 'Открыть папку') {
                await vscode.commands.executeCommand('vscode.openFolder');
                return;
            }
            return;
        }
        // Запрашиваем имя проекта
        const projectName = await vscode.window.showInputBox({
            prompt: 'Введите имя проекта',
            placeHolder: 'my_nlscon_project',
            validateInput: validateProjectName
        });
        if (!projectName) {
            return; // Пользователь отменил операцию
        }
        // Определяем путь к проекту
        const projectPath = path.join(workspaceFolders[0].uri.fsPath, projectName);
        // Проверяем, существует ли уже проект с таким именем
        if (fs.existsSync(projectPath)) {
            const overwrite = await vscode.window.showWarningMessage(`Проект с именем "${projectName}" уже существует. Перезаписать?`, 'Да', 'Нет');
            if (overwrite !== 'Да') {
                return;
            }
            // Удаляем существующий проект
            fs.rmSync(projectPath, { recursive: true, force: true });
        }
        // Получаем список шаблонов
        const templatesDir = path.join(context.extensionPath, 'templates');
        if (!fs.existsSync(templatesDir)) {
            vscode.window.showErrorMessage('Папка templates не найдена в расширении');
            return;
        }
        // Собираем список шаблонов (только директории)
        const templateFolders = fs.readdirSync(templatesDir)
            .filter(file => {
            try {
                return fs.statSync(path.join(templatesDir, file)).isDirectory();
            }
            catch (e) {
                return false;
            }
        });
        if (templateFolders.length === 0) {
            vscode.window.showErrorMessage('Не найдено ни одного шаблона в папке templates');
            return;
        }
        // Показываем выбор шаблона
        const selectedTemplate = await vscode.window.showQuickPick(templateFolders, {
            placeHolder: 'Выберите шаблон проекта',
            canPickMany: false
        });
        if (!selectedTemplate) {
            return; // Пользователь отменил выбор
        }
        // Показываем прогресс
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Создание проекта ${projectName}...`,
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ message: 'Создание структуры папок', increment: 20 });
                createProjectStructure(projectPath);
                progress.report({ message: `Копирование шаблона "${selectedTemplate}"`, increment: 40 });
                await copyTemplateFiles(context, projectPath, projectName, selectedTemplate);
                progress.report({ message: 'Проверка зависимостей', increment: 20 });
                await checkDependencies();
                // Открываем новый проект
                const openProject = await vscode.window.showInformationMessage(`Проект ${projectName} успешно создан на основе шаблона "${selectedTemplate}"!`, 'Открыть проект', 'Просмотреть структуру');
                if (openProject === 'Открыть проект') {
                    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath), { forceNewWindow: false });
                }
                else if (openProject === 'Просмотреть структуру') {
                    vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(projectPath));
                }
            }
            catch (error) {
                throw new Error(`Ошибка при создании проекта: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(error instanceof Error ? error.message : 'Неизвестная ошибка при создании проекта');
        console.error('Ошибка создания проекта:', error);
    }
}
function validateProjectName(name) {
    if (!name) {
        return 'Имя проекта не может быть пустым';
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(name)) {
        return 'Имя проекта может содержать только буквы, цифры, дефис и подчеркивание';
    }
    if (name.length < 3) {
        return 'Имя проекта должно быть не короче 3 символов';
    }
    return null;
}
function createProjectStructure(projectPath) {
    // Создаем основные директории
    const directories = [
        projectPath,
        path.join(projectPath, 'ui'),
        path.join(projectPath, 'resources'),
        path.join(projectPath, '.vscode')
    ];
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}
async function copyTemplateFiles(context, projectPath, projectName, templateName) {
    // Путь к выбранному шаблону
    const templatePath = path.join(context.extensionPath, 'templates', templateName);
    // Рекурсивно копируем файлы шаблона
    await copyDirectory(templatePath, projectPath, projectName);
}
/**
 * Рекурсивно копирует директорию, заменяя плейсхолдеры в содержимом файлов
 */
async function copyDirectory(src, dest, projectName) {
    // Создаем целевую директорию, если не существует
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    // Получаем список содержимого
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            // Рекурсивно копируем поддиректории
            await copyDirectory(srcPath, destPath, projectName);
        }
        else {
            // Копируем файлы
            let content = fs.readFileSync(srcPath, 'utf-8');
            // Заменяем плейсхолдеры
            content = content
                .replace(/\$\{projectName\}/g, projectName)
                .replace(/%PROJECT_NAME%/g, projectName);
            // Записываем обработанное содержимое
            fs.writeFileSync(destPath, content);
            // Делаем run.sh исполняемым
            if (entry.name === 'run.sh') {
                fs.chmodSync(destPath, '755');
            }
        }
    }
}
async function checkDependencies() {
    try {
        // Проверяем установку PyQt5
        try {
            require('PyQt5');
            return; // Если импорт успешен, выходим
        }
        catch (e) {
            // PyQt5 не установлен
        }
        const install = await vscode.window.showWarningMessage('PyQt5 не установлен. Установить?', 'Да', 'Нет');
        if (install === 'Да') {
            const terminal = vscode.window.createTerminal('Install PyQt5');
            terminal.sendText('sudo apt-get update && sudo apt-get install -y python3-pyqt5');
            terminal.show();
        }
    }
    catch (error) {
        console.log('Не удалось проверить зависимости:', error);
    }
}
function deactivate() {
    // Здесь можно добавить код для деактивации расширения при необходимости
}
//# sourceMappingURL=extension.js.map