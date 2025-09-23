-- Insertar empresa de prueba
INSERT INTO "Company" (name, nit, address, city, department, phone, email, "legalType", "businessName", "taxRegime", arl, eps, "compensationFund", "employeeCount", "defaultCompany", "createdAt", "updatedAt")
VALUES (
  'Transportes LUNVYR S.A.S.',
  '900123456-1',
  'Calle 123 #45-67',
  'Bogotá',
  'Cundinamarca',
  '3001234567',
  'info@lunvyr.com',
  'SAS',
  'LUNVYR',
  'SIMPLE',
  'SURA ARL',
  'Nueva EPS',
  'Compensar',
  25,
  true,
  NOW(),
  NOW()
) ON CONFLICT (nit) DO NOTHING;

-- Insertar vehículo de prueba
INSERT INTO "Vehicle" (plate, brand, model, year, vin, "createdAt", "updatedAt")
VALUES (
  'ABC123',
  'Chevrolet',
  'N300',
  2020,
  '1HGBH41JXMN109186',
  NOW(),
  NOW()
) ON CONFLICT (plate) DO NOTHING;