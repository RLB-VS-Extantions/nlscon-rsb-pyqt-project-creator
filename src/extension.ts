import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('NLScon-RSB PyQT Project Creator активирован');
    
    // Регистрация команды создания проекта
    let disposable = vscode.commands.registerCommand(
        'nlscon-rsb-pyqt-project-creator.createProject', 
        () => createProject(context)
    );

    context.subscriptions.push(disposable);
}

async function createProject(context: vscode.ExtensionContext) {
    try {
        // Проверяем наличие рабочей папки
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            const openFolder = await vscode.window.showWarningMessage(
                'Откройте рабочую папку перед созданием проекта',
                'Открыть папку'
            );
            
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
            const overwrite = await vscode.window.showWarningMessage(
                `Проект с именем "${projectName}" уже существует. Перезаписать?`,
                'Да', 'Нет'
            );
            
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
                } catch (e) {
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

        // Создаем промис для создания проекта
        const createProjectPromise = new Promise<void>((resolve, reject) => {
            vscode.window.withProgress({
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
                    // Используем фоновую проверку без блокировки
                    setTimeout(() => {
                        checkDependenciesInBackground(projectPath);
                    }, 100);
                    
                    progress.report({ message: 'Готово!', increment: 10 });
                    
                    // Сохраняем информацию о проекте
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

        // Ждем завершения создания проекта
        await createProjectPromise;

        // Открываем новый проект
        const openProject = await vscode.window.showInformationMessage(
            `Проект ${projectName} успешно создан на основе шаблона "${selectedTemplate}"!`,
            'Открыть проект', 'Просмотреть структуру'
        );
        
        if (openProject === 'Открыть проект') {
            await vscode.commands.executeCommand(
                'vscode.openFolder', 
                vscode.Uri.file(projectPath), 
                { forceNewWindow: false }
            );
        } else if (openProject === 'Просмотреть структуру') {
            vscode.commands.executeCommand(
                'revealInExplorer', 
                vscode.Uri.file(projectPath)
            );
        }
    } catch (error) {
        vscode.window.showErrorMessage(
            error instanceof Error ? error.message : 'Неизвестная ошибка при создании проекта'
        );
        console.error('Ошибка создания проекта:', error);
    }
}

function validateProjectName(name: string): string | null {
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

function createProjectStructure(projectPath: string): void {
    // Создаем основные директории
    const directories = [
        projectPath,
        path.join(projectPath, 'ui'),
        path.join(projectPath, '.vscode')
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

async function copyTemplateFiles(
    context: vscode.ExtensionContext, 
    projectPath: string, 
    projectName: string,
    templateName: string
): Promise<void> {
    // Путь к выбранному шаблону
    const templatePath = path.join(context.extensionPath, 'templates', templateName);
    
    // Рекурсивно копируем файлы шаблона
    await copyDirectory(templatePath, projectPath, projectName);
}

/**
 * Рекурсивно копирует директорию, заменяя плейсхолдеры в содержимом файлов
 */
async function copyDirectory(src: string, dest: string, projectName: string): Promise<void> {
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
        } else {
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

/**
 * Фоновая проверка зависимостей без блокировки основного процессаа
 */
function checkDependenciesInBackground(projectPath: string): void {
    // Проверяем установку PyQt5 через терминал
    const terminal = vscode.window.createTerminal(`Проверка зависимостей для ${path.basename(projectPath)}`);
    terminal.show();
    
    terminal.sendText('echo "Проверка установки PyQt5..."');
    terminal.sendText('python3 -c "import PyQt5; print(\'PyQt5 установлен\')" || echo "PyQt5 не установлен. Рекомендуется выполнить: sudo apt-get install python3-pyqt5"');
}

export function deactivate() {
    // Здесь можно добавить код для деактивации расширения при необходимости
}