<?php
    require 'db.php';
    
    $roomID = $_GET["roomID"];

    for ($i = 0; $i < 30; $i++) {
        // Check if room is active
        $checkActiveQuery = $conn->prepare("SELECT roomID FROM active_rooms WHERE roomID = ?");
        $checkActiveQuery->bind_param("i", $roomID);
        $checkActiveQuery->execute();
        $result = $checkActiveQuery->get_result();

        if ($result->num_rows > 0) {
            // Make room inactive
            $inactiveQuery = $conn->prepare("DELETE FROM active_rooms WHERE roomID = ?");
            $inactiveQuery->bind_param("i", $roomID);
            $inactiveQuery->execute();

            // Fetch new infos
            $infoQuery = $conn->prepare("SELECT `message`, `timestamp` FROM room_infos WHERE roomID = ?");
            $infoQuery->bind_param("i", $roomID);
            $infoQuery->execute();
            $infoResult = $infoQuery->get_result();

            $result = [];
            $maxTs = 0;
            while ($row = $infoResult->fetch_assoc()) {
                array_push($result, $row);
                if ($row["timestamp"] > $maxTs) {
                    $maxTs = $row["timestamp"];
                }
            }

            // Delete new infos
            $delInfoQuery = $conn->prepare("DELETE FROM room_infos WHERE roomID = ? AND `timestamp` <= ?");
            $delInfoQuery->bind_param("id", $roomID, $maxTs);
            $delInfoQuery->execute();
            echo json_encode($result);
            die();
        }
        usleep(30000);
    }
    echo json_encode([]);
?>
