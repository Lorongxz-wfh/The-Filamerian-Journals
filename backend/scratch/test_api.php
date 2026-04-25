<?php

// Simple script to test the API endpoints
// Run with: php scratch/test_api.php

$baseUrl = 'http://127.0.0.1:8000/api';

function call($method, $path, $data = [], $token = null) {
    global $baseUrl;
    $url = $baseUrl . $path;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['status' => $status, 'data' => json_decode($response, true)];
}

echo "1. Testing Login...\n";
$login = call('POST', '/login', [
    'email' => 'admin@filamerian.com',
    'password' => 'password'
]);

if ($login['status'] === 200) {
    $token = $login['data']['access_token'];
    echo "   SUCCESS: Logged in as Admin. Token: " . substr($token, 0, 10) . "...\n";
} else {
    echo "   FAILED: Login failed. Status: " . $login['status'] . "\n";
    print_r($login['data']);
    exit(1);
}

echo "\n2. Testing /me endpoint...\n";
$me = call('GET', '/me', [], $token);
echo "   Status: " . $me['status'] . "\n";
echo "   User: " . $me['data']['name'] . " (Role: " . $me['data']['roles'][0]['name'] . ")\n";

echo "\n3. Testing Journal Creation...\n";
$journal = call('POST', '/journals', [
    'title' => 'Filamerian Journal of Science',
    'description' => 'A scientific journal from Filamer Christian University.'
], $token);
echo "   Status: " . $journal['status'] . "\n";
if ($journal['status'] === 201) {
    echo "   SUCCESS: Journal Created. ID: " . $journal['data']['data']['id'] . "\n";
    $journalId = $journal['data']['data']['id'];
}

echo "\n4. Testing Public Journals Listing...\n";
$publicJournals = call('GET', '/public/journals');
echo "   Status: " . $publicJournals['status'] . "\n";
echo "   Count: " . count($publicJournals['data']['data']) . "\n";

echo "\n5. Testing Logout...\n";
$logout = call('POST', '/logout', [], $token);
echo "   Status: " . $logout['status'] . "\n";
echo "   Message: " . $logout['data']['message'] . "\n";

echo "\nAPI verification complete!\n";
