-- Seeds the SOCSO and EIS contribution tables and the PayrollSettings singleton.
--
-- These are reference data the application cannot function without, so they are
-- seeded by a migration rather than by prisma/seed.ts — production gets them
-- without anyone remembering a setup step.
--
-- IMPORTANT: these rows are GENERATED from the statutory rates using the rule
-- "band midpoint x rate, floored to 5 sen", which was inferred from a single
-- reference payslip. They are a starting point, not an authority. An admin must
-- reconcile them against the official PERKESO schedule and stamp
-- PayrollSettings.bandsVerifiedAt before real payroll is run; until then the
-- payroll pages display a warning. See spec section 12.
--
-- Regenerate with: npx tsx scripts/generate-band-sql.ts

-- The singleton row, so getPayrollSettings() never has to create it under load.
INSERT INTO "PayrollSettings" ("id", "bandsGeneratedAt", "updatedAt")
VALUES ('singleton', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- SOCSO: 60 bands, 100 wide, ceiling 6000
-- Generated from 0.5% employee / 1.75% employer
-- by scripts/generate-band-sql.ts. Rule: band midpoint x rate, floored to 5 sen.
INSERT INTO "StatutoryBand" ("id", "type", "wageFrom", "wageTo", "employeeAmount", "employerAmount", "source") VALUES
  ('socso_0', 'SOCSO', 0.00, 100.00, 0.25, 0.85, 'GENERATED'),
  ('socso_100', 'SOCSO', 100.00, 200.00, 0.75, 2.60, 'GENERATED'),
  ('socso_200', 'SOCSO', 200.00, 300.00, 1.25, 4.35, 'GENERATED'),
  ('socso_300', 'SOCSO', 300.00, 400.00, 1.75, 6.10, 'GENERATED'),
  ('socso_400', 'SOCSO', 400.00, 500.00, 2.25, 7.85, 'GENERATED'),
  ('socso_500', 'SOCSO', 500.00, 600.00, 2.75, 9.60, 'GENERATED'),
  ('socso_600', 'SOCSO', 600.00, 700.00, 3.25, 11.35, 'GENERATED'),
  ('socso_700', 'SOCSO', 700.00, 800.00, 3.75, 13.10, 'GENERATED'),
  ('socso_800', 'SOCSO', 800.00, 900.00, 4.25, 14.85, 'GENERATED'),
  ('socso_900', 'SOCSO', 900.00, 1000.00, 4.75, 16.60, 'GENERATED'),
  ('socso_1000', 'SOCSO', 1000.00, 1100.00, 5.25, 18.35, 'GENERATED'),
  ('socso_1100', 'SOCSO', 1100.00, 1200.00, 5.75, 20.10, 'GENERATED'),
  ('socso_1200', 'SOCSO', 1200.00, 1300.00, 6.25, 21.85, 'GENERATED'),
  ('socso_1300', 'SOCSO', 1300.00, 1400.00, 6.75, 23.60, 'GENERATED'),
  ('socso_1400', 'SOCSO', 1400.00, 1500.00, 7.25, 25.35, 'GENERATED'),
  ('socso_1500', 'SOCSO', 1500.00, 1600.00, 7.75, 27.10, 'GENERATED'),
  ('socso_1600', 'SOCSO', 1600.00, 1700.00, 8.25, 28.85, 'GENERATED'),
  ('socso_1700', 'SOCSO', 1700.00, 1800.00, 8.75, 30.60, 'GENERATED'),
  ('socso_1800', 'SOCSO', 1800.00, 1900.00, 9.25, 32.35, 'GENERATED'),
  ('socso_1900', 'SOCSO', 1900.00, 2000.00, 9.75, 34.10, 'GENERATED'),
  ('socso_2000', 'SOCSO', 2000.00, 2100.00, 10.25, 35.85, 'GENERATED'),
  ('socso_2100', 'SOCSO', 2100.00, 2200.00, 10.75, 37.60, 'GENERATED'),
  ('socso_2200', 'SOCSO', 2200.00, 2300.00, 11.25, 39.35, 'GENERATED'),
  ('socso_2300', 'SOCSO', 2300.00, 2400.00, 11.75, 41.10, 'GENERATED'),
  ('socso_2400', 'SOCSO', 2400.00, 2500.00, 12.25, 42.85, 'GENERATED'),
  ('socso_2500', 'SOCSO', 2500.00, 2600.00, 12.75, 44.60, 'GENERATED'),
  ('socso_2600', 'SOCSO', 2600.00, 2700.00, 13.25, 46.35, 'GENERATED'),
  ('socso_2700', 'SOCSO', 2700.00, 2800.00, 13.75, 48.10, 'GENERATED'),
  ('socso_2800', 'SOCSO', 2800.00, 2900.00, 14.25, 49.85, 'GENERATED'),
  ('socso_2900', 'SOCSO', 2900.00, 3000.00, 14.75, 51.60, 'GENERATED'),
  ('socso_3000', 'SOCSO', 3000.00, 3100.00, 15.25, 53.35, 'GENERATED'),
  ('socso_3100', 'SOCSO', 3100.00, 3200.00, 15.75, 55.10, 'GENERATED'),
  ('socso_3200', 'SOCSO', 3200.00, 3300.00, 16.25, 56.85, 'GENERATED'),
  ('socso_3300', 'SOCSO', 3300.00, 3400.00, 16.75, 58.60, 'GENERATED'),
  ('socso_3400', 'SOCSO', 3400.00, 3500.00, 17.25, 60.35, 'GENERATED'),
  ('socso_3500', 'SOCSO', 3500.00, 3600.00, 17.75, 62.10, 'GENERATED'),
  ('socso_3600', 'SOCSO', 3600.00, 3700.00, 18.25, 63.85, 'GENERATED'),
  ('socso_3700', 'SOCSO', 3700.00, 3800.00, 18.75, 65.60, 'GENERATED'),
  ('socso_3800', 'SOCSO', 3800.00, 3900.00, 19.25, 67.35, 'GENERATED'),
  ('socso_3900', 'SOCSO', 3900.00, 4000.00, 19.75, 69.10, 'GENERATED'),
  ('socso_4000', 'SOCSO', 4000.00, 4100.00, 20.25, 70.85, 'GENERATED'),
  ('socso_4100', 'SOCSO', 4100.00, 4200.00, 20.75, 72.60, 'GENERATED'),
  ('socso_4200', 'SOCSO', 4200.00, 4300.00, 21.25, 74.35, 'GENERATED'),
  ('socso_4300', 'SOCSO', 4300.00, 4400.00, 21.75, 76.10, 'GENERATED'),
  ('socso_4400', 'SOCSO', 4400.00, 4500.00, 22.25, 77.85, 'GENERATED'),
  ('socso_4500', 'SOCSO', 4500.00, 4600.00, 22.75, 79.60, 'GENERATED'),
  ('socso_4600', 'SOCSO', 4600.00, 4700.00, 23.25, 81.35, 'GENERATED'),
  ('socso_4700', 'SOCSO', 4700.00, 4800.00, 23.75, 83.10, 'GENERATED'),
  ('socso_4800', 'SOCSO', 4800.00, 4900.00, 24.25, 84.85, 'GENERATED'),
  ('socso_4900', 'SOCSO', 4900.00, 5000.00, 24.75, 86.60, 'GENERATED'),
  ('socso_5000', 'SOCSO', 5000.00, 5100.00, 25.25, 88.35, 'GENERATED'),
  ('socso_5100', 'SOCSO', 5100.00, 5200.00, 25.75, 90.10, 'GENERATED'),
  ('socso_5200', 'SOCSO', 5200.00, 5300.00, 26.25, 91.85, 'GENERATED'),
  ('socso_5300', 'SOCSO', 5300.00, 5400.00, 26.75, 93.60, 'GENERATED'),
  ('socso_5400', 'SOCSO', 5400.00, 5500.00, 27.25, 95.35, 'GENERATED'),
  ('socso_5500', 'SOCSO', 5500.00, 5600.00, 27.75, 97.10, 'GENERATED'),
  ('socso_5600', 'SOCSO', 5600.00, 5700.00, 28.25, 98.85, 'GENERATED'),
  ('socso_5700', 'SOCSO', 5700.00, 5800.00, 28.75, 100.60, 'GENERATED'),
  ('socso_5800', 'SOCSO', 5800.00, 5900.00, 29.25, 102.35, 'GENERATED'),
  ('socso_5900', 'SOCSO', 5900.00, 6000.00, 29.75, 104.10, 'GENERATED');

-- EIS: 60 bands, 100 wide, ceiling 6000
-- Generated from 0.2% employee / 0.2% employer
-- by scripts/generate-band-sql.ts. Rule: band midpoint x rate, floored to 5 sen.
INSERT INTO "StatutoryBand" ("id", "type", "wageFrom", "wageTo", "employeeAmount", "employerAmount", "source") VALUES
  ('eis_0', 'EIS', 0.00, 100.00, 0.10, 0.10, 'GENERATED'),
  ('eis_100', 'EIS', 100.00, 200.00, 0.30, 0.30, 'GENERATED'),
  ('eis_200', 'EIS', 200.00, 300.00, 0.50, 0.50, 'GENERATED'),
  ('eis_300', 'EIS', 300.00, 400.00, 0.70, 0.70, 'GENERATED'),
  ('eis_400', 'EIS', 400.00, 500.00, 0.90, 0.90, 'GENERATED'),
  ('eis_500', 'EIS', 500.00, 600.00, 1.10, 1.10, 'GENERATED'),
  ('eis_600', 'EIS', 600.00, 700.00, 1.30, 1.30, 'GENERATED'),
  ('eis_700', 'EIS', 700.00, 800.00, 1.50, 1.50, 'GENERATED'),
  ('eis_800', 'EIS', 800.00, 900.00, 1.70, 1.70, 'GENERATED'),
  ('eis_900', 'EIS', 900.00, 1000.00, 1.90, 1.90, 'GENERATED'),
  ('eis_1000', 'EIS', 1000.00, 1100.00, 2.10, 2.10, 'GENERATED'),
  ('eis_1100', 'EIS', 1100.00, 1200.00, 2.30, 2.30, 'GENERATED'),
  ('eis_1200', 'EIS', 1200.00, 1300.00, 2.50, 2.50, 'GENERATED'),
  ('eis_1300', 'EIS', 1300.00, 1400.00, 2.70, 2.70, 'GENERATED'),
  ('eis_1400', 'EIS', 1400.00, 1500.00, 2.90, 2.90, 'GENERATED'),
  ('eis_1500', 'EIS', 1500.00, 1600.00, 3.10, 3.10, 'GENERATED'),
  ('eis_1600', 'EIS', 1600.00, 1700.00, 3.30, 3.30, 'GENERATED'),
  ('eis_1700', 'EIS', 1700.00, 1800.00, 3.50, 3.50, 'GENERATED'),
  ('eis_1800', 'EIS', 1800.00, 1900.00, 3.70, 3.70, 'GENERATED'),
  ('eis_1900', 'EIS', 1900.00, 2000.00, 3.90, 3.90, 'GENERATED'),
  ('eis_2000', 'EIS', 2000.00, 2100.00, 4.10, 4.10, 'GENERATED'),
  ('eis_2100', 'EIS', 2100.00, 2200.00, 4.30, 4.30, 'GENERATED'),
  ('eis_2200', 'EIS', 2200.00, 2300.00, 4.50, 4.50, 'GENERATED'),
  ('eis_2300', 'EIS', 2300.00, 2400.00, 4.70, 4.70, 'GENERATED'),
  ('eis_2400', 'EIS', 2400.00, 2500.00, 4.90, 4.90, 'GENERATED'),
  ('eis_2500', 'EIS', 2500.00, 2600.00, 5.10, 5.10, 'GENERATED'),
  ('eis_2600', 'EIS', 2600.00, 2700.00, 5.30, 5.30, 'GENERATED'),
  ('eis_2700', 'EIS', 2700.00, 2800.00, 5.50, 5.50, 'GENERATED'),
  ('eis_2800', 'EIS', 2800.00, 2900.00, 5.70, 5.70, 'GENERATED'),
  ('eis_2900', 'EIS', 2900.00, 3000.00, 5.90, 5.90, 'GENERATED'),
  ('eis_3000', 'EIS', 3000.00, 3100.00, 6.10, 6.10, 'GENERATED'),
  ('eis_3100', 'EIS', 3100.00, 3200.00, 6.30, 6.30, 'GENERATED'),
  ('eis_3200', 'EIS', 3200.00, 3300.00, 6.50, 6.50, 'GENERATED'),
  ('eis_3300', 'EIS', 3300.00, 3400.00, 6.70, 6.70, 'GENERATED'),
  ('eis_3400', 'EIS', 3400.00, 3500.00, 6.90, 6.90, 'GENERATED'),
  ('eis_3500', 'EIS', 3500.00, 3600.00, 7.10, 7.10, 'GENERATED'),
  ('eis_3600', 'EIS', 3600.00, 3700.00, 7.30, 7.30, 'GENERATED'),
  ('eis_3700', 'EIS', 3700.00, 3800.00, 7.50, 7.50, 'GENERATED'),
  ('eis_3800', 'EIS', 3800.00, 3900.00, 7.70, 7.70, 'GENERATED'),
  ('eis_3900', 'EIS', 3900.00, 4000.00, 7.90, 7.90, 'GENERATED'),
  ('eis_4000', 'EIS', 4000.00, 4100.00, 8.10, 8.10, 'GENERATED'),
  ('eis_4100', 'EIS', 4100.00, 4200.00, 8.30, 8.30, 'GENERATED'),
  ('eis_4200', 'EIS', 4200.00, 4300.00, 8.50, 8.50, 'GENERATED'),
  ('eis_4300', 'EIS', 4300.00, 4400.00, 8.70, 8.70, 'GENERATED'),
  ('eis_4400', 'EIS', 4400.00, 4500.00, 8.90, 8.90, 'GENERATED'),
  ('eis_4500', 'EIS', 4500.00, 4600.00, 9.10, 9.10, 'GENERATED'),
  ('eis_4600', 'EIS', 4600.00, 4700.00, 9.30, 9.30, 'GENERATED'),
  ('eis_4700', 'EIS', 4700.00, 4800.00, 9.50, 9.50, 'GENERATED'),
  ('eis_4800', 'EIS', 4800.00, 4900.00, 9.70, 9.70, 'GENERATED'),
  ('eis_4900', 'EIS', 4900.00, 5000.00, 9.90, 9.90, 'GENERATED'),
  ('eis_5000', 'EIS', 5000.00, 5100.00, 10.10, 10.10, 'GENERATED'),
  ('eis_5100', 'EIS', 5100.00, 5200.00, 10.30, 10.30, 'GENERATED'),
  ('eis_5200', 'EIS', 5200.00, 5300.00, 10.50, 10.50, 'GENERATED'),
  ('eis_5300', 'EIS', 5300.00, 5400.00, 10.70, 10.70, 'GENERATED'),
  ('eis_5400', 'EIS', 5400.00, 5500.00, 10.90, 10.90, 'GENERATED'),
  ('eis_5500', 'EIS', 5500.00, 5600.00, 11.10, 11.10, 'GENERATED'),
  ('eis_5600', 'EIS', 5600.00, 5700.00, 11.30, 11.30, 'GENERATED'),
  ('eis_5700', 'EIS', 5700.00, 5800.00, 11.50, 11.50, 'GENERATED'),
  ('eis_5800', 'EIS', 5800.00, 5900.00, 11.70, 11.70, 'GENERATED'),
  ('eis_5900', 'EIS', 5900.00, 6000.00, 11.90, 11.90, 'GENERATED');

