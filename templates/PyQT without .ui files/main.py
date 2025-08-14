import sys
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel

class SimpleApp(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()
        
    def initUI(self):
        # Настройка окна
        self.setWindowTitle('Тестовое приложение PyQt')
        self.setGeometry(300, 300, 300, 200)  # x, y, width, height
        
        # Создание виджетов
        self.label = QLabel('Нажмите кнопку!', self)
        self.button = QPushButton('Кликни меня', self)
        
        # Подключение сигнала кнопки
        self.button.clicked.connect(self.update_label)
        
        # Вертикальное расположение виджетов
        layout = QVBoxLayout()
        layout.addWidget(self.label)
        layout.addWidget(self.button)
        
        self.setLayout(layout)
    
    def update_label(self):
        self.label.setText('Кнопка нажата!')

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = SimpleApp()
    ex.show()
    sys.exit(app.exec_())