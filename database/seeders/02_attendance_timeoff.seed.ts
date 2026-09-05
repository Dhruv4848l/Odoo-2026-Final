import { query } from '../../backend/src/core/db';

export async function seedAttendanceAndTimeOff() {
  console.log('Seeding Attendance & Time Off records...');

  // Time Off Type
  const typeRes = await query(`
    INSERT INTO time_off_types (name, unit, requires_allocation, approval_workflow, is_paid, display_color)
    VALUES ('Paid Parental Leave', 'Days', true, 'Manager', true, '#3B82F6')
    RETURNING id
  `);
  const typeId = typeRes.rows[0]?.id || 1;

  // Time Off Allocation
  await query(`
    INSERT INTO time_off_allocations (employee_id, time_off_type_id, allocated, taken, valid_from, valid_until)
    VALUES (1, $1, 15, 5, '2026-01-01', '2026-12-31')
  `, [typeId]);

  // Approved Time Off Request for September
  await query(`
    INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, requested_amount, status)
    VALUES (1, $1, '2026-09-10', '2026-09-14', 5, 'Approved')
  `);
}
