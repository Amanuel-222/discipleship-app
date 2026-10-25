import React, {useMemo, useState} from 'react';
import {studentTotals, filterStudentTotals} from './studentTotals.js';

export default function StudentTotals({kind, students, attendance, assignments, topic, onStudent}) {
  const isAttendance = kind === 'attendance';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState(isAttendance ? 'late' : 'missing');
  const [direction, setDirection] = useState('desc');
  const totals = useMemo(() => studentTotals(students, attendance, assignments), [students, attendance, assignments]);
  const rows = filterStudentTotals(totals, {query, filter, sort, direction});
  const metrics = isAttendance
    ? [['late', 'Late arrivals'], ['unexcused', 'Unexcused absences'], ['excused', 'Excused absences'], ['unknown', 'Absences: reason unknown'], ['attended', 'Sessions attended']]
    : [['missing', 'Not submitted'], ['submitted', 'Submitted']];
  const columns = isAttendance
    ? [['late', 'Late'], ['unexcused', 'Unexcused'], ['excused', 'Excused'], ['unknown', 'Reason unknown'], ['attended', 'Attended']]
    : [['missing', 'Not submitted'], ['submitted', 'Submitted'], ['assigned', 'Assigned']];
  const reset = () => {setQuery(''); setFilter(''); setSort(isAttendance ? 'late' : 'missing'); setDirection('desc');};
  return <details className="panel student-totals">
    <summary><span><strong>Student totals</strong><small>Filter &amp; sort · {isAttendance ? 'All sessions' : topic || 'All assignment sections'}</small></span></summary>
    <div className="totals-controls">
      <label className="field">Search students<input type="search" value={query} placeholder="Name or email" onChange={e => setQuery(e.target.value)}/></label>
      <label className="field">Show<select value={filter} onChange={e => setFilter(e.target.value)}><option value="">All students</option>{metrics.map(([key, label]) => <option key={key} value={key}>{label}: at least one</option>)}</select></label>
      <label className="field">Sort by<select value={sort} onChange={e => setSort(e.target.value)}>{metrics.map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="name">Student name (A–Z)</option></select></label>
      <label className="field">Order<select value={direction} disabled={sort === 'name'} onChange={e => setDirection(e.target.value)}><option value="desc">Most to least</option><option value="asc">Least to most</option></select></label>
      <button className="text-button" onClick={reset}>Reset</button>
    </div>
    <p className="totals-description">{isAttendance ? 'Counts across all saved sessions. Late counts as attended; unmarked attendance is excluded.' : 'Counts across the selected assignment section, including work not yet due. Only assignments on each student’s roster are counted.'}</p>
    <div className="table-wrap"><table><caption className="sr-only">{isAttendance ? 'Attendance' : 'Assignment'} totals by student</caption><thead><tr><th scope="col">Student</th>{columns.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.student._id}><th scope="row"><button className="student-link" onClick={() => onStudent(row.student._id)}>{row.student.name}</button></th>{columns.map(([key]) => <td key={key}>{row[isAttendance ? 'marked' : 'assigned'] ? row[key] : '—'}</td>)}</tr>)}</tbody></table></div>
    {!rows.length && <p className="panel-empty">No students match these filters.</p>}
    <p className="metric-note" role="status">Showing {rows.length} of {students.length} students. A dash means no recorded {isAttendance ? 'attendance' : 'assignments'}.</p>
  </details>;
}
