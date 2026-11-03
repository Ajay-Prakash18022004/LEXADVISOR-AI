import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { advocatesApi } from '../api/client';
import { getAdvocateSlots } from '../api/advocate';
import EmailSettingsModal from '../components/EmailSettingsModal';

export const ADVOCATE_GENDER_PHOTOS = {
  // Male Advocates
  1: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400', // Adv. Rajeshwar Rao
  2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', // Adv. Rajesh Varma
  3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', // Adv. Ramesh V. Kulkarni
  6: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400', // Adv. P. Srinivasa Rao
  8: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400', // Adv. Mohammed Tariq Ahmed
  10: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', // Adv. K. Venkata Subbaiah
  11: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', // Adv. Ch. Murali Krishna

  // Female Advocates
  4: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', // Adv. Priya Sundaram
  5: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400', // Adv. Sravani Devi Reddy
  7: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400', // Adv. Ananya Chowdary
  9: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', // Adv. K. Ananya Reddy
  12: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', // Adv. B. Haritha
};

export const getPhotoForAdvocate = (advId, advName = '', fallback = null) => {
  if (ADVOCATE_GENDER_PHOTOS[advId]) return ADVOCATE_GENDER_PHOTOS[advId];
  const n = String(advName || '').toLowerCase();
  if (n.includes('priya')) return ADVOCATE_GENDER_PHOTOS[4];
  if (n.includes('sravani')) return ADVOCATE_GENDER_PHOTOS[5];
  if (n.includes('chowdary') || (n.includes('ananya') && n.includes('ap'))) return ADVOCATE_GENDER_PHOTOS[7];
  if (n.includes('ananya')) return ADVOCATE_GENDER_PHOTOS[9];
  if (n.includes('haritha')) return ADVOCATE_GENDER_PHOTOS[12];
  if (n.includes('rajeshwar')) return ADVOCATE_GENDER_PHOTOS[1];
  if (n.includes('varma')) return ADVOCATE_GENDER_PHOTOS[2];
  if (n.includes('kulkarni')) return ADVOCATE_GENDER_PHOTOS[3];
  if (n.includes('srinivasa')) return ADVOCATE_GENDER_PHOTOS[6];
  if (n.includes('tariq')) return ADVOCATE_GENDER_PHOTOS[8];
  if (n.includes('subbaiah')) return ADVOCATE_GENDER_PHOTOS[10];
  if (n.includes('murali')) return ADVOCATE_GENDER_PHOTOS[11];
  return fallback || ADVOCATE_GENDER_PHOTOS[1];
};

export default function AdvocateDirectory({ initialTab = 'directory' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentDocument } = useDocument();
  const { user } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamic Dates
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  const dayAfter = new Date(now);
  dayAfter.setDate(now.getDate() + 2);
  const dayAfterStr = dayAfter.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [bookingConfirmedData, setBookingConfirmedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Booking form fields
  const [consultFormat, setConsultFormat] = useState('video'); // 'video' | 'in_person' | 'written'
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('11:30 AM');
  const [dynamicSlots, setDynamicSlots] = useState(['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:30 PM']);
  const [attachDocBrief, setAttachDocBrief] = useState(true);
  const [clientName, setClientName] = useState(user?.name || 'Syed Amanullah');
  const [clientEmail, setClientEmail] = useState(user?.email || 'sureshtakur194@gmail.com');
  const [clientPhone, setClientPhone] = useState(user?.phone || '+91 98490 11223');
  const [caseSubject, setCaseSubject] = useState('');
  const [caseNotes, setCaseNotes] = useState('');

  // Pre-seed case subject if document is present
  useEffect(() => {
    if (currentDocument?.title) {
      setCaseSubject(`Statutory Review & Remediation for ${currentDocument.title}`);
    } else {
      setCaseSubject('Tenancy Agreement & Stamp Admissibility Counsel');
    }
  }, [currentDocument]);

  // Advocates Master List (All verified advocate profiles)
  const [advocatesList, setAdvocatesList] = useState([
    {
      id: 1,
      name: 'Adv. Rajeshwar Rao',
      roll: 'TS/1402/2014',
      bar: 'Bar Council of Telangana',
      court: 'High Court of Telangana & City Civil Courts',
      experience: '12 Years Practice',
      rating: '4.9',
      reviews: 142,
      specialization: 'Civil, Property & Real Estate Litigation, Tenancy Agreements',
      city: 'Hyderabad',
      fee: 1500,
      feeInPerson: 2500,
      earliest: 'Available Today',
      bio: 'Designated civil counsel appearing before High Court of Telangana and City Civil Courts. Specializes in tenancy dispute injunctions, commercial lease drafting, and stamp duty regularization.',
      image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 2,
      name: 'Adv. Rajesh Varma',
      roll: 'TS/1842/2012',
      bar: 'Bar Council of Telangana',
      court: 'High Court of Telangana & Hyderabad Civil Courts',
      experience: '14 Years Practice',
      rating: '4.9',
      reviews: 138,
      specialization: 'Tenancy & Lease Disputes, Stamp Adjudication, Eviction Defense',
      city: 'Hyderabad',
      fee: 1500,
      feeInPerson: 2500,
      earliest: 'Available Today',
      bio: 'Senior property counsel with 14+ years of court representation. Authority on contract enforceability, indemnity covenants, and Section 106 eviction notices.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 3,
      name: 'Adv. Ramesh V. Kulkarni',
      roll: 'TS/1420/2008',
      bar: 'Bar Council of Telangana',
      court: 'High Court & Commercial Chambers',
      experience: '16 Years Practice',
      rating: '4.9',
      reviews: 148,
      specialization: 'Contract & Corporate Law, Commercial Tenancy, Dispute Resolution',
      city: 'Hyderabad',
      fee: 1800,
      feeInPerson: 2800,
      earliest: 'Available Today',
      bio: 'Corporate agreements and commercial lease authority. Frequent counsel in high-value industrial tenancy arbitrations and revenue stamp audits.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 4,
      name: 'Adv. Priya Sundaram',
      roll: 'TS/2491/2016',
      bar: 'Bar Council of Telangana',
      court: 'TSRERA & Civil Courts',
      experience: '9 Years Practice',
      rating: '4.8',
      reviews: 94,
      specialization: 'RERA Compliance, Commercial Leases, Deposit Recovery',
      city: 'Hyderabad',
      fee: 1200,
      feeInPerson: 2000,
      earliest: 'Available Tomorrow',
      bio: 'Leading practitioner before TSRERA Appellate Tribunal and District Consumer Commissions. Proven track record in security deposit recovery and tenant rights protection.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 5,
      name: 'Adv. Sravani Devi Reddy',
      roll: 'TS/2890/2014',
      bar: 'Bar Council of Telangana',
      court: 'Telangana High Court & Sub-Registrar Offices',
      experience: '11 Years Practice',
      rating: '4.8',
      reviews: 112,
      specialization: 'Real Estate & Stamp Duty Litigation, Title Verification',
      city: 'Hyderabad',
      fee: 1500,
      feeInPerson: 2200,
      earliest: 'Available Today',
      bio: 'Expert in Indian Stamp Act Section 35 adjudication, lease registration compliance, and revenue appeals. Represents corporate clients and individual lessees.',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 6,
      name: 'Adv. P. Srinivasa Rao',
      roll: 'AP/982/2005',
      bar: 'Bar Council of Andhra Pradesh',
      court: 'High Court of Andhra Pradesh & District Courts',
      experience: '19 Years Practice',
      rating: '4.9',
      reviews: 176,
      specialization: 'Civil Disputes, Contract Enforcement, Stamp Act Matters',
      city: 'Visakhapatnam',
      fee: 1800,
      feeInPerson: 2800,
      earliest: 'Available Tomorrow',
      bio: 'Senior civil advocate with 19 years of dedicated practice before the High Court of AP. Frequent counsel in landmark revenue suits and property litigation.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 7,
      name: 'Adv. Ananya Chowdary',
      roll: 'AP/3412/2016',
      bar: 'Bar Council of Andhra Pradesh',
      court: 'Vijayawada Civil Court & AP High Court',
      experience: '9 Years Practice',
      rating: '4.7',
      reviews: 85,
      specialization: 'Commercial Arbitration, Legal Notices, Eviction Defense',
      city: 'Vijayawada',
      fee: 1400,
      feeInPerson: 2000,
      earliest: 'Available Today',
      bio: 'Specialist in swift legal notices under Section 106 Transfer of Property Act, eviction defense proceedings, and summary civil suits.',
      image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 8,
      name: 'Adv. Mohammed Tariq Ahmed',
      roll: 'TS/4102/2012',
      bar: 'Bar Council of Telangana',
      court: 'City Civil Court & Commercial Tribunals',
      experience: '13 Years Practice',
      rating: '4.8',
      reviews: 104,
      specialization: 'Commercial Agreements, Employment Law, Lease Vetting',
      city: 'Hyderabad',
      fee: 1500,
      feeInPerson: 2200,
      earliest: 'Available Tomorrow',
      bio: 'Commercial contracts expert with extensive background in vetting master services agreements, residential lease covenants, and arbitral notices.',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 9,
      name: 'Adv. K. Ananya Reddy',
      roll: 'TS/3104/2018',
      bar: 'Bar Council of Telangana',
      court: 'Warangal District & Sessions Court',
      experience: '7 Years Practice',
      rating: '4.7',
      reviews: 62,
      specialization: 'Model Tenancy Act 2021, Notice Drafting, Rent Petitions',
      city: 'Warangal',
      fee: 1000,
      feeInPerson: 1800,
      earliest: 'Available Today',
      bio: 'High energy litigation practitioner focusing on expeditious tenancy tribunal filings, registered post notice dispatch, and bailiff verifications.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 10,
      name: 'Adv. K. Venkata Subbaiah',
      roll: 'AP/1877/2009',
      bar: 'Bar Council of Andhra Pradesh',
      court: 'Guntur & AP High Court',
      experience: '15 Years Practice',
      rating: '4.6',
      reviews: 78,
      specialization: 'Property Registration & Stamp Act Matters, Lease Deeds',
      city: 'Guntur',
      fee: 1500,
      feeInPerson: 2200,
      earliest: 'Available Today',
      bio: 'Distinguished property registry advocate specializing in stamp paper authentication, sub-registrar appeals, and title due diligence.',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 11,
      name: 'Adv. Ch. Murali Krishna',
      roll: 'TS/5012/2015',
      bar: 'Bar Council of Telangana',
      court: 'Hanamkonda & Warangal Courts',
      experience: '10 Years Practice',
      rating: '4.7',
      reviews: 58,
      specialization: 'Civil Litigation & Recovery Notices, Tenant Injunctions',
      city: 'Warangal',
      fee: 1200,
      feeInPerson: 1800,
      earliest: 'Available Tomorrow',
      bio: 'Trial lawyer representing tenants and landlords in injunction petitions, rent control matters, and recovery of security deposits.',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 12,
      name: 'Adv. B. Haritha',
      roll: 'AP/2144/2013',
      bar: 'Bar Council of Andhra Pradesh',
      court: 'Tirupati District Court & AP High Court',
      experience: '12 Years Practice',
      rating: '4.8',
      reviews: 82,
      specialization: 'Consumer Protection, Tenancy Rights, Negotiable Instruments',
      city: 'Tirupati',
      fee: 1400,
      feeInPerson: 2000,
      earliest: 'Available Today',
      bio: 'Seasoned practitioner handling rental agreement violations, unfair trade practice claims, and consumer dispute representations.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'
    }
  ]);

  // Consultations State
  const [myConsultations, setMyConsultations] = useState([
    {
      id: 'app-901',
      advocateName: 'Adv. Rajeshwar Rao',
      roll: 'TS/1402/2014',
      format: 'Video Call (Google Meet)',
      date: `${tomorrowStr}, ${now.getFullYear()}`,
      time: '11:30 AM IST',
      fee: '₹1,500',
      status: 'Confirmed',
      meetingUrl: 'https://meet.google.com/lex-adv-9821',
      subject: 'Tenancy Agreement Deficient Stamp Paper & Lock-in Clause Review',
      docAttached: currentDocument?.title || 'Syed_Residential_Lease_Kondapur.pdf'
    }
  ]);

  // Sync with backend API (Auto-polling for real-time confirmation)
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await advocatesApi.getNearby();
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(a => ({
            id: a.id,
            name: a.name,
            roll: a.bar_council_id || 'TS/BAR/VERIFIED',
            bar: `Bar Council of ${a.state || 'Telangana'}`,
            court: `${a.city || 'Hyderabad'} Civil Court & High Court`,
            experience: `${a.experience_years || 12} Years Practice`,
            rating: (a.rating || 4.8).toFixed(1),
            reviews: a.consultations_count || 98,
            specialization: a.specialization || 'Contract & Lease Law',
            city: a.city || 'Hyderabad',
            fee: a.consultation_fee || 1500,
            feeInPerson: (a.consultation_fee || 1500) + 1000,
            earliest: 'Available Today',
            bio: a.bio || `Practicing advocate with extensive standing across High Court and Civil Chambers. Specializes in ${a.specialization || 'civil and property advisory'}.`,
            image: getPhotoForAdvocate(a.id, a.name, a.image_url || a.avatar_url)
          }));
          setAdvocatesList(prev => {
            const map = new Map();
            prev.forEach(i => map.set(i.id, i));
            mapped.forEach(i => map.set(i.id, i));
            return Array.from(map.values()).sort((a, b) => a.id - b.id);
          });
        }

        // Fetch appointments
        const appRes = await advocatesApi.getAppointments();
        if (appRes.data && appRes.data.length > 0) {
          const backendApps = appRes.data.map(app => {
            const isConfirmed = app.status === 'confirmed' || app.status === 'completed';
            return {
              id: `app-${app.id}`,
              numericId: app.id,
              advocateId: app.advocate_id,
              advocateName: app.advocate_name || 'Advocate Chamber',
              roll: app.advocate_phone || 'TS/BAR/VERIFIED',
              format: app.consultation_type || 'Video Call',
              date: app.appointment_date,
              time: app.time_slot,
              fee: `₹${(app.fee || 1500).toLocaleString()}`,
              status: isConfirmed ? 'Approved' : 'Pending',
              rawStatus: app.status,
              meetingUrl: 'https://meet.google.com/lex-adv-live',
              subject: app.case_subject,
              docAttached: currentDocument?.title || 'Legal Document'
            };
          });
          setMyConsultations(backendApps);
        }
      } catch (err) {
        console.debug('Advocate data loaded from local registry.');
      }
    }
    loadBackendData();
    const timer = setInterval(loadBackendData, 3000);
    const onFocus = () => loadBackendData();
    const onAccepted = () => loadBackendData();

    window.addEventListener('focus', onFocus);
    window.addEventListener('consultation_accepted', onAccepted);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('consultation_accepted', onAccepted);
    };
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open booking modal
  const handleOpenBooking = (adv) => {
    setSelectedAdvocate(adv);
    setIsBookingModalOpen(true);
    setBookingConfirmedData(null);

    // Fetch dynamic slots if available
    getAdvocateSlots(adv.id)
      .then(res => {
        if (res?.available_slots && res.available_slots.length > 0) {
          setDynamicSlots(res.available_slots);
          setSelectedTimeSlot(res.available_slots[0]);
        }
      })
      .catch(() => {
        setDynamicSlots(['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:30 PM']);
      });
  };

  // Close booking modal
  const handleCloseModal = () => {
    setIsBookingModalOpen(false);
    setSelectedAdvocate(null);
    setBookingConfirmedData(null);
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!selectedAdvocate) return;
    setIsSubmitting(true);

    const calculatedFee = consultFormat === 'video' ? selectedAdvocate.fee :
                         consultFormat === 'in_person' ? (selectedAdvocate.feeInPerson || selectedAdvocate.fee + 1000) : 2000;

    const appointmentDateStr = selectedDate === 'Today' ? todayStr : selectedDate === 'Tomorrow' ? tomorrowStr : dayAfterStr;
    const targetDateObj = selectedDate === 'Today' ? now : selectedDate === 'Tomorrow' ? tomorrow : dayAfter;
    const year = targetDateObj.getFullYear();
    const month = String(targetDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(targetDateObj.getDate()).padStart(2, '0');
    const formattedIsoDate = `${year}-${month}-${day}`;

    const finalSubject = caseSubject || `Statutory Review & Remediation for ${currentDocument?.title || 'Legal Document'}`;
    const finalNotes = caseNotes || 'Booked via LexAdvisor AI Platform with attached legal review.';

    const appointmentData = {
      advocate_id: selectedAdvocate.id || 1,
      client_name: clientName || user?.name || 'Syed Amanullah',
      client_phone: clientPhone || '+91 98490 11223',
      client_email: clientEmail || 'sureshtakur194@gmail.com',
      appointment_date: formattedIsoDate,
      time_slot: selectedTimeSlot,
      consultation_type: consultFormat === 'video' ? 'Video Call' : consultFormat === 'in_person' ? 'In-Chamber' : 'Written Vetting',
      case_subject: finalSubject,
      case_notes: finalNotes,
      document_id: attachDocBrief && typeof currentDocument?.id === 'number' ? currentDocument.id : null,
      fee: calculatedFee
    };

    let refId = `app-${Date.now()}`;
    let backendSaved = false;

    try {
      const res = await advocatesApi.bookAppointment(appointmentData);
      if (res.data?.id) {
        refId = `app-${res.data.id}`;
        backendSaved = true;
        // Broadcast booking event to advocate portal & chamber sync
        window.dispatchEvent(new CustomEvent('consultation_booked', { detail: res.data }));
        localStorage.setItem('active_advocate_id', String(selectedAdvocate.id || 1));
        window.dispatchEvent(new CustomEvent('advocate_profile_changed', { detail: { id: selectedAdvocate.id || 1 } }));
      }
    } catch (e) {
      console.error('Backend appointment booking error:', e);
      triggerToast(e.response?.data?.detail || 'Booking queued in offline mode.');
    }

    const newAppRecord = {
      id: refId,
      advocateName: selectedAdvocate.name,
      roll: selectedAdvocate.roll,
      format: consultFormat === 'video' ? 'Video Call (Google Meet)' :
              consultFormat === 'in_person' ? 'In-Person Chamber' : 'Written Deed Vetting',
      date: `${appointmentDateStr}, ${now.getFullYear()}`,
      time: `${selectedTimeSlot} IST`,
      fee: `₹${calculatedFee.toLocaleString()}`,
      status: 'Pending',
      meetingUrl: consultFormat === 'video' ? 'https://meet.google.com/lex-adv-live' : null,
      subject: finalSubject,
      docAttached: attachDocBrief ? (currentDocument?.title || 'Attached Document') : 'None'
    };

    setMyConsultations(prev => [newAppRecord, ...prev.filter(p => p.id !== refId)]);
    triggerToast(`Consultation booked with ${selectedAdvocate.name}! Email alert active for sureshtakur194@gmail.com.`);

    setBookingConfirmedData({
      refId,
      advocateName: selectedAdvocate.name,
      advocateRoll: selectedAdvocate.roll,
      format: consultFormat === 'video' ? 'Video Call (Google Meet)' :
              consultFormat === 'in_person' ? 'In-Person Office Chamber' : 'Written Deed Vetting',
      date: `${appointmentDateStr}, ${now.getFullYear()}`,
      time: `${selectedTimeSlot} IST`,
      fee: calculatedFee,
      clientEmail: clientEmail || 'sureshtakur194@gmail.com',
      meetingUrl: consultFormat === 'video' ? 'https://meet.google.com/lex-adv-live' : null
    });

    setIsSubmitting(false);
  };

  // Filter advocates based on search query & city
  const filteredAdvocates = advocatesList.filter(adv => {
    const matchesSearch = adv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          adv.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          adv.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          adv.court.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'All' || adv.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  // Calculate current fee for modal
  const modalCalculatedFee = selectedAdvocate ? (
    consultFormat === 'video' ? selectedAdvocate.fee :
    consultFormat === 'in_person' ? (selectedAdvocate.feeInPerson || selectedAdvocate.fee + 1000) : 2000
  ) : 1500;

  // If viewing consultations tab
  if (initialTab === 'consultations') {
    return (
      <div className="flex flex-col w-full px-6 lg:px-10 py-8 max-w-7xl mx-auto gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Consultations</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your scheduled video calls, office chamber visits, and legal opinions.
            </p>
          </div>
          <button
            onClick={() => navigate('/advocate-directory')}
            className="px-4 py-2.5 bg-[#0b1c30] text-white rounded-xl text-xs font-semibold hover:bg-[#1a2d48] flex items-center gap-2 shadow-sm transition-all self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Book New Consultation</span>
          </button>
        </div>

        {/* Email Alerts Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-blue-600">mark_email_read</span>
            <span>
              <strong>Email Alerts Active:</strong> Real-time booking status and advocate confirmation alerts are dispatched to <strong>sureshtakur194@gmail.com</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            <span>Verify &amp; Test Email</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {myConsultations.map(c => {
            const isConfirmed = (c.status || '').toLowerCase() === 'confirmed' ||
                                (c.status || '').toLowerCase() === 'approved' ||
                                (c.rawStatus || '').toLowerCase() === 'confirmed';
            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {c.advocateName.split(' ')[1]?.[0] || 'A'}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{c.advocateName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isConfirmed ? 'Approved by Advocate' : 'Pending Approval'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">{c.subject}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <span className="material-symbols-outlined text-sm text-slate-400">calendar_month</span>
                        {c.date} at {c.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-slate-400">videocam</span>
                        {c.format}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-900">{c.fee}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  {/* Replaced Join Meeting with Confirmed / Pending Option based on Advocate Approval */}
                  {isConfirmed ? (
                    <span className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                      <span>Approved by Advocate</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <span className="material-symbols-outlined text-base text-amber-600 animate-spin">hourglass_empty</span>
                      <span>Pending Advocate Approval</span>
                    </span>
                  )}
                  <button
                    onClick={() => triggerToast(`Reschedule request sent for ${c.advocateName}.`)}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b1c30] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="px-6 lg:px-10 py-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Sleek, Clean Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Find an Advocate
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Connect with verified legal practitioners for contract review, tenancy dispute counsel, and legal advisory.
            </p>
          </div>

          {/* Clean City Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            {['All', 'Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Warangal'].map(c => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  selectedCity === c
                    ? 'bg-white text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-xl">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search advocates by name, bar council ID, specialization, or court..."
            className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Clean Advocate Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAdvocates.map(adv => (
            <div
              key={adv.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              {/* Profile Top Section */}
              <div>
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={getPhotoForAdvocate(adv.id, adv.name, adv.image)}
                      alt={adv.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <span
                        className="material-symbols-outlined text-blue-600 text-lg block"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 text-base truncate">{adv.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 shrink-0">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span>{adv.rating}</span>
                        <span className="text-slate-400 font-normal">({adv.reviews})</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {adv.bar} • <span className="font-semibold text-slate-700">{adv.roll}</span>
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                      <span className="font-medium">{adv.experience}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{adv.city}</span>
                    </div>
                  </div>
                </div>

                {/* Court Affiliation */}
                <p className="text-xs text-slate-600 font-medium mt-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-slate-400">gavel</span>
                  <span>{adv.court}</span>
                </p>

                {/* Bio */}
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {adv.bio}
                </p>

                {/* Specialization Pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {adv.specialization.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Profile Bottom Section: Fees & Working Book Button */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Consultation Fee
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-bold text-slate-900">₹{adv.fee.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">/ Video</span>
                    <span className="text-xs text-slate-300 mx-1">•</span>
                    <span className="text-xs text-slate-600 font-medium">₹{adv.feeInPerson.toLocaleString()} Chamber</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking(adv)}
                  className="px-4 py-2.5 rounded-xl bg-[#0b1c30] text-white hover:bg-[#1a2d48] font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAdvocates.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
            <h3 className="text-base font-bold text-slate-800">No Advocates Match Your Search</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No legal practitioners found matching "{searchQuery}" in {selectedCity}. Try clearing your search or selecting "All" cities.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCity('All'); }}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WORKING BOOKING MODAL                                                     */}
      {/* ========================================================================= */}
      {isBookingModalOpen && selectedAdvocate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {bookingConfirmedData ? (
              /* Booking Success View */
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Consultation Booked Successfully!</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Your appointment slot has been confirmed with {bookingConfirmedData.advocateName}.
                </p>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 my-5 text-left flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{bookingConfirmedData.refId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Advocate:</span>
                    <span className="font-semibold text-slate-900">{bookingConfirmedData.advocateName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-semibold text-slate-900">{bookingConfirmedData.format}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <span className="font-semibold text-slate-900">{bookingConfirmedData.date} at {bookingConfirmedData.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-emerald-700">₹{bookingConfirmedData.fee.toLocaleString()} (Confirmed)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-blue-700 font-medium">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span>Calendar invite & confirmation dispatched to {bookingConfirmedData.clientEmail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseModal();
                      navigate('/consultations');
                    }}
                    className="flex-1 py-2.5 bg-[#0b1c30] hover:bg-[#1a2d48] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View My Consultations</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Configuration Form */
              <div className="flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-3">
                    <img
                      src={getPhotoForAdvocate(selectedAdvocate?.id, selectedAdvocate?.name, selectedAdvocate?.image)}
                      alt={selectedAdvocate.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{selectedAdvocate.name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{selectedAdvocate.bar} • {selectedAdvocate.roll}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4 text-left">
                  {/* Consultation Format */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      1. Select Consultation Format
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setConsultFormat('video')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          consultFormat === 'video'
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-blue-600">videocam</span>
                          <span className="text-xs font-bold text-slate-900">Video Call</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">Google Meet (30m)</span>
                        <span className="text-xs font-bold text-slate-900 mt-2">₹{selectedAdvocate.fee.toLocaleString()}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConsultFormat('in_person')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          consultFormat === 'in_person'
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-blue-600">apartment</span>
                          <span className="text-xs font-bold text-slate-900">In-Chamber</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">Face-to-Face</span>
                        <span className="text-xs font-bold text-slate-900 mt-2">₹{selectedAdvocate.feeInPerson.toLocaleString()}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConsultFormat('written')}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          consultFormat === 'written'
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-blue-600">description</span>
                          <span className="text-xs font-bold text-slate-900">Written Vetting</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1">Turnaround 24h</span>
                        <span className="text-xs font-bold text-slate-900 mt-2">₹2,000</span>
                      </button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      2. Select Date
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Today', date: todayStr },
                        { label: 'Tomorrow', date: tomorrowStr },
                        { label: '+2 Days', date: dayAfterStr }
                      ].map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setSelectedDate(item.label)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            selectedDate === item.label
                              ? 'border-[#0b1c30] bg-[#0b1c30] text-white shadow-sm'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">{item.label}</span>
                          <span className="block text-xs font-bold mt-0.5">{item.date}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      3. Available Time Slot (IST)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {dynamicSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 px-1 text-center rounded-lg text-xs transition-all ${
                            selectedTimeSlot === slot
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-100 text-slate-700 font-medium hover:bg-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Client Information */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">
                      4. Client Contact Details
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Your Name</span>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Phone Number</span>
                        <input
                          type="text"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[11px] text-slate-500 font-medium block mb-1">Email (For Confirmation & Link)</span>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Brief Context */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={attachDocBrief}
                        onChange={(e) => setAttachDocBrief(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 cursor-pointer"
                      />
                      <span>Attach current document for counsel review</span>
                    </label>
                    {attachDocBrief && (
                      <div className="text-[11px] text-slate-600 pl-6 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-slate-500">description</span>
                        <span className="font-medium text-slate-800">{currentDocument?.title || 'Syed_Residential_Lease_Kondapur.pdf'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Amount</span>
                    <span className="text-lg font-bold text-slate-900">₹{modalCalculatedFee.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-[#0b1c30] hover:bg-[#1a2d48] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          <span>Confirming Booking...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Booking (₹{modalCalculatedFee.toLocaleString()})</span>
                          <span className="material-symbols-outlined text-base">check</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Email Alert Configuration & Live Test Modal */}
      <EmailSettingsModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
