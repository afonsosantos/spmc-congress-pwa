-- Purchased add-ons (lunch, workshops, etc.) alongside the main ticket,
-- refreshed on each login the same way ticket_product is.
ALTER TABLE participants ADD COLUMN addons TEXT[] NOT NULL DEFAULT '{}';
