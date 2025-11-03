import { startOfToday, startOfTomorrow } from "date-fns";
import { useCallback, useEffect, useState } from "react";

export const useTodayDate = () => {
  const [currentDate, setCurrentDate] = useState(() => startOfToday());
  const refreshDate = useCallback(() => setCurrentDate(startOfToday()), []);

  useEffect(() => {
    const handle = setTimeout(() => refreshDate(), +startOfTomorrow() - Date.now());
    return () => clearTimeout(handle);
  }, [currentDate, refreshDate]);

  return currentDate;
};
