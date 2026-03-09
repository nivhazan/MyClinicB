-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReminderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramToken" TEXT,
    "telegramChatId" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramBotToken" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTemplate" TEXT,
    "autoSendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "hoursBefore" INTEGER NOT NULL DEFAULT 24,
    "dailyUpdateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adminDailySummary" BOOLEAN NOT NULL DEFAULT false,
    "adminWeeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "adminPhone" TEXT,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsProvider" TEXT,
    "smsApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ReminderSettings" ("createdAt", "dailyUpdateEnabled", "id", "reminderEnabled", "reminderTemplate", "telegramChatId", "telegramToken") SELECT "createdAt", "dailyUpdateEnabled", "id", "reminderEnabled", "reminderTemplate", "telegramChatId", "telegramToken" FROM "ReminderSettings";
DROP TABLE "ReminderSettings";
ALTER TABLE "new_ReminderSettings" RENAME TO "ReminderSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
