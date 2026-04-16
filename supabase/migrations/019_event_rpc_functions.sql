-- ============================================================
-- Migration 019: Event RPC Functions (Stripe webhook helpers)
-- ============================================================

-- Increments sold_count on a ticket tier
CREATE OR REPLACE FUNCTION increment_ticket_sold_count(p_ticket_id uuid, p_qty int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE event_tickets
  SET sold_count = sold_count + p_qty
  WHERE id = p_ticket_id;
END;
$$;

-- Increments total_tickets_sold and total_revenue on an event
CREATE OR REPLACE FUNCTION increment_event_totals(p_event_id uuid, p_tickets int, p_revenue numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE events
  SET
    total_tickets_sold = COALESCE(total_tickets_sold, 0) + p_tickets,
    total_revenue = COALESCE(total_revenue, 0) + p_revenue
  WHERE id = p_event_id;
END;
$$;
