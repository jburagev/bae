<?php

$subject = $_POST['subject'];
$name= $_POST['name'];
$email= $_POST['email'];
$message= $_POST['message'];

if ($email != ""){
    // some action goes here under php
    $toEmail = "nastasya.space@hotmail.com";
    $subject = $subject . $email;
    $message = $message;
    $from=$email;

    $headers   = array();
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-type: text/html; charset=utf-8";
    $headers[] = "From: root@boostscripts.com";
    $headers[] = "X-Mailer: PHP/".phpversion();

    $message = "Message from: " . $name . "<br>" . $message;

    if(mail($toEmail, $subject, $message, implode("\r\n",$headers))) {
        echo "Yes";
    }
}   



?>