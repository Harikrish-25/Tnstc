import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DieselLog {
  id: string;
  date_time: string;
  vehicle_no: string;
  route_no: string;
  staff_no: string;
  driver_name: string;
  kilometers_driven: number;
  diesel_litres: number;
  kmpl: number;
  created_at: string;
}

function App() {
  const [dateTime, setDateTime] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [routeNo, setRouteNo] = useState('');
  const [staffNo, setStaffNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [dieselLitres, setDieselLitres] = useState('');
  const [kmpl, setKmpl] = useState('0.00');
  const [logs, setLogs] = useState<DieselLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);

    fetchLogs();

    const channel = supabase
      .channel('diesel_logs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'diesel_logs' },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const km = parseFloat(kilometers) || 0;
    const litres = parseFloat(dieselLitres) || 0;

    if (litres > 0) {
      const calculatedKmpl = km / litres;
      setKmpl(calculatedKmpl.toFixed(2));
    } else {
      setKmpl('0.00');
    }
  }, [kilometers, dieselLitres]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('diesel_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('diesel_logs').insert([
      {
        date_time: new Date(dateTime).toISOString(),
        vehicle_no: vehicleNo,
        route_no: routeNo,
        staff_no: staffNo,
        driver_name: driverName,
        kilometers_driven: parseFloat(kilometers),
        diesel_litres: parseFloat(dieselLitres),
        kmpl: parseFloat(kmpl),
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      alert('Error saving entry: ' + error.message);
    } else {
      setVehicleNo('');
      setRouteNo('');
      setStaffNo('');
      setDriverName('');
      setKilometers('');
      setDieselLitres('');
      setKmpl('0.00');

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);

      await fetchLogs();
    }
  };

  const exportToCSV = async () => {
    const { data, error } = await supabase
      .from('diesel_logs')
      .select('*')
      .order('date_time', { ascending: true });

    if (error) {
      alert('Error exporting data: ' + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Date & Time',
      'Vehicle No',
      'Route No',
      'Staff No',
      'Driver Name',
      'Kilometers Driven',
      'Diesel (Litres)',
      'KMPL',
    ];

    const csvRows = [headers.map((h) => `"${h}"`).join(',')];

    data.forEach((log) => {
      const row = [
        `"${new Date(log.date_time).toLocaleString('en-IN')}"`,
        `"${log.vehicle_no}"`,
        `"${log.route_no}"`,
        `"${log.staff_no}"`,
        `"${log.driver_name}"`,
        log.kilometers_driven,
        log.diesel_litres,
        log.kmpl,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TNSTC_Diesel_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">TNSTC Diesel Log</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Fuel Station Management System</p>
            </div>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap text-sm sm:text-base"
            >
              Export to CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2 sm:pb-3">
                New Diesel Entry
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Vehicle No.
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="e.g., TN 68 N 1234"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Route No.
                  </label>
                  <input
                    type="text"
                    value={routeNo}
                    onChange={(e) => setRouteNo(e.target.value)}
                    placeholder="e.g., 10A"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Staff No.
                  </label>
                  <input
                    type="text"
                    value={staffNo}
                    onChange={(e) => setStaffNo(e.target.value)}
                    placeholder="e.g., 10DR051"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g., K. Raju"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Kilometers Driven
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={kilometers}
                    onChange={(e) => setKilometers(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                    Volume of Diesel (Litres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={dieselLitres}
                    onChange={(e) => setDieselLitres(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  />
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      Calculated KMPL:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-700">{kmpl}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {isSubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2 sm:pb-3">
                Recent Log Entries
              </h2>

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full px-4 sm:px-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold rounded-tl-lg whitespace-nowrap">
                          Date/Time
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold whitespace-nowrap">
                          Vehicle
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold whitespace-nowrap">
                          Route
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold whitespace-nowrap">
                          Staff
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold whitespace-nowrap">
                          Driver
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">
                          KMs
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">
                          Diesel (L)
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold rounded-tr-lg whitespace-nowrap">
                          KMPL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-2 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                            No entries yet. Start by adding a new diesel entry.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log, index) => (
                          <tr
                            key={log.id}
                            className={`border-b ${
                              index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            } hover:bg-blue-50 transition-colors`}
                          >
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">
                              {formatDateTime(log.date_time)}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-gray-900 whitespace-nowrap">
                              {log.vehicle_no}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 font-semibold whitespace-nowrap">
                              {log.route_no}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 font-semibold whitespace-nowrap">
                              {log.staff_no}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap">
                              {log.driver_name}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-700 whitespace-nowrap">
                              {log.kilometers_driven}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-700 whitespace-nowrap">
                              {log.diesel_litres}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-green-700 whitespace-nowrap">
                              {log.kmpl}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
