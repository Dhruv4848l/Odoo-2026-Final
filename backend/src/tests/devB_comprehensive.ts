import express from 'express';
import cors from 'cors';
import identityRoutes from '../modules/identity-employee/identity.routes.js';
import attendanceRoutes from '../modules/attendance-timeoff/attendance.routes.js';
import timeoffRoutes from '../modules/attendance-timeoff/timeoff.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

const API_PREFIX = '/api/v1';
app.use(API_PREFIX, identityRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/timeoff`, timeoffRoutes);

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASSED: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: ${testName}${detail ? ' - ' + detail : ''}`);
    failedCount++;
  }
}

const server = app.listen(5199, async () => {
  console.log('🚀 Starting Dev B Comprehensive Test Suite on port 5199...\n');

  try {
    // ---------------------------------------------------------
    // 1. SETUP & AUTH TOKENS
    // ---------------------------------------------------------
    console.log('1️⃣  AUTHENTICATION & TOKENS');
    const adminLogin: any = await fetch('http://localhost:5199/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@peoplepay360.com', password: 'password123' }),
    }).then(r => r.json());
    assert(adminLogin.success, 'Admin Login', `Token: ${adminLogin.data?.token ? 'OK' : 'MISSING'}`);
    const adminToken = adminLogin.data?.token;

    const empLogin: any = await fetch('http://localhost:5199/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amara.chen@peoplepay360.com', password: 'password123' }),
    }).then(r => r.json());
    assert(empLogin.success, 'Employee (Amara) Login', `Token: ${empLogin.data?.token ? 'OK' : 'MISSING'}`);
    const empToken = empLogin.data?.token;

    // ---------------------------------------------------------
    // 2. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
    // ---------------------------------------------------------
    console.log('\n2️⃣  ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT');

    // 2a. Employee attempting to create a Time Off Type (HR only)
    const empCreateType = await fetch('http://localhost:5199/api/v1/timeoff/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({ name: 'Unauthorized Type', unit: 'Days' }),
    });
    assert(empCreateType.status === 403, 'Employee blocked from creating Time Off Type (403 Forbidden)');

    // 2b. Employee attempting to grant an Allocation (HR only)
    const empGrantAlloc = await fetch('http://localhost:5199/api/v1/timeoff/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({ employee_id: 'emp_amara', time_off_type_id: 'tot_paid', allocated: 5, valid_from: '2026-01-01', valid_until: '2026-12-31' }),
    });
    assert(empGrantAlloc.status === 403, 'Employee blocked from granting Allocations (403 Forbidden)');

    // 2c. Employee attempting to manually correct attendance (HR only)
    const empCorrectAtt = await fetch('http://localhost:5199/api/v1/attendance/att_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({ check_out: '2026-09-01T18:00:00Z', audit_note: 'Employee self edit' }),
    });
    assert(empCorrectAtt.status === 403, 'Employee blocked from manual attendance correction (403 Forbidden)');

    // 2d. Employee attempting to approve a leave request (HR only)
    const empApproveReq = await fetch('http://localhost:5199/api/v1/timeoff/requests/tor_1/approve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(empApproveReq.status === 403, 'Employee blocked from approving leave requests (403 Forbidden)');

    // ---------------------------------------------------------
    // 3. ATTENDANCE ENGINE & EDGE CASES
    // ---------------------------------------------------------
    console.log('\n3️⃣  ATTENDANCE ENGINE & EDGE CASES');

    // 3a. Missing Check-Out Exception Detection (Tested before att_2 is corrected)
    const pastAttList: any = await fetch('http://localhost:5199/api/v1/attendance?has_exception=true', {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json());
    const missingRecord = pastAttList.data?.find((a: any) => a.id === 'att_2');
    assert(Boolean(missingRecord) && missingRecord.status === 'Missing Check-Out', 'Past unclosed attendance flagged as Missing Check-Out exception');

    // 3b. Employee Clock In (Now succeeds even if past date missing check-out exists)
    const clockIn: any = await fetch('http://localhost:5199/api/v1/attendance/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
    }).then(r => r.json());
    assert(clockIn.success && clockIn.data?.check_in, 'Employee Check-In success (unblocked by past missing check-outs)');

    // 3c. Duplicate Clock In prevention for today
    const dupClockIn = await fetch('http://localhost:5199/api/v1/attendance/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    const dupClockInData: any = await dupClockIn.json();
    assert(dupClockIn.status === 400 && dupClockInData.error?.code === 'ALREADY_CHECKED_IN', 'Duplicate Check-In blocked with ALREADY_CHECKED_IN');

    // 3d. Employee Clock Out & Overtime Calculation
    const clockOut: any = await fetch('http://localhost:5199/api/v1/attendance/check-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
    }).then(r => r.json());
    assert(clockOut.success && clockOut.data?.check_out, 'Employee Check-Out success', `Worked: ${clockOut.data?.worked_hours}h`);

    // 3e. Manual Attendance Correction Without Audit Note -> Should Fail
    const noNoteRes = await fetch('http://localhost:5199/api/v1/attendance/att_2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ check_out: '2026-09-02T17:00:00Z', audit_note: '' }),
    });
    const noNoteData: any = await noNoteRes.json();
    assert(noNoteRes.status === 400 && noNoteData.error?.code === 'AUDIT_NOTE_REQUIRED', 'Manual correction without audit note rejected');

    // 3f. Manual Attendance Correction With Audit Note -> Success & Audit Trail
    const correctRes: any = await fetch('http://localhost:5199/api/v1/attendance/att_2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ check_out: '2026-09-02T17:00:00Z', audit_note: 'Verified with manager approval' }),
    }).then(r => r.json());
    assert(correctRes.success && correctRes.data?.is_manual_correction && correctRes.data?.audit_note.includes('Verified with manager approval'), 'Manual correction audit note logged and flag set');

    // ---------------------------------------------------------
    // 4. TIME OFF TYPES & ALLOCATION ENGINE & EDGE CASES
    // ---------------------------------------------------------
    console.log('\n4️⃣  TIME OFF TYPES & ALLOCATION ENGINE');

    // 4a. HR creates new Time Off Type
    const newType: any = await fetch('http://localhost:5199/api/v1/timeoff/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Floating Holiday',
        unit: 'Days',
        requires_allocation: true,
        is_paid: true,
        display_color: '#8B5CF6',
      }),
    }).then(r => r.json());
    assert(newType.success && newType.data?.id, 'HR created Time Off Type (Floating Holiday)');
    const floatTypeId = newType.data?.id;

    // 4b. HR grants Allocation to Amara
    const newAlloc: any = await fetch('http://localhost:5199/api/v1/timeoff/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        employee_id: 'emp_amara',
        time_off_type_id: floatTypeId,
        allocated: 5,
        valid_from: '2026-01-01',
        valid_until: '2026-12-31',
      }),
    }).then(r => r.json());
    assert(newAlloc.success && newAlloc.data?.allocated === 5, 'HR granted 5 Days Floating Holiday Allocation');

    // 4c. Expiry Date Check: Expired Allocation balance must return 0 remaining
    const expiredAlloc: any = await fetch('http://localhost:5199/api/v1/timeoff/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        employee_id: 'emp_amara',
        time_off_type_id: floatTypeId,
        allocated: 10,
        valid_from: '2024-01-01',
        valid_until: '2024-12-31', // Expired
      }),
    }).then(r => r.json());

    const allocList: any = await fetch('http://localhost:5199/api/v1/timeoff/allocations?employee_id=emp_amara', {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json());
    const expiredItem = allocList.data?.find((a: any) => a.id === expiredAlloc.data?.id);
    assert(expiredItem && expiredItem.is_expired && expiredItem.remaining === 0, 'Expired allocation balance resolves to 0 remaining');

    // ---------------------------------------------------------
    // 5. TIME OFF REQUESTS & VALIDATION RULES
    // ---------------------------------------------------------
    console.log('\n5️⃣  TIME OFF REQUESTS & VALIDATION RULES');

    // 5a. Invalid Date Range check (end date before start date)
    const invalidDateReq = await fetch('http://localhost:5199/api/v1/timeoff/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({
        employee_id: 'emp_amara',
        time_off_type_id: floatTypeId,
        start_date: '2026-10-10',
        end_date: '2026-10-01',
        requested_amount: 1,
      }),
    });
    const invalidDateData: any = await invalidDateReq.json();
    assert(invalidDateReq.status === 400 && invalidDateData.error?.code === 'INVALID_DATE_RANGE', 'Leave request with end_date before start_date blocked (INVALID_DATE_RANGE)');

    // 5b. Insufficient Leave Balance check
    const insuffReq = await fetch('http://localhost:5199/api/v1/timeoff/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({
        employee_id: 'emp_amara',
        time_off_type_id: floatTypeId,
        start_date: '2026-10-01',
        end_date: '2026-10-10',
        requested_amount: 10, // Only 5 allocated
      }),
    });
    const insuffReqData: any = await insuffReq.json();
    assert(insuffReq.status === 400 && insuffReqData.error?.code === 'INSUFFICIENT_LEAVE_BALANCE', 'Leave request exceeding available balance blocked (INSUFFICIENT_LEAVE_BALANCE)');

    // 5c. Half-Day / Fractional Unit Request
    const halfDayReq: any = await fetch('http://localhost:5199/api/v1/timeoff/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({
        employee_id: 'emp_amara',
        time_off_type_id: floatTypeId,
        start_date: '2026-10-01',
        end_date: '2026-10-01',
        requested_amount: 0.5,
      }),
    }).then(r => r.json());
    assert(halfDayReq.success && halfDayReq.data?.requested_amount === 0.5, 'Half-day (0.5) leave request created');

    // 5d. Overlapping Leave Request check
    const overlapReq = await fetch('http://localhost:5199/api/v1/timeoff/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({
        employee_id: 'emp_amara',
        time_off_type_id: floatTypeId,
        start_date: '2026-10-01', // Overlaps with half-day request on Oct 01
        end_date: '2026-10-02',
        requested_amount: 2,
      }),
    });
    const overlapReqData: any = await overlapReq.json();
    assert(overlapReq.status === 400 && overlapReqData.error?.code === 'OVERLAPPING_LEAVE_REQUEST', 'Overlapping leave request blocked (OVERLAPPING_LEAVE_REQUEST)');

    // 5e. Approval Workflow & Automatic Balance Deduction
    const initialAllocState = allocList.data?.find((a: any) => a.id === newAlloc.data?.id);
    const initialRemaining = initialAllocState.remaining; // 5

    const approveRes: any = await fetch(`http://localhost:5199/api/v1/timeoff/requests/${halfDayReq.data?.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json());
    assert(approveRes.success && approveRes.data?.status === 'Approved', 'Leave request approved by HR');

    const updatedAllocList: any = await fetch('http://localhost:5199/api/v1/timeoff/allocations?employee_id=emp_amara', {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json());
    const updatedAllocItem = updatedAllocList.data?.find((a: any) => a.id === newAlloc.data?.id);
    assert(updatedAllocItem.taken === 0.5 && updatedAllocItem.remaining === initialRemaining - 0.5, `Allocation balance automatically deducted: ${initialRemaining} -> ${updatedAllocItem.remaining}`);

    // 5f. Refusal Workflow & Balance Restoration
    const refuseRes: any = await fetch(`http://localhost:5199/api/v1/timeoff/requests/${halfDayReq.data?.id}/refuse`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json());
    assert(refuseRes.success && refuseRes.data?.status === 'Refused', 'Leave request refused by HR');

    const restoredAllocList: any = await fetch('http://localhost:5199/api/v1/timeoff/allocations?employee_id=emp_amara', {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(r => r.json());
    const restoredAllocItem = restoredAllocList.data?.find((a: any) => a.id === newAlloc.data?.id);
    assert(restoredAllocItem.taken === 0 && restoredAllocItem.remaining === initialRemaining, `Allocation balance restored upon refusal: ${restoredAllocItem.remaining}`);

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------
    console.log('\n==================================================');
    console.log(`📊 TEST RESULTS SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log('==================================================\n');

  } catch (err: any) {
    console.error('❌ Unexpected test suite failure:', err);
  } finally {
    server.close();
    process.exit(failedCount > 0 ? 1 : 0);
  }
});
