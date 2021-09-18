<?php
    $serverName = "localhost";
    $username = "phpmyadmin";
    $password = "hackthenorth";
    $conn = new mysqli($serverName, $username, $password, 'hackthenorth');
    if ($conn->connect_error) {
        die("Error: DB connection failed due to ".$conn->connect_error);
    }
?>
