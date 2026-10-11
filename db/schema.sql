USE urop_db;
DROP TABLE IF EXISTS opportunities;

CREATE TABLE opportunities(
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(100) NOT NULL,
	description VARCHAR(4000),
	area VARCHAR(100) NOT NULL,
	researcher_name VARCHAR(100) NOT NULL,
	department VARCHAR(100) NOT NULL,
	required_skills VARCHAR(1000),
	available_positions INT UNSIGNED NOT NULL,
	deadline DATE NOT NULL,
	status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open'
);