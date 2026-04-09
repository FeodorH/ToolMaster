<?php
// backend/helpers.php

/**
 * Получение входных данных
 */
function getInputData(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        parse_str(file_get_contents('php://input'), $putData);
        return $putData;
    }

    return $_POST;
}

/**
 * Отправка JSON ответа
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Проверка авторизации
 */
function isAuthorized(): bool {
    return isset($_COOKIE['user_id']) && is_numeric($_COOKIE['user_id']);
}

/**
 * Получение ID текущего пользователя
 */
function getCurrentUserId(): ?int {
    return isAuthorized() ? (int)$_COOKIE['user_id'] : null;
}