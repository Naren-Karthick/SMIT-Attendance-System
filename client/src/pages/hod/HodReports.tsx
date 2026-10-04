import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { FileSpreadsheet, Download, Printer, Filter, Calendar, BookOpen } from 'lucide-react';

export const HodReports: React.FC = () => {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState('overall');
  const [yearLevel, setYearLevel] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('smit_token');
      let url = `/api/reports/generate?type=${reportType}`;
      if (yearLevel) url += `&year_level=${yearLevel}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, yearLevel]);

  const handleExportCSV = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      showToast('No records to export.', 'error');
      return;
    }

    const keys = Object.keys(reportData.rows[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [keys.join(','), ...reportData.rows.map((row: any) => keys.map(k => `"${row[k] || ''}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report downloaded as CSV file.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Department Reports & Exports</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>
            Official institutional compliance reports, audit exports, and print sheets
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} className="btn btn-outline">
            <Printer size={15} />
            <span>Print View</span>
          </button>
          <button onClick={handleExportCSV} className="btn btn-primary">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          alignItems: 'flex-end'
        }}
      >
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Report Module</label>
          <select
            className="form-control form-select"
            value={reportType}
            onChange={e => setReportType(e.target.value)}
          >
            <option value="overall">Overall Attendance Report</option>
            <option value="student_wise">Student-Wise Ledger</option>
            <option value="od">On-Duty (OD) Log Report</option>
            <option value="leave">Leave Management Report</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Year / Batch</label>
          <select
            className="form-control form-select"
            value={yearLevel}
            onChange={e => setYearLevel(e.target.value)}
          >
            <option value="">All Batches (120 Students)</option>
            <option value="2">2nd Year (3rd Sem)</option>
            <option value="3">3rd Year (5th Sem)</option>
            <option value="4">4th Year (7th Sem)</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">From Date</label>
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">To Date</label>
          <input
            type="date"
            className="form-control"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>

        <div>
          <button
            onClick={generateReport}
            className="btn btn-outline"
            style={{ width: '100%', padding: '9px 12px' }}
          >
            <Filter size={14} />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Report Document Table */}
      <div className="card">
        <div className="card-header" style={{ padding: '14px 20px', background: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0 }}>{reportData?.title || 'Attendance Report'}</h3>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              Sri Muthukumaran Institute of Technology • Department of IT • Generated: {reportData?.generatedAt || new Date().toLocaleString()}
            </div>
          </div>
          <span className="badge badge-approved">
            {reportData?.totalRecords || 0} Records
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Compiling report data...</div>
        ) : !reportData || !reportData.rows || reportData.rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>No records found matching filters.</div>
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  {Object.keys(reportData.rows[0]).map((col, idx) => (
                    <th key={idx} style={{ textTransform: 'capitalize' }}>
                      {col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row: any, i: number) => (
                  <tr key={i}>
                    {Object.keys(row).map((k, j) => (
                      <td key={j}>
                        {k === 'percentage' ? (
                          <strong style={{ color: parseInt(row[k], 10) >= 75 ? '#059669' : '#dc2626' }}>
                            {row[k]}
                          </strong>
                        ) : (
                          row[k] || '—'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
