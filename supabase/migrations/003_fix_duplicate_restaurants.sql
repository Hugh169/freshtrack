-- Fix duplicate restaurants created by React StrictMode double-firing useEffect.
-- For each user with multiple restaurants:
--   1. Keeps the restaurant that has the most inventory items (tie-break: newest).
--   2. Moves all inventory_items, stock_movements, and waste_logs to the winner.
--   3. Deletes the duplicate restaurant rows.
-- Finally, adds a UNIQUE constraint on owner_id so this can never happen again.

DO $$
DECLARE
  dup_owner uuid;
  winner_id uuid;
  loser_id  uuid;
BEGIN
  FOR dup_owner IN
    SELECT owner_id
    FROM restaurants
    GROUP BY owner_id
    HAVING COUNT(*) > 1
  LOOP
    -- Pick the restaurant with the most items; break ties by newest created_at
    SELECT r.id INTO winner_id
    FROM restaurants r
    LEFT JOIN inventory_items ii ON ii.restaurant_id = r.id
    WHERE r.owner_id = dup_owner
    GROUP BY r.id, r.created_at
    ORDER BY COUNT(ii.id) DESC, r.created_at DESC
    LIMIT 1;

    -- Move everything from every other restaurant to the winner, then delete it
    FOR loser_id IN
      SELECT id FROM restaurants
      WHERE owner_id = dup_owner AND id != winner_id
    LOOP
      UPDATE inventory_items  SET restaurant_id = winner_id WHERE restaurant_id = loser_id;
      UPDATE stock_movements  SET restaurant_id = winner_id WHERE restaurant_id = loser_id;
      UPDATE waste_logs       SET restaurant_id = winner_id WHERE restaurant_id = loser_id;
      DELETE FROM restaurants WHERE id = loser_id;
    END LOOP;
  END LOOP;
END $$;

-- Prevent future duplicates
ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_owner_id_key UNIQUE (owner_id);
