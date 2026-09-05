import { pool } from '../core/db';

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Alex', 'Amara', 'Arjun', 'Benjamin', 'Bhavna', 'Carlos', 'Chloe', 'Daniel',
  'David', 'Dev', 'Diya', 'Elena', 'Emily', 'Ethan', 'Fatima', 'Gabriel', 'Grace', 'Hannah',
  'Haruki', 'Ibrahim', 'Ishaan', 'Jack', 'James', 'Jasmine', 'John', 'Jordan', 'Julia', 'Kavita',
  'Liam', 'Lucas', 'Maya', 'Meera', 'Michael', 'Mina', 'Nathan', 'Neha', 'Noah', 'Olivia',
  'Pooja', 'Priya', 'Rahul', 'Rohan', 'Samantha', 'Sarah', 'Siddharth', 'Sophia', 'Tanvi', 'Vikram'
];

const LAST_NAMES = [
  'Agarwal', 'Alvarez', 'Anderson', 'Banerjee', 'Brown', 'Chen', 'Choudhury', 'Clark', 'Das', 'Davis',
  'Deshmukh', 'Diaz', 'Garcia', 'Gupta', 'Harris', 'Iyer', 'Jackson', 'Johnson', 'Joshi', 'Kapoor',
  'Khan', 'Kim', 'Kulkarni', 'Kumar', 'Lee', 'Martin', 'Mehta', 'Miller', 'Mishra', 'Mukherjee',
  'Nair', 'Patel', 'Rao', 'Reddy', 'Robinson', 'Rodriguez', 'Rostova', 'Sato', 'Sharma', 'Singh',
  'Smith', 'Taylor', 'Thomas', 'Vance', 'Varma', 'Walker', 'White', 'Williams', 'Wilson', 'Zhang'
];

const POSITIONS = [
  { title: 'Frontend Engineer', dept: 'dept_eng', struct: 'struct_1' },
  { title: 'Backend Engineer', dept: 'dept_eng', struct: 'struct_1' },
  { title: 'Full Stack Architect', dept: 'dept_eng', struct: 'struct_2' },
  { title: 'DevOps & SRE Specialist', dept: 'dept_eng', struct: 'struct_1' },
  { title: 'QA Automation Engineer', dept: 'dept_1788611765232', struct: 'struct_1' },
  { title: 'QA Lead', dept: 'dept_1788611765232', struct: 'struct_2' },
  { title: 'Sales Account Executive', dept: 'dept_sales', struct: 'struct_3' },
  { title: 'Sales Development Rep', dept: 'dept_sales', struct: 'struct_3' },
  { title: 'Enterprise Account Manager', dept: 'dept_sales', struct: 'struct_3' },
  { title: 'HR Generalist', dept: 'dept_hr', struct: 'struct_1' },
  { title: 'Talent Acquisition Partner', dept: 'dept_hr', struct: 'struct_1' },
  { title: 'People Operations Specialist', dept: 'dept_hr', struct: 'struct_1' },
  { title: 'Financial Analyst', dept: 'dept_finance', struct: 'struct_1' },
  { title: 'Payroll Accountant', dept: 'dept_finance', struct: 'struct_1' },
  { title: 'Senior Controller', dept: 'dept_finance', struct: 'struct_2' },
  { title: 'IT Systems Administrator', dept: 'dept_it', struct: 'struct_1' },
  { title: 'Operations Coordinator', dept: 'dept_ops', struct: 'struct_1' }
];

const BANKS = [
  { name: 'HDFC Bank', ifsc: 'HDFC0001024' },
  { name: 'ICICI Bank', ifsc: 'ICIC0000450' },
  { name: 'State Bank of India', ifsc: 'SBIN0000842' },
  { name: 'Axis Bank', ifsc: 'UTIB0000115' },
  { name: 'JPMorgan Chase', ifsc: 'CHASUS33XXX' },
  { name: 'Standard Chartered', ifsc: 'SCBL0036001' }
];

// Helper to chunk arrays for bulk operations
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function seed200Users() {
  const startTime = Date.now();
  console.log('🚀 [Seed 200 Users] Starting high-efficiency Supabase batch seeding...');

  const client = await pool.connect();

  try {
    // 1. Ensure auxiliary departments exist
    console.log('📦 Step 1: Ensuring departments exist...');
    await client.query(`
      INSERT INTO departments (id, name, code)
      VALUES 
        ('dept_it', 'Information Technology', 'IT'),
        ('dept_ops', 'Operations & Logistics', 'OPS')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Generate 200 Employees
    console.log('👥 Step 2: Generating 200 Employee profiles and accounts...');
    const employeesData: any[] = [];
    const usersData: any[] = [];
    const contractsData: any[] = [];
    const timeOffAllocationsData: any[] = [];

    for (let i = 1; i <= 200; i++) {
      const padIndex = String(i).padStart(3, '0');
      const empId = `emp_${padIndex}`;
      const usrId = `usr_${padIndex}`;

      const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[Math.floor((i - 1) / FIRST_NAMES.length) % LAST_NAMES.length] || LAST_NAMES[i % LAST_NAMES.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${padIndex}@peoplepay360.com`;
      const posObj = POSITIONS[(i - 1) % POSITIONS.length];
      const bank = BANKS[(i - 1) % BANKS.length];

      // Role distribution:
      // 1-5: admin (5 admins)
      // 6-15: hr_manager (10 HR Managers)
      // 16-25: hr_payroll_manager (10 Payroll Managers)
      // 26-35: hr_payroll_user (10 Payroll Users)
      // 36-200: employee (165 Employees)
      let roleId = 'employee';
      if (i <= 5) roleId = 'admin';
      else if (i <= 15) roleId = 'hr_manager';
      else if (i <= 25) roleId = 'hr_payroll_manager';
      else if (i <= 35) roleId = 'hr_payroll_user';

      const hireYear = 2021 + (i % 4);
      const hireMonth = String(1 + (i % 12)).padStart(2, '0');
      const hireDay = String(1 + (i % 25)).padStart(2, '0');
      const hireDate = `${hireYear}-${hireMonth}-${hireDay}`;

      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firstName + '_' + lastName + '_' + padIndex)}`;

      employeesData.push({
        id: empId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: `+1 555-${String(100 + i).padStart(4, '0')}`,
        job_position: posObj.title,
        department_id: posObj.dept,
        manager_id: 'emp_admin',
        working_schedule_id: 'sched_std_40h',
        status: i % 25 === 0 ? 'on_leave' : 'active',
        private_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${padIndex}.pvt@gmail.com`,
        bank_account: bank.name,
        hire_date: hireDate,
        date_of_joining: hireDate,
        bank_account_number: `987000${padIndex}821`,
        bank_name: bank.name,
        bank_ifsc: bank.ifsc,
        avatar_url: avatarUrl
      });

      usersData.push({
        id: usrId,
        email: email,
        password_hash: 'password123',
        password: 'password123',
        role_id: roleId,
        employee_id: empId,
        is_active: true
      });

      // Contract Distribution Requirement:
      // "some has past, some has past and current, some has nothing"
      // Let's divide into 4 equal groups:
      // Group A (i % 4 === 1): Past Only (status = 'close', start_date = 2022-01-15, end_date = 2024-05-31)
      // Group B (i % 4 === 2): Past AND Current (1 closed contract + 1 active running contract)
      // Group C (i % 4 === 3): Current Only (status = 'running', start_date = 2024-06-01, end_date = NULL)
      // Group D (i % 4 === 0): Nothing (0 contracts)

      const baseWage = 4000 + (i * 35);

      if (i % 4 === 1) {
        // PAST ONLY
        contractsData.push({
          id: `ct_${empId}_past`,
          contract_ref: `CNT-${padIndex}-HIST`,
          contract_name: `Previous Employment Contract - ${firstName} ${lastName}`,
          employee_id: empId,
          job_position: posObj.title,
          wage: baseWage,
          start_date: '2022-01-15',
          end_date: '2024-05-31',
          status: 'close',
          working_schedule_id: 'sched_std_40h',
          salary_structure_id: posObj.struct,
          notes: 'Completed full-term contract. Replaced or archived.'
        });
      } else if (i % 4 === 2) {
        // PAST AND CURRENT
        // 1. Past closed contract
        contractsData.push({
          id: `ct_${empId}_past`,
          contract_ref: `CNT-${padIndex}-V1`,
          contract_name: `Initial Contract (Junior) - ${firstName} ${lastName}`,
          employee_id: empId,
          job_position: `Associate ${posObj.title}`,
          wage: baseWage - 1200,
          start_date: '2022-03-01',
          end_date: '2023-12-31',
          status: 'close',
          working_schedule_id: 'sched_std_40h',
          salary_structure_id: posObj.struct,
          notes: 'Promoted to regular role at end of 2023.'
        });
        // 2. Current running contract
        contractsData.push({
          id: `ct_${empId}_curr`,
          contract_ref: `CNT-${padIndex}-V2`,
          contract_name: `Active Employment Contract - ${firstName} ${lastName}`,
          employee_id: empId,
          job_position: posObj.title,
          wage: baseWage + 800,
          start_date: '2024-01-01',
          end_date: null,
          status: 'running',
          working_schedule_id: 'sched_std_40h',
          salary_structure_id: posObj.struct,
          notes: 'Active standard employment contract.'
        });

        // Add leave allocations for active employees
        timeOffAllocationsData.push(
          {
            id: `toa_${empId}_pto`,
            employee_id: empId,
            time_off_type_id: 'tot_paid',
            allocated: 20,
            taken: (i % 5),
            valid_from: '2026-01-01',
            valid_until: '2026-12-31'
          },
          {
            id: `toa_${empId}_sick`,
            employee_id: empId,
            time_off_type_id: 'tot_sick',
            allocated: 10,
            taken: (i % 3),
            valid_from: '2026-01-01',
            valid_until: '2026-12-31'
          }
        );
      } else if (i % 4 === 3) {
        // CURRENT ONLY
        contractsData.push({
          id: `ct_${empId}_curr`,
          contract_ref: `CNT-${padIndex}-ACT`,
          contract_name: `Employment Agreement - ${firstName} ${lastName}`,
          employee_id: empId,
          job_position: posObj.title,
          wage: baseWage,
          start_date: '2024-06-01',
          end_date: null,
          status: 'running',
          working_schedule_id: 'sched_std_40h',
          salary_structure_id: posObj.struct,
          notes: 'Current regular employment contract.'
        });

        // Add leave allocations for active employees
        timeOffAllocationsData.push(
          {
            id: `toa_${empId}_pto`,
            employee_id: empId,
            time_off_type_id: 'tot_paid',
            allocated: 20,
            taken: (i % 4),
            valid_from: '2026-01-01',
            valid_until: '2026-12-31'
          },
          {
            id: `toa_${empId}_sick`,
            employee_id: empId,
            time_off_type_id: 'tot_sick',
            allocated: 10,
            taken: (i % 2),
            valid_from: '2026-01-01',
            valid_until: '2026-12-31'
          }
        );
      } else {
        // i % 4 === 0: NOTHING (0 contracts)
        // No contracts added!
      }
    }

    // 3. Perform Efficient Batch Multi-row Inserts
    console.log(`💾 Step 3: Batch inserting ${employeesData.length} employees...`);
    const empChunks = chunkArray(employeesData, 50);
    for (const chunk of empChunks) {
      const values: any[] = [];
      const valueStrings: string[] = [];
      chunk.forEach((emp, idx) => {
        const offset = idx * 16;
        valueStrings.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`
        );
        values.push(
          emp.id, emp.first_name, emp.last_name, emp.email, emp.phone, emp.job_position,
          emp.department_id, emp.manager_id, emp.working_schedule_id, emp.status,
          emp.private_email, emp.bank_account, emp.hire_date,
          emp.bank_account_number, emp.bank_name, emp.avatar_url
        );
      });

      const sql = `
        INSERT INTO employees (
          id, first_name, last_name, email, phone, job_position,
          department_id, manager_id, working_schedule_id, status,
          private_email, bank_account, hire_date,
          bank_account_number, bank_name, avatar_url
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          email = EXCLUDED.email,
          job_position = EXCLUDED.job_position,
          avatar_url = EXCLUDED.avatar_url;
      `;
      await client.query(sql, values);
    }
    console.log('✅ 200 Employees inserted/updated.');

    console.log(`💾 Step 4: Batch inserting ${usersData.length} users...`);
    const userChunks = chunkArray(usersData, 50);
    for (const chunk of userChunks) {
      const values: any[] = [];
      const valueStrings: string[] = [];
      chunk.forEach((usr, idx) => {
        const offset = idx * 7;
        valueStrings.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
        );
        values.push(
          usr.id, usr.email, usr.password_hash, usr.password, usr.role_id, usr.employee_id, usr.is_active
        );
      });

      const sql = `
        INSERT INTO users (
          id, email, password_hash, password, role_id, employee_id, is_active
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role_id = EXCLUDED.role_id,
          password = EXCLUDED.password,
          password_hash = EXCLUDED.password_hash;
      `;
      await client.query(sql, values);
    }
    console.log('✅ 200 Users inserted/updated.');

    console.log(`💾 Step 5: Batch inserting ${contractsData.length} contracts...`);
    const contractChunks = chunkArray(contractsData, 50);
    for (const chunk of contractChunks) {
      const values: any[] = [];
      const valueStrings: string[] = [];
      chunk.forEach((c, idx) => {
        const offset = idx * 11;
        valueStrings.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`
        );
        values.push(
          c.id, c.contract_ref, c.contract_name, c.employee_id, c.job_position,
          c.wage, c.start_date, c.end_date, c.status, c.working_schedule_id, c.salary_structure_id
        );
      });

      const sql = `
        INSERT INTO contracts (
          id, contract_ref, contract_name, employee_id, job_position,
          wage, start_date, end_date, status, working_schedule_id, salary_structure_id
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          wage = EXCLUDED.wage,
          status = EXCLUDED.status,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date;
      `;
      await client.query(sql, values);
    }
    console.log(`✅ ${contractsData.length} Contracts inserted/updated.`);

    console.log(`💾 Step 6: Batch inserting ${timeOffAllocationsData.length} time off allocations...`);
    const toaChunks = chunkArray(timeOffAllocationsData, 50);
    for (const chunk of toaChunks) {
      const values: any[] = [];
      const valueStrings: string[] = [];
      chunk.forEach((toa, idx) => {
        const offset = idx * 7;
        valueStrings.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
        );
        values.push(
          toa.id, toa.employee_id, toa.time_off_type_id, toa.allocated,
          toa.taken, toa.valid_from, toa.valid_until
        );
      });

      const sql = `
        INSERT INTO time_off_allocations (
          id, employee_id, time_off_type_id, allocated, taken, valid_from, valid_until
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          allocated = EXCLUDED.allocated,
          taken = EXCLUDED.taken;
      `;
      await client.query(sql, values);
    }
    console.log(`✅ ${timeOffAllocationsData.length} Time off allocations inserted/updated.`);

    // 4. Print Summary Verification
    const usersCount = await client.query('SELECT count(*) FROM users;');
    const employeesCount = await client.query('SELECT count(*) FROM employees;');
    const contractStats = await client.query('SELECT status, count(*) FROM contracts GROUP BY status;');
    const zeroContractStats = await client.query(`
      SELECT count(*) FROM employees e
      LEFT JOIN contracts c ON e.id = c.employee_id
      WHERE c.id IS NULL;
    `);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================ SEEDING COMPLETE ================');
    console.log(`⏱️ Total Time Elapsed: ${duration}s`);
    console.log(`👤 Total Users in Supabase: ${usersCount.rows[0].count}`);
    console.log(`👔 Total Employees in Supabase: ${employeesCount.rows[0].count}`);
    console.log('📄 Contracts Breakdown by Status:', contractStats.rows);
    console.log(`🚫 Employees with 0 Contracts (Nothing): ${zeroContractStats.rows[0].count}`);
    console.log('===================================================\n');

  } catch (err) {
    console.error('❌ [Seed 200 Users Error]:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Auto-run if executed directly
seed200Users().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
