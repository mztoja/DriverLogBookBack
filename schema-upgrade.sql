-- ============================================================================
--  Doprowadzenie schematu bazy do stanu gałęzi `master` (kod jest ~15 commitów
--  do przodu, `synchronize: false`, brak katalogu migracji).
--  Uruchom na bazie wskazanej w config.dbDatabase. Zrób backup przed.
-- ============================================================================

-- 1) KRYTYCZNE: kolumna wymagana przez logowanie i refresh-token.
--    Bez niej KAŻDE zapytanie o użytkownika rzuca ER_BAD_FIELD_ERROR,
--    które login() łapie i zwraca jako "invalidLoginData" (401),
--    a register() jako 500.  (commit 02b49bf "added auto-login (refreshtoken)")
ALTER TABLE `users`
  ADD COLUMN `refreshToken` varchar(36) NULL DEFAULT NULL;

-- 2) Granice: nowa kolumna userId (commit 010a4d7 - usuwanie/edycja granic).
ALTER TABLE `borders`
  ADD COLUMN `userId` varchar(36) NOT NULL DEFAULT '';
--    Jeśli masz istniejące wiersze i znasz właściciela, uzupełnij ręcznie, np.:
--    UPDATE borders SET userId = '<uuid-usera>' WHERE userId = '';

-- 3) Historia notatek użytkownika (commit a42ec59).
CREATE TABLE IF NOT EXISTS `user_notes` (
  `id`     int NOT NULL AUTO_INCREMENT,
  `userId` varchar(36) NOT NULL,
  `notes`  text NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--    Przeniesienie dotychczasowej notatki z users.notes (jeśli kolumna jeszcze istnieje):
INSERT INTO `user_notes` (`userId`, `notes`)
SELECT `id`, `notes` FROM `users`
WHERE `notes` IS NOT NULL AND `notes` <> '';
--    Po sprawdzeniu można usunąć starą kolumnę (kod jej już nie używa):
--    ALTER TABLE `users` DROP COLUMN `notes`;

-- 4) Ulubione wydatki (commit 5c20c57).
CREATE TABLE IF NOT EXISTS `expense_favorites` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `userId`          varchar(36) NOT NULL,
  `place`           varchar(30)  NOT NULL DEFAULT '',
  `placeId`         int          NOT NULL DEFAULT 0,
  `country`         varchar(3)   NOT NULL DEFAULT '',
  `itemDescription` varchar(100) NOT NULL,
  `unitPrice`       decimal(9,2) NOT NULL DEFAULT 0,
  `payment`         varchar(15)  NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
--  Poniższe NIE są konieczne do działania (SELECT ich nie wymaga) - to tylko
--  dorównanie definicji encji. Zastosuj, jeśli chcesz spójności / zapisów bez
--  podawania wszystkich pól:
-- ----------------------------------------------------------------------------
-- ALTER TABLE `days`
--   MODIFY `stopLogId` int NOT NULL DEFAULT 0,
--   MODIFY `distance`  int NOT NULL DEFAULT 0,
--   MODIFY `fuelBurned` decimal(7,2) NOT NULL DEFAULT 0,
--   MODIFY `driveTime`  time NOT NULL DEFAULT '00:00:00',
--   MODIFY `driveTime2` time NOT NULL DEFAULT '00:00:00',
--   MODIFY `workTime`   time NOT NULL DEFAULT '00:00:00',
--   MODIFY `breakTime`  time NOT NULL DEFAULT '00:00:00';
-- ALTER TABLE `loads`
--   MODIFY `unloadingLogId` int NOT NULL DEFAULT 0,
--   MODIFY `senderId`   int NOT NULL DEFAULT 0,
--   MODIFY `receiverId` int NOT NULL DEFAULT 0,
--   MODIFY `vehicle`     varchar(10) NOT NULL DEFAULT '',
--   MODIFY `description` varchar(30) NOT NULL DEFAULT '',
--   MODIFY `quantity`    varchar(30) NOT NULL DEFAULT '',
--   MODIFY `reference`   varchar(20) NOT NULL DEFAULT '',
--   MODIFY `distance`    int NOT NULL DEFAULT 0;
-- ALTER TABLE `tours`
--   MODIFY `stopLogId` int NOT NULL DEFAULT 0,
--   MODIFY `driveTime` time NOT NULL DEFAULT '00:00:00',
--   MODIFY `workTime`  time NOT NULL DEFAULT '00:00:00',
--   MODIFY `distance`  decimal(7,0) NOT NULL DEFAULT 0,
--   MODIFY `daysOnDuty`  tinyint NOT NULL DEFAULT 0,
--   MODIFY `daysOffDuty` tinyint NOT NULL DEFAULT 0,
--   MODIFY `totalRefuel`    decimal(7,2) NOT NULL DEFAULT 0,
--   MODIFY `fuelStateAfter` decimal(5,0) NOT NULL DEFAULT 0,
--   MODIFY `burnedFuelComp` decimal(7,2) NOT NULL DEFAULT 0,
--   MODIFY `burnedFuelReal` decimal(7,2) NOT NULL DEFAULT 0,
--   MODIFY `numberOfLoads`  tinyint NOT NULL DEFAULT 0,
--   MODIFY `avgWeight`      decimal(5,0) NOT NULL DEFAULT 0,
--   MODIFY `expectedSalary` decimal(8,2) NOT NULL DEFAULT 0,
--   MODIFY `salary`   decimal(8,2) NOT NULL DEFAULT 0,
--   MODIFY `outgoings` decimal(8,2) NOT NULL DEFAULT 0,
--   MODIFY `currency` varchar(3) NOT NULL DEFAULT '';
-- ALTER TABLE `places`
--   MODIFY `lat` decimal(10,5) NOT NULL DEFAULT 0,
--   MODIFY `lon` decimal(10,5) NOT NULL DEFAULT 0;
