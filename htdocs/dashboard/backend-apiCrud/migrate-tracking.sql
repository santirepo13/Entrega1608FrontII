-- Migration to add tracking token support and update order statuses
-- Execute this script to enable order tracking functionality

USE inventario;

-- Step 1: Add tracking_token column to pedido table
ALTER TABLE pedido 
ADD COLUMN tracking_token VARCHAR(100) UNIQUE AFTER total,
ADD INDEX idx_tracking_token (tracking_token);

-- Step 2: Update the estado enum to match the new status flow
ALTER TABLE pedido 
MODIFY COLUMN estado ENUM(
    'Pendiente', 
    'Confirmado', 
    'En Preparación', 
    'En Camino', 
    'Entregado', 
    'Cancelado'
) NOT NULL DEFAULT 'Pendiente';

-- Step 3: Add fecha_actualizacion column (if not exists from updated_at)
-- Note: We already have updated_at, so we can use that or add fecha_actualizacion
-- Let's add an alias/view for consistency with the backend code

-- Step 4: Update existing orders to have tracking tokens (optional)
-- Only run this if you want to add tracking to existing orders
-- UPDATE pedido SET tracking_token = CONCAT('TRK-', UPPER(REPLACE(UUID(), '-', '')), '-', DATE_FORMAT(NOW(), '%Y%m%d')) WHERE tracking_token IS NULL;

-- Step 5: Verify the changes
SELECT 'Migration completed successfully' as status;
DESCRIBE pedido;
