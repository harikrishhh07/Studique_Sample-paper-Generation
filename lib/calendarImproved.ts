/**
 * Calendar parsing from local CSV file
 */

import { Month } from 'srm-academia-api';
import fs from 'fs';
import path from 'path';

interface CalendarResult {
  calendar?: Month[];
  error?: string;
  status: number;
}

export async function fetchCalendarImproved(cookie: string): Promise<CalendarResult> {
  try {
    // Read the CSV file from public directory
    const csvPath = path.join(process.cwd(), 'public', 'data', 'Academic_Planner_2026_27_ODD.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    return parseCalendarCSV(csvContent);
  } catch (error: any) {
    console.error('Error reading calendar CSV:', error);
    return {
      calendar: [],
      error: error.message || 'Failed to read calendar',
      status: 500,
    };
  }
}

function parseCalendarCSV(csvContent: string): CalendarResult {
  try {
    const lines = csvContent.trim().split('\n');
    const headerLine = lines[0];
    const dataLines = lines.slice(1);

    // Parse header to extract month names while respecting quoted commas
    // Format: Dt,Day,Jan '26,DO,,Dt,Day,Feb '26,DO,...
    const headers = parseCsvLine(headerLine);
    const months: Month[] = [];

    // Extract month names from header (every 5th column starting from index 2)
    for (let i = 2; i < headers.length; i += 5) {
      const monthName = headers[i];
      if (monthName) {
        months.push({ month: monthName.trim(), days: [] });
      }
    }

    // Parse data rows using the quoted-aware splitter to keep events intact
    dataLines.forEach(line => {
      if (!line.trim()) return;
      const columns = parseCsvLine(line);

      // Process each month's data (5 columns per month)
      months.forEach((month, monthIndex) => {
        const offset = monthIndex * 5;
        if (offset + 3 >= columns.length) return;

        const date = columns[offset];
        if (!date) return;

        const day = columns[offset + 1] || '';
        const event = columns[offset + 2] || '';
        const dayOrder = columns[offset + 3] || '-';

        month.days.push({
          date,
          day,
          event,
          dayOrder,
        });
      });
    });

    return {
      calendar: months,
      status: 200,
    };
  } catch (error) {
    console.error('Error parsing calendar CSV:', error);
    return {
      calendar: [],
      status: 200,
    };
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}
