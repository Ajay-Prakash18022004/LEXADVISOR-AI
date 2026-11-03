import React, { useState, useEffect } from 'react';
import { getResolvedCases } from '../../api/advocate';

export default function AdvocateResolved() {
  const [resolvedCases, setResolvedCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchResolved = async () => {
      try {
        setLoading(true);
        const data = await getResolvedCases();
        setResolvedCases(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResolved();
  }, []);

  const filtered = resolvedCases.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-emerald-700 text-2xl">task_alt</span>
            <h1 className="font-serif text-2xl font-bold text-on-surface">Resolved Cases Ledger</h1>
          </div>
          <p className="text-xs text-on-surface-variant">
            Archived record of successfully concluded litigations, arbitrations, and negotiated settlements.
          </p>
        </div>
        <div className="text-xs font-semibold text-on-surface-variant bg-surface-container-low border border-surface-container px-3.5 py-1.5 rounded-xl self-start">
          Archive: <strong className="text-emerald-700">{resolvedCases.length} Concluded</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-container-lowest border border-surface-container p-4 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            placeholder="Search resolved cases by number, title, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container font-medium"
        >
          <option value="ALL">All Categories</option>
          <option value="Civil / Property">Civil / Property</option>
          <option value="Tenancy &amp; Rent Control">Tenancy &amp; Rent Control</option>
          <option value="Commercial &amp; Contracts">Commercial &amp; Contracts</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm bg-surface-container-lowest border border-surface-container rounded-2xl">
          Loading archive...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-surface-container rounded-2xl shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">inventory_2</span>
          <h3 className="font-serif text-base font-bold text-on-surface">No Resolved Cases Found</h3>
          <p className="text-xs text-on-surface-variant mt-1">Cases marked as 'Resolved' or 'Closed' in case management appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 hover:shadow-sm transition-all space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {item.case_number}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">· {item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Concluded: {item.resolution_date || 'Resolved'}
                  </span>
                </div>
              </div>

              <h3 className="font-serif text-base font-bold text-on-surface">{item.title}</h3>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">Resolution Summary</span>
                <p className="leading-relaxed text-on-surface">{item.resolution_summary}</p>
              </div>

              <div className="text-xs text-on-surface-variant flex items-center justify-between pt-1 border-t border-surface-container">
                <span>Client: <strong className="text-on-surface">{item.client_name}</strong></span>
                <span>Advocate: <strong className="text-on-surface">{item.advocate_name}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
