<?php
    require 'db.php';
    
    $roomID = $_GET["roomID"];
    $info = $_GET["info"];
    $timestamp = (new DateTime())->getTimestamp();

    // Insert info into message table
    $msgQuery = $conn->prepare("INSERT INTO room_infos(roomID, `timestamp`, `message`) VALUES(?, ?, ?)");
    $msgQuery->bind_param("iis", $roomID, $timestamp, $info);
    $msgQuery->execute();

    // Check if room already active
    $checkActiveQuery = $conn->prepare("SELECT roomID FROM active_rooms WHERE roomID = ?");
    $checkActiveQuery->bind_param("i", $roomID);
    $checkActiveQuery->execute();
    $result = $checkActiveQuery->get_result();

    if ($result->num_rows == 0) {
        // Create entry in active rooms table
        $activeQuery = $conn->prepare("INSERT INTO active_rooms(roomID) VALUES(?)");
        $activeQuery->bind_param("i", $roomID);
        $activeQuery->execute();
    }
?>
