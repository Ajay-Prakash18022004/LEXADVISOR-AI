export const CANONICAL_ADVOCATES = [
  { id: 1, name: 'Adv. Rajeshwar Rao', roll: 'TS/1402/2014', city: 'Hyderabad', specialization: 'High Court of Telangana & City Civil Courts' },
  { id: 2, name: 'Adv. Rajesh Varma', roll: 'TS/1842/2012', city: 'Hyderabad', specialization: 'High Court of Telangana & Hyderabad Civil Courts' },
  { id: 3, name: 'Adv. Ramesh V. Kulkarni', roll: 'TS/1420/2008', city: 'Hyderabad', specialization: 'Commercial Chambers & Corporate Law' },
  { id: 4, name: 'Adv. Priya Sundaram', roll: 'TS/2491/2016', city: 'Hyderabad', specialization: 'TSRERA & Civil Courts' },
  { id: 5, name: 'Adv. Sravani Devi Reddy', roll: 'TS/2890/2014', city: 'Hyderabad', specialization: 'TS High Court & Sub-Registrar Offices' },
  { id: 6, name: 'Adv. P. Srinivasa Rao', roll: 'AP/982/2005', city: 'Visakhapatnam', specialization: 'High Court of Andhra Pradesh & District Courts' },
  { id: 7, name: 'Adv. Ananya Chowdary', roll: 'AP/3412/2016', city: 'Vijayawada', specialization: 'Vijayawada Civil Court & AP High Court' },
  { id: 8, name: 'Adv. Mohammed Tariq Ahmed', roll: 'TS/4102/2012', city: 'Hyderabad', specialization: 'City Civil Court & Commercial Tribunals' },
  { id: 9, name: 'Adv. K. Ananya Reddy', roll: 'TS/3104/2018', city: 'Warangal', specialization: 'Warangal District & Sessions Court' },
  { id: 10, name: 'Adv. K. Venkata Subbaiah', roll: 'AP/1877/2009', city: 'Guntur', specialization: 'Guntur & AP High Court' },
  { id: 11, name: 'Adv. Ch. Murali Krishna', roll: 'TS/5012/2015', city: 'Warangal', specialization: 'Hanamkonda & Warangal Courts' },
  { id: 12, name: 'Adv. B. Haritha', roll: 'AP/2144/2013', city: 'Tirupati', specialization: 'Tirupati District Court & AP High Court' }
];

export const getActiveAdvocateFromStorage = () => {
  const savedId = Number(localStorage.getItem('active_advocate_id')) || 1;
  const match = CANONICAL_ADVOCATES.find(a => a.id === savedId) || CANONICAL_ADVOCATES[0];
  const savedName = localStorage.getItem('active_advocate_name');
  const savedRoll = localStorage.getItem('active_advocate_roll');
  const savedSpec = localStorage.getItem('active_advocate_spec');
  return {
    id: match.id,
    name: savedName || match.name,
    roll: savedRoll || match.roll,
    specialization: savedSpec || match.specialization,
    city: match.city
  };
};

export const getAdvocateInitials = (name) => {
  if (!name) return 'AR';
  const clean = name.replace(/^(Adv\.?|Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  // If first part is like "P." or "K.", take first char of first and first char of second
  const p1 = parts[0].replace('.', '');
  const p2 = parts[1].replace('.', '');
  if (p1 && p2) return (p1[0] + p2[0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
};

