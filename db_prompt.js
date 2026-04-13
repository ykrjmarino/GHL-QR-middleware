// This file contains the SQL command to create the 'tickets' table in the database.
// I used MariaDB for this project
// I used HeidiSQL to run this command and create the table in my local database
  // share ko lang oki

// CREATE TABLE tickets (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   ticket_id VARCHAR(50) NOT NULL UNIQUE,
//   event_id INT NOT NULL,
//   status VARCHAR(20) DEFAULT 'unused',
//   qr_url VARCHAR(255),
//   expires_at DATETIME,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

CONTACTS: User must exist first.
EVENTS: Event must exist.
ORDERS: Created when user buys something.
PAYMENTS: Tracks payment record
TICKETS: Created ONLY after payment is successful.

contacts → orders → payments
                        ↓
                    tickets → events

Example:
User buys ticket
You create:
  1 order
Order generates:
  1 or multiple tickets
Each ticket:
  has unique QR
  linked to event

CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(150),
    event_date DATETIME,
    expires_at DATETIME,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_ref VARCHAR(50) UNIQUE,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES contacts(id)
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE,
    order_id INT NOT NULL,         -- one or more tickets can link to one order_id
    event_id INT NOT NULL,
    status ENUM('unused', 'used') DEFAULT 'unused',
    qr_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    provider VARCHAR(50),
    amount DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

============== dummy data ==============
INSERT INTO contacts (name, email, phone)
VALUES ('Test User', 'test@email.com', '09123456789');

INSERT INTO orders (order_ref, user_id, total_amount, payment_status)
VALUES ('ORDER-TEST-001', 1, 500.00, 'paid');

http://localhost:8080/ticket/generate
POST body:
{
  "data": {
    "event_id": 1,
    "order_id": 1
  }
}