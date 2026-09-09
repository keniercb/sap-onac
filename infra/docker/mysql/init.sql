-- SAP-ONAC — Script de inicialización de MySQL
CREATE DATABASE IF NOT EXISTS sap_onac_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS sap_onac_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON sap_onac_dev.* TO 'sap_onac'@'%';
GRANT ALL PRIVILEGES ON sap_onac_test.* TO 'sap_onac'@'%';
FLUSH PRIVILEGES;
