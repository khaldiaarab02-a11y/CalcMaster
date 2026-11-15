<?php
// Optional Inactive InfinityFree PHP 8 Contact Form Template for CalcMaster
// NOTE: CalcMaster ships as a 100% static HTML/CSS/JS site with client-side validation only.
// Do NOT point contact.html to this file unless you configure your real domain email below
// and test PHP mail delivery on your live hosting account.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Basic honeypot trap for automated spam
if (!empty($_POST['website'])) {
    http_response_code(200);
    exit('OK');
}

$name = trim(strip_tags($_POST['name'] ?? ''));
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$topic = trim(strip_tags($_POST['topic'] ?? 'General Inquiry'));
$message = trim(strip_tags($_POST['message'] ?? ''));

if (strlen($name) < 2 || !$email || strlen($message) < 10) {
    http_response_code(400);
    exit('Invalid form fields.');
}

// Configure your own verified domain inbox before enabling server-side delivery
$recipientEmail = '';
if ($recipientEmail === '') {
    http_response_code(501);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'error' => 'Server-side email delivery is not configured on this static deployment.']);
    exit;
}

$subject = '[CalcMaster] ' . str_replace(["\r", "\n"], '', $topic);
$body = "Name: {$name}\nEmail: {$email}\n\nMessage:\n{$message}\n";
$headers = "From: CalcMaster <no-reply@localhost>\r\nReply-To: {$email}\r\n";
$sent = @mail($recipientEmail, $subject, $body, $headers);
header('Content-Type: application/json');
echo json_encode(['ok' => (bool)$sent]);
