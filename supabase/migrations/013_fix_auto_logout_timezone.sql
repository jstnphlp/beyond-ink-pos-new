-- Fix timezone bug in auto_logout functions
-- The double AT TIME ZONE produced a bare timestamp that was interpreted as UTC,
-- causing 9PM PHT to be stored as 9PM UTC (= 5AM PHT next day).

CREATE OR REPLACE FUNCTION public.auto_logout_staff()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.staff_sessions
  SET time_out = (CURRENT_DATE + TIME '21:00:00') AT TIME ZONE 'Asia/Manila',
      auto_logged_out = true
  WHERE time_out IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_logout_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.staff_sessions
  SET time_out = (date_trunc('day', time_in AT TIME ZONE 'Asia/Manila') + INTERVAL '21 hours') AT TIME ZONE 'Asia/Manila',
      auto_logged_out = true
  WHERE time_out IS NULL
    AND time_in < (now() - INTERVAL '12 hours');
END;
$$;

-- Fix existing rows where time_out was set to 5AM PHT (next day) instead of 9PM PHT
-- Use time_in to determine the correct day — NOT time_out which is already the next day at 5AM
UPDATE public.staff_sessions
SET time_out = (date_trunc('day', time_in AT TIME ZONE 'Asia/Manila') + INTERVAL '21 hours') AT TIME ZONE 'Asia/Manila'
WHERE auto_logged_out = true;
