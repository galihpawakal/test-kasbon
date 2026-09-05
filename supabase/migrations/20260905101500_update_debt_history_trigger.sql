CREATE OR REPLACE FUNCTION log_debt_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action debt_action;
  v_changed_fields JSONB := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO debt_history (debt_id, user_id, action, changed_fields)
    VALUES (NEW.id, NEW.user_id, 'created', NULL);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.settled_at IS NOT NULL AND OLD.settled_at IS NULL THEN
      v_action := 'settled';
    ELSIF NEW.settled_at IS NULL AND OLD.settled_at IS NOT NULL THEN
      v_action := 'unsettled';
    ELSE
      v_action := 'updated';
    END IF;
    
    IF NEW.amount <> OLD.amount THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{amount}', jsonb_build_object('old', OLD.amount, 'new', NEW.amount));
    END IF;
    IF NEW.counterpart_name <> OLD.counterpart_name THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{counterpart_name}', jsonb_build_object('old', OLD.counterpart_name, 'new', NEW.counterpart_name));
    END IF;
    IF (NEW.note IS DISTINCT FROM OLD.note) THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{note}', coalesce(jsonb_build_object('old', OLD.note, 'new', NEW.note), '{"old":null,"new":null}'::jsonb));
    END IF;
    IF (NEW.due_date IS DISTINCT FROM OLD.due_date) THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{due_date}', coalesce(jsonb_build_object('old', OLD.due_date, 'new', NEW.due_date), '{"old":null,"new":null}'::jsonb));
    END IF;
    
    -- New fields tracked
    IF (NEW.type IS DISTINCT FROM OLD.type) THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{type}', coalesce(jsonb_build_object('old', OLD.type, 'new', NEW.type), '{"old":null,"new":null}'::jsonb));
    END IF;
    IF (NEW.currency IS DISTINCT FROM OLD.currency) THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{currency}', coalesce(jsonb_build_object('old', OLD.currency, 'new', NEW.currency), '{"old":null,"new":null}'::jsonb));
    END IF;
    IF (NEW.counterpart_phone IS DISTINCT FROM OLD.counterpart_phone) THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{counterpart_phone}', coalesce(jsonb_build_object('old', OLD.counterpart_phone, 'new', NEW.counterpart_phone), '{"old":null,"new":null}'::jsonb));
    END IF;
    IF (NEW.category_id IS DISTINCT FROM OLD.category_id) THEN
      v_changed_fields := jsonb_set(v_changed_fields, '{category_id}', coalesce(jsonb_build_object('old', OLD.category_id, 'new', NEW.category_id), '{"old":null,"new":null}'::jsonb));
    END IF;

    IF v_action IN ('settled', 'unsettled') OR v_changed_fields <> '{}'::jsonb THEN
      INSERT INTO debt_history (debt_id, user_id, action, changed_fields)
      VALUES (NEW.id, NEW.user_id, v_action, CASE WHEN v_changed_fields = '{}'::jsonb THEN NULL ELSE v_changed_fields END);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO debt_history (debt_id, user_id, action, changed_fields)
    VALUES (OLD.id, OLD.user_id, 'deleted', NULL);
    RETURN OLD;
  END IF;
END;
$$;
