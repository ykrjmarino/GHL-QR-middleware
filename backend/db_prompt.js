// This file contains the SQL command to create the 'tickets' table in the database.
// I used MariaDB for this project
// I used HeidiSQL to run this command and create the table in my local database
  // share ko lang oki

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL UNIQUE,
  event_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'unused',
  qr_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);