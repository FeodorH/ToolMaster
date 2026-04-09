<?php
// backend/UserService.php

class UserService {
    private string $dataFile;

    public function __construct() {
        $this->dataFile = __DIR__ . '/data/users.json';
        $this->initStorage();
    }

    /**
     * Инициализация хранилища
     */
    private function initStorage(): void {
        $dir = dirname($this->dataFile);
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        if (!file_exists($this->dataFile)) {
            file_put_contents($this->dataFile, json_encode([
                'users' => [],
                'next_id' => 1
            ], JSON_PRETTY_PRINT));
        }
    }

    /**
     * Чтение данных
     */
    private function readData(): array {
        $content = file_get_contents($this->dataFile);
        return json_decode($content, true) ?? ['users' => [], 'next_id' => 1];
    }

    /**
     * Сохранение данных
     */
    private function saveData(array $data): void {
        file_put_contents($this->dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    /**
     * Валидация данных
     */
    public function validate(array $data, bool $isUpdate = false): array {
        $errors = [];

        $fields = ['name', 'phone', 'email', 'message'];

        foreach ($fields as $field) {
            if ($isUpdate && !isset($data[$field])) {
                continue;
            }

            $value = trim($data[$field] ?? '');

            // Обязательные поля (кроме message)
            if (in_array($field, ['name', 'phone', 'email']) && empty($value)) {
                $errors[$field] = 'Поле обязательно для заполнения';
                continue;
            }

            // Проверка имени
            if ($field === 'name' && strlen($value) < 2) {
                $errors[$field] = 'Имя должно содержать минимум 2 символа';
            }

            // Проверка телефона
            if ($field === 'phone' && !empty($value)) {
                $cleanPhone = preg_replace('/\D/', '', $value);
                if (strlen($cleanPhone) < 10) {
                    $errors[$field] = 'Телефон должен содержать минимум 10 цифр';
                }
            }

            // Проверка email
            if ($field === 'email' && !empty($value)) {
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field] = 'Некорректный email';
                }
            }
        }

        return $errors;
    }

    /**
     * Создание пользователя
     */
    public function create(array $data): array {
        $storage = $this->readData();

        $newId = $storage['next_id']++;

        // Генерируем логин и пароль
        $login = 'user' . $newId . '_' . substr(md5($data['email'] . time()), 0, 5);
        $password = bin2hex(random_bytes(4)); // 8 символов

        $newUser = [
            'id' => $newId,
            'login' => $login,
            'password' => $password,
            'name' => $data['name'] ?? '',
            'phone' => $data['phone'] ?? '',
            'email' => $data['email'] ?? '',
            'message' => $data['message'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => null
        ];

        $storage['users'][] = $newUser;
        $this->saveData($storage);

        // Авторизуем пользователя
        $this->authorize($newId);

        return $newUser;
    }

    /**
     * Обновление пользователя
     */
    public function update(int $id, array $data): bool {
        $storage = $this->readData();

        foreach ($storage['users'] as &$user) {
            if ($user['id'] === $id) {
                $allowedFields = ['name', 'phone', 'email', 'message'];
                foreach ($allowedFields as $field) {
                    if (isset($data[$field])) {
                        $user[$field] = $data[$field];
                    }
                }
                $user['updated_at'] = date('Y-m-d H:i:s');
                $this->saveData($storage);
                return true;
            }
        }

        return false;
    }

    /**
     * Поиск пользователя
     */
    public function find(int $id): ?array {
        $storage = $this->readData();

        foreach ($storage['users'] as $user) {
            if ($user['id'] === $id) {
                return $user;
            }
        }

        return null;
    }

    /**
     * Авторизация (установка куки)
     */
    private function authorize(int $userId): void {
        setcookie('user_id', $userId, time() + 60 * 60 * 24 * 30, '/');
    }
}