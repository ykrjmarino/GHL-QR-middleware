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
    event_id INT NOT NULL,
    total_amount DECIMAL(10,2),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES contacts(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
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

===========alter table============
-- add quantity to orders
ALTER TABLE orders
  ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER event_id;

-- remove the FK constraint from orders to contacts
ALTER TABLE orders
  DROP FOREIGN KEY `1`;

-- remove user_id from orders
ALTER TABLE orders
  DROP COLUMN user_id;

  
============== dummy data ==============
-- 1. contacts first
INSERT INTO contacts (name, email, phone) VALUES
('Juan dela Cruz', 'juan@email.com', '09171234567'),
('Maria Santos', 'maria@email.com', '09281234567'),
('Pedro Reyes', 'pedro@email.com', '09391234567');

-- 2. events
INSERT INTO events (event_name, event_date, expires_at, location) VALUES
('Sinulog Festival Concert', '2025-01-19 18:00:00', '2025-01-19 23:00:00', 'Cebu City Sports Center'),
('OPM Night Manila', '2025-02-14 19:00:00', '2025-02-14 23:59:00', 'SM Mall of Asia Arena'),
('Tech Summit PH', '2025-03-10 09:00:00', '2025-03-10 17:00:00', 'PICC, Pasay City');

-- 3. orders (now includes event_id)
INSERT INTO orders (order_ref, event_id, quantity, total_amount, payment_status) VALUES
('ORDER-2025-001', 1, 2, 500.00, 'paid'),
('ORDER-2025-002', 2, 1, 1000.00, 'paid'),
('ORDER-2025-003', 3, 3, 1500.00, 'pending');

-- 4. payments
INSERT INTO payments (order_id, provider, amount, payment_status, transaction_ref) VALUES
(1, 'GCash', 500.00, 'paid', 'GC-TXN-000001'),
(2, 'Maya', 1000.00, 'paid', 'MY-TXN-000002'),
(2, 'Maya', 1000.00, 'paid', 'MY-TXN-000004'),
(3, 'GCash', 1500.00, 'pending', 'GC-TXN-000003');

-- //no need for this muna
-- 5. tickets last (only after payment)
INSERT INTO tickets (ticket_id, order_id, event_id, status, qr_url) VALUES
('TKT-2025-001', 1, 1, 'unused', 'http://localhost:8080/qr/TKT-2025-001'),
('TKT-2025-002', 2, 2, 'unused', 'http://localhost:8080/qr/TKT-2025-002'),
('TKT-2025-003', 2, 2, 'unused', 'http://localhost:8080/qr/TKT-2025-003'),
('TKT-2025-004', 3, 3, 'unused', 'http://localhost:8080/qr/TKT-2025-004');