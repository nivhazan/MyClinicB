/*
  Warnings:

  - You are about to drop the column `telegramToken` on the `ReminderSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReminderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTemplate" TEXT,
    "dailyUpdateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hoursBefore" INTEGER DEFAULT 24,
    "adminPhone" TEXT,
    "adminDailySummary" BOOLEAN NOT NULL DEFAULT true,
    "adminWeeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsProvider" TEXT,
    "smsApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ReminderSettings" ("createdAt", "dailyUpdateEnabled", "id", "reminderEnabled", "reminderTemplate", "telegramChatId") SELECT "createdAt", "dailyUpdateEnabled", "id", "reminderEnabled", "reminderTemplate", "telegramChatId" FROM "ReminderSettings";
DROP TABLE "ReminderSettings";
ALTER TABLE "new_ReminderSettings" RENAME TO "ReminderSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
