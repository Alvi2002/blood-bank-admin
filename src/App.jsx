import React, { useState, useEffect } from 'react';
import { districtUpazilas, districtNames } from './districtsData.js';

// ১. আপনার কপি করা Google Apps Script API URL-টি নিচে বসান
const API_URL = "https://script.google.com/macros/s/AKfycbyOk8WpikrU8s8J2tYLJup23oh2BMKB3LTsqrBZwH7YpLxGZNpDzIxMFfDv-7Z-7cmDyg/exec";

// ২. আপনার কপি করা Google Client ID-টি নিচে বসান
const GOOGLE_CLIENT_ID = "739624972413-up610v43909rj7b37u6g0glgujmg3dc5.apps.googleusercontent.com";

// ৩. আপনার এডমিন গুগল জিমেইল এড্রেসটি নিচে বসান (সিকিউরিটি লকের জন্য)
const ADMIN_EMAIL = "original.alvi2002@gmail.com";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // PWA ইন্সটলেশন স্টেট
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  // গুগল সাইন-ইন ইউজার স্টেট
  const [user, setUser] = useState(null);

  // ড্যাশবোর্ড নেভিগেশন স্টেট
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'donors', 'requests'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ফিল্টার এবং পেজিনেশন স্টেট
  const [searchBlood, setSearchBlood] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchUpazila, setSearchUpazila] = useState('');
  const [donorPage, setDonorPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const itemsPerPage = 10;

  // রাইট/এডিট মডাল ফর্ম স্টেট
  const [editItem, setEditItem] = useState(null);
  const [formMode, setFormType] = useState(''); // 'addDonor', 'editDonor', 'addRequest', 'editRequest'

  // ফর্ম ডাটা স্টেটসমূহ (ডোনার ও রিকোয়েস্টের জন্য)
  const [fdName, setFdName] = useState('');
  const [fdBlood, setFdBlood] = useState('');
  const [fdPhone, setFdPhone] = useState('');
  const [fdLastDonation, setFdLastDonation] = useState('');
  const [fdDistrict, setFdDistrict] = useState('');
  const [fdUpazila, setFdUpazila] = useState('');
  const [fdAvailable, setFdAvailable] = useState('true');
  const [fdEmail, setFdEmail] = useState(''); // ম্যানুয়ালি জিমেইল যোগ করার জন্য

  const [frPatient, setFrPatient] = useState('');
  const [frBlood, setFrBlood] = useState('');
  const [frPhone, setFrPhone] = useState('');
  const [frDateTime, setFrDateTime] = useState('');
  const [frHospital, setFrHospital] = useState('');
  const [frDisease, setFrDisease] = useState('');
  const [frQuantity, setFrQuantity] = useState('');
  const [frDistrict, setFrDistrict] = useState('');
  const [frUpazila, setFrUpazila] = useState('');

  // মোবাইল নাম্বারের শুরুতে '০' যুক্ত করার ডাইনামিক ফাংশন
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleanPhone = String(phone).trim();
    return cleanPhone.startsWith('0') ? cleanPhone : '0' + cleanPhone;
  };

  // স্প্ল্যাশ স্ক্রিন হাইড
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // ব্রাউজারে সাইন-ইন সেশন চেক
  useEffect(() => {
    const savedUser = localStorage.getItem("blood_bank_admin_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // গুগল সাইন-ইন বাটন রেন্ডার মেকানিজম
  useEffect(() => {
    if (!showSplash && !loading && !user) {
      const initializeGoogleSignIn = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCallbackResponse
          });
          window.google.accounts.id.renderButton(
            document.getElementById("googleSignInBtn"),
            { theme: "outline", size: "large", width: "100%" }
          );
        }
      };

      const checkInterval = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 300);

      return () => clearInterval(checkInterval);
    }
  }, [showSplash, loading, user]);

  const handleCallbackResponse = (response) => {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const userObject = JSON.parse(jsonPayload);
      setUser(userObject);
      localStorage.setItem("blood_bank_admin_user", JSON.stringify(userObject));
    } catch (err) {
      console.error("Sign in error: ", err);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("blood_bank_admin_user");
  };

  // PWA ইনস্টল ইভেন্ট
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowInstallBanner(true);
      }, 2000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Installed');
        }
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      });
    }
  };

  // ডেটা ফেচ করা
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setDonors(data.donors || []);
      setRequests(data.requests || []);
    } catch (err) {
      console.error("Fetching error: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // সার্চ পরিবর্তন হলে পেজ ১ এ রিসেট
  useEffect(() => {
    setDonorPage(1);
    setRequestPage(1);
  }, [searchBlood, searchDistrict, searchUpazila]);

  // এডিট মডাল ওপেন করার সময় ডাটা প্রি-ফিল করা
  const openEditModal = (item, type) => {
    setEditItem(item);
    setFormType(type);
    
    if (type === 'editDonor') {
      setFdName(item.name);
      setFdBlood(item.group);
      setFdPhone(formatPhone(item.phone));
      setFdLastDonation(item.lastDonation || "");
      setFdDistrict(item.district);
      setFdUpazila(item.upazila);
      setFdAvailable(String(item.available));
      setFdEmail(item.email || "");
    } else if (type === 'editRequest') {
      setFrPatient(item.patient);
      setFrBlood(item.group);
      setFrPhone(formatPhone(item.phone));
      setFrDateTime(item.dateTime);
      setFrHospital(item.hospital);
      setFrDisease(item.disease);
      setFrQuantity(item.quantity);
      setFrDistrict(item.district);
      setFrUpazila(item.upazila);
    }
  };

  const closeFormModal = () => {
    setEditItem(null);
    setFormType('');
    // রিসেট অল ফর্ম ফিল্ড
    setFdName(''); setFdBlood(''); setFdPhone(''); setFdLastDonation(''); setFdDistrict(''); setFdUpazila(''); setFdAvailable('true'); setFdEmail('');
    setFrPatient(''); setFrBlood(''); setFrPhone(''); setFrDateTime(''); setFrHospital(''); setFrDisease(''); setFrQuantity(''); setFrDistrict(''); setFrUpazila('');
  };

  // এডমিন লক চেক
  const isAdmin = user && user.email === ADMIN_EMAIL;

  // এপিআই-তে ডেটা পাঠানো (CRUD)
  const handleApiRequest = async (payload, successMsg) => {
    setSubmitting(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.status === "success") {
        alert(successMsg);
        closeFormModal();
        fetchData();
      } else {
        alert("ব্যর্থ হয়েছে: " + result.message);
      }
    } catch (err) {
      alert("নেটওয়ার্ক ত্রুটি, আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  // ডোনার ম্যানুয়ালি যোগ করা
  const handleAddDonor = (e) => {
    e.preventDefault();
    const payload = {
      action: "addDonor",
      name: fdName,
      group: fdBlood,
      phone: formatPhone(fdPhone),
      district: fdDistrict,
      upazila: fdUpazila,
      lastDonation: fdLastDonation,
      email: fdEmail
    };
    handleApiRequest(payload, "নতুন রক্তদাতা সফলভাবে যুক্ত করা হয়েছে!");
  };

  // ডোনার ম্যানুয়ালি এডিট/আপডেট করা (নাম ও রক্ত গ্রুপ সহ এডিটেবল)
  const handleUpdateDonor = (e) => {
    e.preventDefault();
    const payload = {
      action: "updateDonor",
      email: fdEmail,
      name: fdName,
      group: fdBlood,
      phone: formatPhone(fdPhone),
      district: fdDistrict,
      upazila: fdUpazila,
      lastDonation: fdLastDonation,
      available: fdAvailable
    };
    handleApiRequest(payload, "রক্তদাতার তথ্য সফলভাবে আপডেট করা হয়েছে!");
  };

  // ডোনার ডিলিট করা
  const handleDeleteDonor = (email, name) => {
    if (confirm(`আপনি কি সত্যিই রক্তদাতা "${name}"-কে মুছে ফেলতে চান?`)) {
      const payload = { action: "deleteDonor", email: email };
      handleApiRequest(payload, "রক্তদাতা প্রোফাইলটি মুছে ফেলা হয়েছে।");
    }
  };

  // রক্তের আবেদন ম্যানুয়ালি যোগ করা
  const handleAddRequest = (e) => {
    e.preventDefault();
    const payload = {
      action: "addRequest",
      patient: frPatient,
      group: frBlood,
      phone: formatPhone(frPhone),
      dateTime: frDateTime,
      hospital: frHospital,
      disease: frDisease,
      quantity: frQuantity,
      district: frDistrict,
      upazila: frUpazila
    };
    handleApiRequest(payload, "রক্তের নতুন আবেদনটি সফলভাবে যুক্ত করা হয়েছে!");
  };

  // রক্তের আবেদন ম্যানুয়ালি এডিট করা
  const handleUpdateRequest = (e) => {
    e.preventDefault();
    const payload = {
      action: "updateRequest",
      oldPatient: editItem.patient,
      oldPhone: formatPhone(editItem.phone),
      oldDateTime: editItem.dateTime,
      patient: frPatient,
      group: frBlood,
      phone: formatPhone(frPhone),
      dateTime: frDateTime,
      hospital: frHospital,
      disease: frDisease,
      quantity: frQuantity,
      district: frDistrict,
      upazila: frUpazila
    };
    handleApiRequest(payload, "আবেদনের তথ্য সফলভাবে আপডেট করা হয়েছে!");
  };

  // রক্তের আবেদন ডিলিট করা
  const handleDeleteRequest = (req) => {
    if (confirm(`আপনি কি সত্যিই "${req.patient}"-এর জরুরি আবেদনটি মুছে ফেলতে চান?`)) {
      const payload = {
        action: "deleteRequest",
        patient: req.patient,
        phone: formatPhone(req.phone),
        dateTime: req.dateTime
      };
      handleApiRequest(payload, "আবেদনটি সফলভাবে মুছে ফেলা হয়েছে।");
    }
  };

  // ফিল্টারিং রক্তদাতা তালিকা
  const filteredDonors = donors.filter(donor => {
    const matchBlood = !searchBlood || donor.group === searchBlood;
    const matchDistrict = !searchDistrict || donor.district === searchDistrict;
    const matchUpazila = !searchUpazila || donor.upazila === searchUpazila;
    return matchBlood && matchDistrict && matchUpazila;
  });

  const totalDonorPages = Math.ceil(filteredDonors.length / itemsPerPage);
  const paginatedDonors = filteredDonors.slice((donorPage - 1) * itemsPerPage, donorPage * itemsPerPage);

  // ফিল্টারিং জরুরি আবেদনসমূহ
  const activeRequests = requests.filter(req => {
    const reqTime = new Date(req.dateTime).getTime();
    const nowTime = new Date().getTime();
    return reqTime > nowTime;
  });

  const totalRequestPages = Math.ceil(activeRequests.length / itemsPerPage);
  const paginatedRequests = activeRequests.slice((requestPage - 1) * itemsPerPage, requestPage * itemsPerPage);

  // ড্যাশবোর্ড ক্যালকুলেশন
  const bloodGroupCounts = donors.reduce((acc, donor) => {
    acc[donor.group] = (acc[donor.group] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* ১. স্প্ল্যাশ স্ক্রিন */}
      {showSplash && (
        <div className="fixed inset-0 bg-gradient-to-br from-red-600 to-rose-950 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ease-out">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-28 h-28 bg-red-500 rounded-full animate-ping opacity-25"></div>
            <div className="bg-white p-6 rounded-full shadow-2xl relative z-10">
              <i className="fa-solid fa-droplet text-red-600 text-5xl animate-pulse"></i>
            </div>
          </div>
          <h1 className="text-white text-3xl font-extrabold mt-6 tracking-wider">রক্তদান <span className="text-red-300">এডমিন</span></h1>
          <p className="text-red-100 text-sm mt-2 font-medium">কন্ট্রোল ড্যাশবোর্ড এবং ডাটাবেজ প্যানেল</p>
          <div className="w-40 h-1 bg-red-900 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ animation: 'loading 2.2s linear forwards' }}></div>
          </div>
        </div>
      )}

      {/* ২. সিকিউর লগইন গেটওয়ে */}
      {!user || !isAdmin ? (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 p-8 md:p-12 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="bg-red-500/10 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl border border-red-500/20">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h2 className="text-2xl font-black text-white">এডমিন প্যানেল লগইন</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              সিস্টেম ডাটাবেজ আপডেট, ডোনার এডিট ও ডিলিট করতে আপনার অনুমোদিত এডমিন গুগল অ্যাকাউন্ট দিয়ে লগইন করুন।
            </p>
            {user && !isAdmin && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-xs font-semibold border border-red-500/20">
                অ্যাক্সেস ডিনাইড! আপনার ইমেইল ({user.email}) এডমিন হিসেবে নিবন্ধিত নয়।
              </div>
            )}
            <div className="pt-2">
              {user && <button onClick={handleSignOut} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl mb-3">অন্য অ্যাকাউন্টে লগইন করুন</button>}
              <div id="googleSignInBtn" className="w-full flex justify-center"></div>
            </div>
          </div>
        </div>
      ) : (
        // ৩. প্রধান ড্যাশবোর্ড লেআউট
        <div className="flex-1 flex flex-col md:flex-row relative">

          {/* ৩.১ বামদিকের স্লাইডিং সাইডবার (হ্যামবার্গার সাইডবার) */}
          <aside className={`fixed md:sticky top-0 left-0 bottom-0 w-64 bg-slate-950 text-slate-400 z-40 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-slate-900`}>
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-900">
              <i className="fa-solid fa-droplet text-red-600 text-2xl animate-bounce"></i>
              <span className="text-white font-black text-lg">এডমিন ড্যাশবোর্ড</span>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-2 font-bold text-sm">
              <button onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition ${activeView === 'dashboard' ? 'bg-red-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
                <i className="fa-solid fa-chart-line text-lg w-5"></i> ড্যাশবোর্ড সামারি
              </button>
              <button onClick={() => { setActiveView('donors'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition ${activeView === 'donors' ? 'bg-red-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
                <i className="fa-solid fa-users text-lg w-5"></i> রক্তদাতা নিয়ন্ত্রণ
              </button>
              <button onClick={() => { setActiveView('requests'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition ${activeView === 'requests' ? 'bg-red-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
                <i className="fa-solid fa-hand-holding-hand text-lg w-5"></i> রক্তের আবেদন নিয়ন্ত্রণ
              </button>
            </nav>
            <div className="p-4 border-t border-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src={user.picture} alt="admin" className="w-8 h-8 rounded-full shadow" />
                <span className="text-xs font-bold text-slate-300 truncate w-24">{user.name}</span>
              </div>
              <button onClick={handleSignOut} className="text-xs bg-slate-900 hover:bg-red-950 hover:text-red-400 p-2 rounded-lg text-slate-400 transition font-bold">
                লগআউট
              </button>
            </div>
          </aside>

          {/* মোবাইল ওভারলে ব্যাকড্রপ */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 md:hidden"></div>
          )}

          {/* ৩.২ ডানদিকের প্রধান কন্টেন্ট উইন্ডো */}
          <main className="flex-1 flex flex-col min-w-0">
            
            {/* ড্যাশবোর্ড হেডার */}
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-600 text-xl focus:outline-none">
                  <i className="fa-solid fa-bars"></i>
                </button>
                <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  {activeView === 'dashboard' && "ড্যাশবোর্ড ওভারভিউ"}
                  {activeView === 'donors' && "রক্তদাতা ম্যানেজমেন্ট"}
                  {activeView === 'requests' && "রক্তের রিকোয়েস্ট ম্যানেজমেন্ট"}
                </h2>
              </div>
              <button onClick={fetchData} disabled={loading} className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5 disabled:opacity-50">
                <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i> রিফ্রেশ ডাটা
              </button>
            </header>

            {/* ৪.১ ড্যাশবোর্ড সামারি ভিউ */}
            {activeView === 'dashboard' && (
              <div className="p-6 space-y-6">
                
                {/* সামারি কার্ড গ্রিড */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                    <div className="bg-red-50 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-red-100"><i className="fa-solid fa-users"></i></div>
                    <div><h4 className="text-slate-400 text-xs font-bold uppercase">মোট রক্তদাতা</h4><p className="text-3xl font-black text-slate-900 mt-1">{donors.length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                    <div className="bg-amber-50 text-amber-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-amber-100"><i className="fa-solid fa-hand-holding-hand"></i></div>
                    <div><h4 className="text-slate-400 text-xs font-bold uppercase">সক্রিয় রক্তের আবেদন</h4><p className="text-3xl font-black text-slate-900 mt-1">{activeRequests.length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-emerald-100"><i className="fa-solid fa-user-check"></i></div>
                    <div><h4 className="text-slate-400 text-xs font-bold uppercase">রক্তদানে প্রস্তুত</h4><p className="text-3xl font-black text-slate-900 mt-1">{donors.filter(d => d.available === "true" || d.available === true).length}</p></div>
                  </div>
                </div>

                {/* গ্রুপভিত্তিক ডোনার ডিস্ট্রিবিউশন */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-xs">
                  <h3 className="font-extrabold text-slate-950 text-lg mb-6 flex items-center gap-2"><i className="fa-solid fa-droplet text-red-600"></i> গ্রুপভিত্তিক ডোনার বন্টন:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((grp) => (
                      <div key={grp} className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl text-center">
                        <span className="text-xl font-black text-red-600 block">{grp}</span>
                        <span className="text-xs text-slate-400 font-bold block mt-1">{bloodGroupCounts[grp] || 0} জন</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ৪.২ রক্তদাতা ম্যানেজমেন্ট ভিউ */}
            {activeView === 'donors' && (
              <div className="p-6 space-y-6">
                
                {/* সার্চ ফিল্টার ও নতুন ডোনার অ্যাড বাটন */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/60 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select value={searchBlood} onChange={(e) => setSearchBlood(e.target.value)} className="border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 text-sm">
                      <option value="">সকল গ্রুপ</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                    <select value={searchDistrict} onChange={(e) => { setSearchDistrict(e.target.value); setSearchUpazila(''); }} className="border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 text-sm">
                      <option value="">সকল জেলা</option>
                      {Object.keys(districtUpazilas).map(dist => <option key={dist} value={dist}>{districtNames[dist]}</option>)}
                    </select>
                    <select value={searchUpazila} onChange={(e) => setSearchUpazila(e.target.value)} disabled={!searchDistrict} className="border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 text-sm disabled:opacity-50">
                      <option value="">{searchDistrict ? "সকল উপজেলা" : "প্রথমে জেলা নির্বাচন করুন"}</option>
                      {searchDistrict && districtUpazilas[searchDistrict]?.map(upz => <option key={upz} value={upz}>{upz}</option>)}
                    </select>
                  </div>
                  <button onClick={() => { setFormType('addDonor'); setEditItem({}); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-lg shadow-red-200 flex items-center justify-center gap-1.5">
                    <i className="fa-solid fa-plus"></i> নতুন রক্তদাতা যোগ করুন
                  </button>
                </div>

                {/* ডোনার টেবিল */}
                <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                        <tr>
                          <th className="px-6 py-4">নাম ও গ্রুপ</th>
                          <th className="px-6 py-4">মোবাইল</th>
                          <th className="px-6 py-4">লোকেশন</th>
                          <th className="px-6 py-4">ইমেইল</th>
                          <th className="px-6 py-4 text-center">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr><td colSpan="5" className="text-center py-12"><i className="fa-solid fa-spinner animate-spin text-red-600 text-3xl"></i></td></tr>
                        ) : paginatedDonors.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-12">কোনো রক্তদাতার ডাটা পাওয়া যায়নি।</td></tr>
                        ) : (
                          paginatedDonors.map((donor, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <span className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-sm border border-red-100">{donor.group}</span>
                                <span className="font-bold text-slate-900">{donor.name}</span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-700">{formatPhone(donor.phone)}</td>
                              <td className="px-6 py-4 font-medium">{donor.upazila}, {districtNames[donor.district]}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-400 truncate max-w-xs">{donor.email || "জিমেইল নেই"}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => openEditModal(donor, 'editDonor')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                                    <i className="fa-solid fa-pen-to-square"></i> এডিট
                                  </button>
                                  <button onClick={() => handleDeleteDonor(donor.email, donor.name)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-100">
                                    <i className="fa-solid fa-trash-can"></i> ডিলিট
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ৫.১ রক্তদাতার পেজিনেশন বাটনসমূহ (১০টি করে ডাটা) */}
                  {totalDonorPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 text-xs">
                      <button onClick={() => setDonorPage(p => Math.max(p - 1, 1))} disabled={donorPage === 1} className="px-3.5 py-2 bg-slate-50 text-slate-600 border rounded-lg font-bold disabled:opacity-50">পূর্ববর্তী</button>
                      <span className="font-bold text-slate-400">পৃষ্ঠা {donorPage} / {totalDonorPages}</span>
                      <button onClick={() => setDonorPage(p => Math.min(p + 1, totalDonorPages))} disabled={donorPage === totalDonorPages} className="px-3.5 py-2 bg-slate-50 text-slate-600 border rounded-lg font-bold disabled:opacity-50">পরবর্তী</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ৪.৩ জরুরি আবেদন নিয়ন্ত্রণ ভিউ */}
            {activeView === 'requests' && (
              <div className="p-6 space-y-6">
                
                {/* নতুন আবেদন যোগ বোতাম */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/60 flex justify-between items-center gap-4">
                  <h3 className="font-bold text-slate-800 text-sm">জরুরি আবেদনসমূহের তালিকা নিয়ন্ত্রণ করুন:</h3>
                  <button onClick={() => { setFormType('addRequest'); setEditItem({}); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-lg shadow-red-200 flex items-center justify-center gap-1.5">
                    <i className="fa-solid fa-plus"></i> রক্তের নতুন আবেদন যোগ করুন
                  </button>
                </div>

                {/* আবেদন টেবিল */}
                <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                        <tr>
                          <th className="px-6 py-4">রোগী ও রক্ত গ্রুপ</th>
                          <th className="px-6 py-4">সমস্যা ও ব্যাগ</th>
                          <th className="px-6 py-4">মোবাইল</th>
                          <th className="px-6 py-4">তারিখ ও সময়</th>
                          <th className="px-6 py-4 text-center">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr><td colSpan="5" className="text-center py-12"><i className="fa-solid fa-spinner animate-spin text-red-600 text-3xl"></i></td></tr>
                        ) : paginatedRequests.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-12">কোনো রক্তের আবেদন ডাটাবেজে পাওয়া যায়নি।</td></tr>
                        ) : (
                          paginatedRequests.map((req, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <span className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-sm border border-red-100">{req.group}</span>
                                <span className="font-bold text-slate-900">{req.patient}</span>
                              </td>
                              <td className="px-6 py-4 font-semibold">
                                <span className="text-red-500">{req.disease}</span> <span className="text-xs text-slate-400 block mt-0.5">পরিমাণ: {req.quantity}</span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-700">{formatPhone(req.phone)}</td>
                              <td className="px-6 py-4 font-semibold text-xs text-slate-400">
                                {new Date(req.dateTime).toLocaleString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => openEditModal(req, 'editRequest')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1">
                                    <i className="fa-solid fa-pen-to-square"></i> এডিট
                                  </button>
                                  <button onClick={() => handleDeleteRequest(req)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-100">
                                    <i className="fa-solid fa-trash-can"></i> ডিলিট
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* রিকোয়েস্ট পেজিনেশন বাটনসমূহ */}
                  {totalRequestPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 text-xs">
                      <button onClick={() => setRequestPage(p => Math.max(p - 1, 1))} disabled={requestPage === 1} className="px-3.5 py-2 bg-slate-50 text-slate-600 border rounded-lg font-bold disabled:opacity-50">পূর্ববর্তী</button>
                      <span className="font-bold text-slate-400">পৃষ্ঠা {requestPage} / {totalRequestPages}</span>
                      <button onClick={() => setRequestPage(p => Math.min(p + 1, totalRequestPages))} disabled={requestPage === totalRequestPages} className="px-3.5 py-2 bg-slate-50 text-slate-600 border rounded-lg font-bold disabled:opacity-50">পরবর্তী</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ৫. ম্যানুয়াল অ্যাড ও এডিট পপআপ মডাল ফর্মসমূহ */}
      {formMode && (
        <div onClick={closeFormModal} className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[9999] flex justify-center items-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white text-slate-800 p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeFormModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl"><i className="fa-solid fa-xmark"></i></button>
            
            {/* ৫.১ ডোনার অ্যাড অথবা এডিট মডাল ফর্ম */}
            {(formMode === 'addDonor' || formMode === 'editDonor') && (
              <div>
                <h3 className="text-xl font-black text-slate-900 text-center mb-6">
                  {formMode === 'addDonor' ? "ম্যানুয়ালি নতুন রক্তদাতা যোগ করুন" : "রক্তদাতার সকল তথ্য এডিট করুন"}
                </h3>
                <form onSubmit={formMode === 'addDonor' ? handleAddDonor : handleUpdateDonor} className="space-y-5 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">পূর্ণ নাম</label>
                      <input type="text" value={fdName} onChange={(e) => setFdName(e.target.value)} required placeholder="উদা: আরিয়ান খান" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">রক্তের গ্রুপ</label>
                      <select value={fdBlood} onChange={(e) => setFdBlood(e.target.value)} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        <option value="">নির্বাচন করুন</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">মোবাইল নম্বর</label>
                      <input type="tel" value={fdPhone} onChange={(e) => setFdPhone(e.target.value)} required placeholder="উদা: 017XXXXXXXX" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">সর্বশেষ রক্তদানের তারিখ</label>
                      <input type="date" value={fdLastDonation} onChange={(e) => setFdLastDonation(e.target.value)} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">জেলা</label>
                      <select value={fdDistrict} onChange={(e) => { setFdDistrict(e.target.value); setFdUpazila(''); }} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        <option value="">জেলা নির্বাচন করুন</option>
                        {Object.keys(districtUpazilas).map(dist => <option key={dist} value={dist}>{districtNames[dist]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">উপজেলা</label>
                      <select value={fdUpazila} onChange={(e) => setFdUpazila(e.target.value)} disabled={!fdDistrict} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:opacity-50">
                        <option value="">{fdDistrict ? "উপজেলা নির্বাচন করুন" : "প্রথমে জেলা নির্বাচন করুন"}</option>
                        {fdDistrict && districtUpazilas[fdDistrict]?.map(upz => <option key={upz} value={upz}>{upz}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ম্যানুয়াল জিমেইল অ্যাড করার ডাইনামিক ফিল্ড */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">গুগল জিমেইল আইডি (ইউজার সেলফ-এডিটের জন্য)</label>
                    <input type="email" value={fdEmail} onChange={(e) => setFdEmail(e.target.value)} placeholder="উদা: donor@gmail.com (ঐচ্ছিক)" disabled={formMode === 'editDonor'} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:bg-slate-50" />
                  </div>

                  {formMode === 'editDonor' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">রক্ত দিতে প্রস্তুত আছেন কি না?</label>
                      <select value={fdAvailable} onChange={(e) => setFdAvailable(e.target.value)} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        <option value="true">হ্যাঁ, রক্ত দিতে প্রস্তুত আছেন</option>
                        <option value="false">না, এই মুহূর্তে প্রস্তুত নন</option>
                      </select>
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50">
                    {submitting ? "লোডিং..." : "ডাটাবেজে সেভ করুন"}
                  </button>
                </form>
              </div>
            )}

            {/* ৫.২ আবেদন অ্যাড অথবা এডিট মডাল ফর্ম */}
            {(formMode === 'addRequest' || formMode === 'editRequest') && (
              <div>
                <h3 className="text-xl font-black text-slate-900 text-center mb-6">
                  {formMode === 'addRequest' ? "ম্যানুয়ালি রক্তের নতুন আবেদন যোগ করুন" : "রক্তের আবেদনের সকল তথ্য এডিট করুন"}
                </h3>
                <form onSubmit={formMode === 'addRequest' ? handleAddRequest : handleUpdateRequest} className="space-y-5 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">রোগীর নাম</label>
                      <input type="text" value={frPatient} onChange={(e) => setFrPatient(e.target.value)} required placeholder="উদা: সুফিয়া বেগম" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">প্রয়োজনীয় রক্তের গ্রুপ</label>
                      <select value={frBlood} onChange={(e) => setFrBlood(e.target.value)} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        <option value="">নির্বাচন করুন</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">রোগীর সমস্যা / রোগের ধরণ</label>
                      <input type="text" value={frDisease} onChange={(e) => setFrDisease(e.target.value)} required placeholder="উদা: থ্যালাসেমিয়া / অপারেশন" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">রক্তের পরিমাণ (কত ব্যাগ লাগবে?)</label>
                      <input type="text" value={frQuantity} onChange={(e) => setFrQuantity(e.target.value)} required placeholder="উদা: ২ ব্যাগ" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">মোবাইল নম্বর</label>
                      <input type="tel" value={frPhone} onChange={(e) => setFrPhone(e.target.value)} required placeholder="উদা: 017XXXXXXXX" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">কখন রক্ত প্রয়োজন? (ক্যালেন্ডার ও সময়)</label>
                      <input type="datetime-local" value={frDateTime} onChange={(e) => setFrDateTime(e.target.value)} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">হাসপাতালের নাম ও ঠিকানা</label>
                    <input type="text" value={frHospital} onChange={(e) => setFrHospital(e.target.value)} required placeholder="উদা: ঢাকা মেডিকেল কলেজ হাসপাতাল" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">জেলা</label>
                      <select value={frDistrict} onChange={(e) => { setFrDistrict(e.target.value); setFrUpazila(''); }} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        <option value="">জেলা নির্বাচন করুন</option>
                        {Object.keys(districtUpazilas).map(dist => <option key={dist} value={dist}>{districtNames[dist]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">উপজেলা</label>
                      <select value={frUpazila} onChange={(e) => setFrUpazila(e.target.value)} disabled={!frDistrict} required className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:opacity-50">
                        <option value="">{frDistrict ? "উপজেলা নির্বাচন করুন" : "প্রথমে জেলা নির্বাচন করুন"}</option>
                        {frDistrict && districtUpazilas[frDistrict]?.map(upz => <option key={upz} value={upz}>{upz}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg disabled:opacity-50">
                    {submitting ? "লোডিং..." : "ডাটাবেজে সেভ করুন"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ১০. কাস্টম স্লাইডিং PWA ইনস্টলেশন বটম ব্যানার */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 z-[9999] transition-all duration-500 ease-in-out">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-3 rounded-2xl">
              <i className="fa-solid fa-droplet text-red-600 text-2xl animate-pulse"></i>
            </div>
            <div className="text-left">
              <h4 className="font-extrabold text-slate-950 text-sm">হোম স্ক্রিনে যুক্ত করুন</h4>
              <p className="text-xs text-slate-400 mt-0.5">সহজ ও দ্রুত রক্তদাতার সন্ধানে অ্যাপটি ইনস্টল করুন</p>
            </div>
          </div>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button onClick={() => setShowInstallBanner(false)} className="w-1/2 sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition">
              পরে করুন
            </button>
            <button onClick={handleInstallApp} className="w-1/2 sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-200">
              ইনস্টল করুন
            </button>
          </div>
        </div>
      )}

      {/* ফুটার ক্রেডিট */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-4 text-center text-xs mt-auto border-t border-slate-900">
        <p>&copy; {new Date().getFullYear()}  রক্তদান নেটওয়ার্ক এডমিন প্যানেল। সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="text-slate-600 mt-2">
          Designed & Developed by 
          <a href="https://t.me/Real_Alvi" target="_blank" rel="noopener noreferrer" className="rainbow-credit ml-1">
            Alvi Ahmed <i className="fa-brands fa-telegram text-[#229ED9]"></i>
          </a>
        </p>
      </footer>

    </div>
  );
}
