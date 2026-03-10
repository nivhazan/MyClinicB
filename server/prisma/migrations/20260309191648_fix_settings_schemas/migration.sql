/*
  Warnings:

  - You are about to drop the column `businessAddress` on the `DigitalInvoiceSettings` table. All the data in the column will be lost.
  - You are about to drop the column `businessEmail` on the `DigitalInvoiceSettings` table. All the data in the column will be lost.
  - You are about to drop the column `businessPhone` on the `DigitalInvoiceSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicClosure" ADD COLUMN "type" TEXT;

-- AlterTable
ALTER TABLE "SyncLog" ADD COLUMN "createdBy" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "SyncLog" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "eventType" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "externalId" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "initiatedBy" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "patientName" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "requestData" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "responseData" TEXT;
ALTER TABLE "SyncLog" ADD COLUMN "system" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DigitalInvoiceSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKey" TEXT,
    "businessName" TEXT,
    "businessId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "footerText" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "includeVat" BOOLEAN NOT NULL DEFAULT true,
    "vatRate" REAL NOT NULL DEFAULT 17,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DigitalInvoiceSettings" ("businessId", "businessName", "createdAt", "footerText", "id", "logoUrl") SELECT "businessId", "businessName", "createdAt", "footerText", "id", "logoUrl" FROM "DigitalInvoiceSettings";
DROP TABLE "DigitalInvoiceSettings";
ALTER TABLE "new_DigitalInvoiceSettings" RENAME TO "DigitalInvoiceSettings";
CREATE TABLE "new_ReminderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTemplate" TEXT,
    "dailyUpdateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dailyUpdateTime" TEXT,
    "hoursBefore" INTEGER DEFAULT 24,
    "adminPhone" TEXT,
    "adminDailySummary" BOOLEAN NOT NULL DEFAULT true,
    "adminWeeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "weeklyScheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weeklyScheduleDay" TEXT,
    "weeklyScheduleTime" TEXT,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsProvider" TEXT,
    "smsApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ReminderSettings" ("adminDailySummary", "adminPhone", "adminWeeklySummary", "createdAt", "dailyUpdateEnabled", "hoursBefore", "id", "reminderEnabled", "reminderTemplate", "smsApiKey", "smsEnabled", "smsProvider", "telegramBotToken", "telegramChatId", "telegramEnabled") SELECT "adminDailySummary", "adminPhone", "adminWeeklySummary", "createdAt", "dailyUpdateEnabled", "hoursBefore", "id", "reminderEnabled", "reminderTemplate", "smsApiKey", "smsEnabled", "smsProvider", "telegramBotToken", "telegramChatId", "telegramEnabled" FROM "ReminderSettings";
DROP TABLE "ReminderSettings";
ALTER TABLE "new_ReminderSettings" RENAME TO "ReminderSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
