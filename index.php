<?php
// index.php - Единая точка входа

file_put_contents(
    __DIR__ . '/debug.log',
    date('Y-m-d H:i:s') . ' | ' . $_SERVER['REQUEST_METHOD'] . ' | ' . $_SERVER['REQUEST_URI'] . "\n",
    FILE_APPEND
);

// Включаем отображение ошибок для отладки
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Подключаем необходимые файлы
require_once __DIR__ . '/backend/UserService.php';
require_once __DIR__ . '/backend/helpers.php';

// Определяем метод запроса
$method = $_SERVER['REQUEST_METHOD'];

// Получаем путь запроса
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/');

// Убираем базовый путь если сайт в подпапке
$basePath = ''; // Если сайт в корне, оставьте пустым
if ($basePath && strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Проверяем, является ли запрос AJAX
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
          strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

// Роутинг API запросов
if (strpos($path, '/api/users') === 0) {

    // Определяем ID пользователя из URL
    $userId = null;
    $parts = explode('/', $path);
    if (isset($parts[3]) && is_numeric($parts[3])) {
        $userId = (int)$parts[3];
    }

    $userService = new UserService();

    // Обработка запросов
    switch ($method) {
        case 'POST':
            // Регистрация нового пользователя
            $input = getInputData();

            // Проверяем, не авторизован ли уже
            if (isAuthorized()) {
                sendJsonResponse(['error' => 'Вы уже авторизованы'], 403);
                return;
            }

            // Валидация
            $errors = $userService->validate($input);
            if (!empty($errors)) {
                if (!$isAjax) {
                    // Для обычной формы - показываем ошибки на странице
                    $_SESSION['form_errors'] = $errors;
                    $_SESSION['form_data'] = $input;
                    header('Location: ' . $_SERVER['HTTP_REFERER']);
                    exit;
                }
                sendJsonResponse(['errors' => $errors], 400);
                return;
            }

            // Создаем пользователя
            $newUser = $userService->create($input);

            if (!$isAjax) {
                // Для обычной формы - редирект на страницу успеха
                header('Location: /success.html?login=' . urlencode($newUser['login']));
                exit;
            }

            // Для AJAX - возвращаем JSON
            sendJsonResponse([
                'success' => true,
                'id' => $newUser['id'],
                'login' => $newUser['login'],
                'password' => $newUser['password'],
                'profile_url' => '/profile.html?id=' . $newUser['id']
            ]);
            break;

        case 'PUT':
            // Обновление профиля
            if (!$userId) {
                sendJsonResponse(['error' => 'Требуется ID пользователя'], 400);
                return;
            }

            // Проверка авторизации
            if (!isAuthorized() || getCurrentUserId() !== $userId) {
                sendJsonResponse(['error' => 'Доступ запрещен'], 403);
                return;
            }

            $input = getInputData();

            // Валидация
            $errors = $userService->validate($input, true);
            if (!empty($errors)) {
                sendJsonResponse(['errors' => $errors], 400);
                return;
            }

            // Обновление
            $updated = $userService->update($userId, $input);

            if ($updated) {
                sendJsonResponse(['success' => true, 'message' => 'Профиль обновлен']);
            } else {
                sendJsonResponse(['error' => 'Пользователь не найден'], 404);
            }
            break;

        case 'GET':
            // Получение данных пользователя
            if (!$userId) {
                sendJsonResponse(['error' => 'Требуется ID пользователя'], 400);
                return;
            }

            $user = $userService->find($userId);

            if ($user) {
                // Не возвращаем пароль
                unset($user['password']);
                sendJsonResponse($user);
            } else {
                sendJsonResponse(['error' => 'Пользователь не найден'], 404);
            }
            break;

        default:
            sendJsonResponse(['error' => 'Метод не поддерживается'], 405);
    }
} else {
    // Для всех остальных запросов - отдаем статические файлы

    // Определяем MIME-тип
    $extension = pathinfo($path, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'mp4' => 'video/mp4',
    ];

    $filePath = __DIR__ . $path;

    if (is_file($filePath)) {
        $mime = $mimeTypes[$extension] ?? 'application/octet-stream';
        header('Content-Type: ' . $mime);
        readfile($filePath);
    } else {
        // Если файл не найден - отдаем index.html (для SPA)
        header('Content-Type: text/html; charset=utf-8');
        readfile(__DIR__ . '/index.html');
    }
}
