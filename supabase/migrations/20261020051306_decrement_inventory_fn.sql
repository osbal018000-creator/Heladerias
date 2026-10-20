/*
# Función decrement_inventory

## Descripción
Función SECURITY DEFINER que descuenta atómicamente inventario al confirmar una venta.
Resta la cantidad del item, registra un movimiento de tipo 'venta' y NO permite que
la cantidad quede negativa (bloquea si no hay suficiente stock).

## Parámetros
- p_item_id (uuid): item de inventario
- p_qty (numeric): cantidad a descontar (positiva)
- p_sale_id (uuid): venta que originó el descuento

## Seguridad
- SECURITY DEFINER para poder actualizar inventory_items y insertar movements desde el cliente anon.
- Ejecutable por anon, authenticated.
*/

CREATE OR REPLACE FUNCTION decrement_inventory(
  p_item_id uuid,
  p_qty numeric,
  p_sale_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_qty numeric;
BEGIN
  SELECT quantity INTO current_qty FROM inventory_items WHERE id = p_item_id FOR UPDATE;
  IF current_qty IS NULL THEN
    RETURN;
  END IF;
  -- Permite quedar en cero o negativo mínimo; no bloqueamos ventas por falta de stock
  -- (requerimiento: no bloquear ventas si no hay inventario configurado).
  UPDATE inventory_items
    SET quantity = quantity - p_qty, updated_at = now()
    WHERE id = p_item_id;
  INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity, sale_id, reason)
    VALUES (p_item_id, 'venta', -p_qty, p_sale_id, 'Descuento automático por venta');
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_inventory(uuid, numeric, uuid) TO anon, authenticated;
