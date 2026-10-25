export function studentTotals(students, attendance, assignments) {
  const totals = new Map(students.map(student => [student._id, {
    student, late: 0, excused: 0, unexcused: 0, unknown: 0,
    attended: 0, marked: 0, submitted: 0, missing: 0, assigned: 0,
  }]));
  for (const session of attendance) for (const record of session.records) {
    const row = totals.get(record.student);
    if (!row || !record.status) continue;
    row.marked++;
    if (record.status === 'Late') row.late++;
    if (['Present', 'Late'].includes(record.status)) row.attended++;
    if (record.status === 'Excused') row.excused++;
    if (record.status === 'Unexcused') row.unexcused++;
    if (record.status === 'Absent') row.unknown++;
  }
  for (const assignment of assignments) for (const record of assignment.records) {
    const row = totals.get(record.student);
    if (!row) continue;
    row.assigned++;
    if (record.submitted) row.submitted++;
    else row.missing++;
  }
  return [...totals.values()];
}

export function filterStudentTotals(rows, {query = '', filter = '', sort = 'name', direction = 'desc'} = {}) {
  const search = query.trim().toLowerCase();
  return rows.filter(row =>
    `${row.student.name} ${row.student.email || ''}`.toLowerCase().includes(search) &&
    (!filter || row[filter] > 0)
  ).sort((a, b) => {
    const nameOrder = a.student.name.localeCompare(b.student.name) || String(a.student._id).localeCompare(String(b.student._id));
    if (sort === 'name') return nameOrder;
    // Students without applicable records are shown last, not ranked as perfect attendance/completion.
    const coverage = ['missing', 'submitted'].includes(sort) ? 'assigned' : 'marked';
    if (!!a[coverage] !== !!b[coverage]) return a[coverage] ? -1 : 1;
    return (direction === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]) || nameOrder;
  });
}
