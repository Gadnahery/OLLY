-- Seed data for OLLY peanut-butter / tahini food processor

-- Raw materials
INSERT INTO products (id, name, sku, type, unit, cost_price, reorder_level) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Groundnuts', 'RM-GN', 'raw_material', 'kg', 2500, 50),
  ('a1000001-0000-4000-8000-000000000002', 'Sesame Seeds', 'RM-SS', 'raw_material', 'kg', 4500, 30),
  ('a1000001-0000-4000-8000-000000000003', 'Cooking Oil', 'RM-OIL', 'raw_material', 'L', 3500, 20),
  ('a1000001-0000-4000-8000-000000000004', 'Sugar', 'RM-SUG', 'raw_material', 'kg', 2000, 15),
  ('a1000001-0000-4000-8000-000000000005', 'Salt', 'RM-SALT', 'raw_material', 'kg', 800, 5);

-- Packaging
INSERT INTO products (id, name, sku, type, unit, cost_price, reorder_level) VALUES
  ('a1000001-0000-4000-8000-000000000011', '300g Jars', 'PK-J300', 'packaging', 'pcs', 300, 100),
  ('a1000001-0000-4000-8000-000000000012', '450g Jars', 'PK-J450', 'packaging', 'pcs', 400, 100),
  ('a1000001-0000-4000-8000-000000000013', '750g Jars', 'PK-J750', 'packaging', 'pcs', 550, 50),
  ('a1000001-0000-4000-8000-000000000014', 'Caps', 'PK-CAP', 'packaging', 'pcs', 80, 200),
  ('a1000001-0000-4000-8000-000000000015', 'Labels', 'PK-LBL', 'packaging', 'pcs', 50, 200);

-- Finished goods
INSERT INTO products (id, name, sku, type, unit, selling_price, cost_price, reorder_level) VALUES
  ('a1000001-0000-4000-8000-000000000021', 'Peanut Butter 300g', 'FG-PB300', 'finished_good', 'pcs', 7000, 4300, 20),
  ('a1000001-0000-4000-8000-000000000022', 'Peanut Butter 450g', 'FG-PB450', 'finished_good', 'pcs', 10000, 4400, 20),
  ('a1000001-0000-4000-8000-000000000023', 'Peanut Butter 750g', 'FG-PB750', 'finished_good', 'pcs', 15000, 7200, 10),
  ('a1000001-0000-4000-8000-000000000024', 'Tahini 300g', 'FG-TH300', 'finished_good', 'pcs', 9000, 5500, 15),
  ('a1000001-0000-4000-8000-000000000025', 'Tahini 750g', 'FG-TH750', 'finished_good', 'pcs', 18000, 11000, 10);

-- Recipes for Peanut Butter 450g (yield 1 unit)
INSERT INTO recipes (id, product_id, name, yield_quantity) VALUES
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000022', 'Peanut Butter 450g Recipe', 1);

INSERT INTO recipe_items (recipe_id, product_id, quantity) VALUES
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001', 0.50), -- Groundnuts 0.5kg
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000003', 0.05), -- Oil 0.05L
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000004', 0.02), -- Sugar 0.02kg
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000012', 1),    -- 450g Jar
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000014', 1),    -- Cap
  ('b1000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000015', 1);    -- Label

-- Recipe Peanut Butter 300g
INSERT INTO recipes (id, product_id, name, yield_quantity) VALUES
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000021', 'Peanut Butter 300g Recipe', 1);

INSERT INTO recipe_items (recipe_id, product_id, quantity) VALUES
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000001', 0.33),
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000003', 0.03),
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000004', 0.015),
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000011', 1),
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000014', 1),
  ('b1000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000015', 1);

-- Recipe Peanut Butter 750g
INSERT INTO recipes (id, product_id, name, yield_quantity) VALUES
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000023', 'Peanut Butter 750g Recipe', 1);

INSERT INTO recipe_items (recipe_id, product_id, quantity) VALUES
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000001', 0.80),
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000003', 0.08),
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000004', 0.03),
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000013', 1),
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000014', 1),
  ('b1000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000015', 1);

-- Initial inventory balances (via movements)
INSERT INTO inventory_movements (product_id, movement_type, quantity, unit_cost, notes) VALUES
  ('a1000001-0000-4000-8000-000000000001', 'adjustment', 450, 2500, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000002', 'adjustment', 120, 4500, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000003', 'adjustment', 80, 3500, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000004', 'adjustment', 60, 2000, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000005', 'adjustment', 25, 800, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000011', 'adjustment', 500, 300, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000012', 'adjustment', 400, 400, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000013', 'adjustment', 200, 550, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000014', 'adjustment', 800, 80, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000015', 'adjustment', 800, 50, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000021', 'adjustment', 92, 4300, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000022', 'adjustment', 186, 4400, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000023', 'adjustment', 45, 7200, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000024', 'adjustment', 40, 5500, 'Opening stock'),
  ('a1000001-0000-4000-8000-000000000025', 'adjustment', 28, 11000, 'Opening stock');

-- Sample customers
INSERT INTO customers (id, name, phone) VALUES
  ('c1000001-0000-4000-8000-000000000001', 'ABC Wholesale', '+255712000001'),
  ('c1000001-0000-4000-8000-000000000002', 'John Retail', '+255712000002'),
  ('c1000001-0000-4000-8000-000000000003', 'XYZ Shop', '+255712000003');

-- Sample suppliers
INSERT INTO suppliers (id, name, phone) VALUES
  ('d1000001-0000-4000-8000-000000000001', 'Arusha Groundnuts Co', '+255713000001'),
  ('d1000001-0000-4000-8000-000000000002', 'Sesame Oils Ltd', '+255713000002'),
  ('d1000001-0000-4000-8000-000000000003', 'Packaging Hub TZ', '+255713000003');

-- Sample employees
INSERT INTO employees (id, name, role, salary) VALUES
  ('e1000001-0000-4000-8000-000000000001', 'John', 'Security Guard', 350000),
  ('e1000001-0000-4000-8000-000000000002', 'Mary', 'Production Supervisor', 500000),
  ('e1000001-0000-4000-8000-000000000003', 'Peter', 'Machine Operator', 400000);
