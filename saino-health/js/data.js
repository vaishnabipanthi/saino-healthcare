/**
 * SAINO HEALTH - Mock Dataset & Configuration
 * 2026 Saino Tech Ventures Pvt. Ltd.
 */

window.SAINO_DATA = {
 
  categories: [
    {
      id: 'hospital',
      name: 'Hospital Providers',
      icon: 'building-2',
      color: 'blue',
      description: 'Multispeciality & super-speciality hospitals across Nepal',
      count: 142
    },
    {
      id: 'clinic',
      name: 'Clinic',
      icon: 'stethoscope',
      color: 'emerald',
      description: 'Specialist polyclinics, dental, eye & OPD centres',
      count: 218
    },
    {
      id: 'diagnostic',
      name: 'Diagnostic Centre',
      icon: 'activity',
      color: 'purple',
      description: 'Pathology labs, MRI, CT Scan & Ultrasound clinics',
      count: 96
    },
    {
      id: 'physiotherapy',
      name: 'Physiotherapy',
      icon: 'heart-pulse',
      color: 'amber',
      description: 'Physical rehab, spine care & sports injury therapists',
      count: 54
    },
    {
      id: 'wellness',
      name: 'Wellness Centre',
      icon: 'sparkles',
      color: 'rose',
      description: 'Holistic healing, yoga therapy, naturopathy & mental wellness',
      count: 67
    },
    {
      id: 'insurance',
      name: 'Health Insurance',
      icon: 'shield-check',
      color: 'cyan',
      description: 'Individual, family & corporate group health insurance plans',
      count: 28
    },
    {
      id: 'bloodbank',
      name: 'Blood Bank Services',
      icon: 'droplets',
      color: 'red',
      description: 'Emergency blood donation, plasma availability & inventory',
      count: 32
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      icon: 'pill',
      color: 'teal',
      description: '24/7 retail pharmacies & online home prescription delivery',
      count: 310
    },
    {
      id: 'homecare',
      name: 'Homecare Centre',
      icon: 'home',
      color: 'indigo',
      description: 'In-home doctor visits, nursing attendants & elderly care',
      count: 45
    }
  ],

  bookingCategories: [
    { id: 'hosp_consult', title: 'Hospital Doctor Consultation Appointment Bookings', icon: 'user-check' },
    { id: 'home_doc', title: 'Homecare Doctor', icon: 'home' },
    { id: 'home_nurse', title: 'Home Care Nurse', icon: 'heart-handshake' },
    { id: 'clinic_apt', title: 'Clinic Appointment', icon: 'calendar-check' },
    { id: 'dr_apt', title: 'Dr Appointment Booking', icon: 'stethoscope' },
    { id: 'wellness_booking', title: 'Physical Wellness Centre Service Booking', icon: 'sparkles' },
    { id: 'ambulance', title: 'Ambulance Booking', icon: 'truck' },
    { id: 'bloodbank_booking', title: 'Bloodbank Booking', icon: 'droplet' }
  ],


  promotionalAds: [
    {
      id: 'ad-1',
      title: 'Family Health Insurance Plan 2026',
      subtitle: 'Comprehensive cashless hospitalization in 80+ network hospitals in Nepal',
      tag: 'SPONSORED · HEALTH INSURANCE',
      badge: '25% Annual Discount',
      bgGradient: 'from-blue-600 to-indigo-800',
      actionText: 'Explore Insurance Plans',
      category: 'insurance',
      company: 'Sagarmatha Lumbini Insurance Health Shield',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hi SAINO, I am interested in the Family Health Insurance plan.'
    },
    {
      id: 'ad-2',
      title: 'Executive Heart & Cardiac Screening',
      subtitle: 'ECG, Echo, Lipid Profile & Senior Cardiologist Consultation at Norvic',
      tag: 'FEATURED CLINIC',
      badge: 'Save Rs. 2,500',
      bgGradient: 'from-rose-600 to-red-800',
      actionText: 'Book Cardiac Checkup',
      category: 'hospital',
      company: 'Norvic Heart & Vascular Institute',
      image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hello, I want to book the Executive Heart Screening package at Norvic.'
    },
    {
      id: 'ad-3',
      title: '24/7 Professional Home Care Nursing',
      subtitle: 'Post-operative care, elderly patient assistance, IV medication at your doorstep',
      tag: 'TOP RATED HOMECARE',
      badge: 'Certified Nurses',
      bgGradient: 'from-emerald-600 to-teal-800',
      actionText: 'Book Nurse to Home',
      category: 'homecare',
      company: 'Everest Homecare & Elderly Support',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hi, I need a verified Homecare Nurse for patient support.'
    },
    {
      id: 'ad-4',
      title: 'Digital High-Resolution 3.0T MRI & CT Scans',
      subtitle: 'Same-day online diagnostic reports with expert Radiologist tele-review',
      tag: 'DIAGNOSTIC EXCELLENCE',
      badge: 'Fast-Track Booking',
      bgGradient: 'from-purple-600 to-indigo-900',
      actionText: 'Reserve Scan Slot',
      category: 'diagnostic',
      company: 'Annapurna Super-Speciality Diagnostics',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hello, I would like to book an MRI/CT appointment.'
    },
    {
      id: 'ad-5',
      title: 'Advanced Spine & Sports Physiotherapy',
      subtitle: 'Relieve back pain, neck strain and sports injuries with personalized rehab',
      tag: 'REHABILITATION',
      badge: 'Free Initial Assessment',
      bgGradient: 'from-amber-600 to-orange-700',
      actionText: 'Consult Physiotherapist',
      category: 'physiotherapy',
      company: 'Himalayan Physio & Joint Care',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hi SAINO, I want to book a physiotherapy consultation.'
    },
    {
      id: 'ad-6',
      title: 'Urgent Blood Availability & Donor Hub',
      subtitle: 'Instant matching for A+, B+, O-, AB- across Kathmandu Valley',
      tag: '24/7 EMERGENCY BLOOD',
      badge: 'Emergency Helpline',
      bgGradient: 'from-red-600 to-rose-900',
      actionText: 'Request Blood Group',
      category: 'bloodbank',
      company: 'Nepal Red Cross LifeLine Blood Hub',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'URGENT: I require blood unit assistance from Blood Bank network.'
    },
    {
      id: 'ad-7',
      title: 'Holistic Naturopathy & Stress Detox',
      subtitle: 'Ayurvedic panchakarma, yoga therapy and mindfulness retreats in Budhanilkantha',
      tag: 'WELLNESS & MENTAL HEALTH',
      badge: 'Special Weekend Package',
      bgGradient: 'from-teal-600 to-emerald-800',
      actionText: 'Book Wellness Package',
      category: 'wellness',
      company: 'Himalayan Zen Wellness Sanctuary',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hello, I am interested in booking the Wellness & Detox retreat.'
    },
    {
      id: 'ad-8',
      title: 'Prescription Delivery & 15% Off Refills',
      subtitle: 'Upload prescription and get genuine medicines delivered in 90 minutes',
      tag: '24/7 PHARMACY',
      badge: '90-Min Delivery',
      bgGradient: 'from-cyan-700 to-blue-900',
      actionText: 'Order Medicines Now',
      category: 'pharmacy',
      company: 'Saino Express Care Pharmacy',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
      whatsappMsg: 'Hi SAINO Pharmacy, I would like to order my prescription medicines.'
    }
  ],

  providers: [
    {
      id: 'prov-1',
      name: 'CityCare Multispeciality Hospital',
      category: 'hospital',
      verification: 'pro', // 'pro' | 'prime' | 'listed'
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.8,
      reviewsCount: 842,
      likesCount: 3420,
      interestedCount: 412,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Aayush Sharma',
      leadDoctorRole: 'Senior Consultant Interventional Cardiologist',
      leadDoctorExperience: '16+ Years Exp · MD, DM (Cardiology)',
      departments: ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Surgery', 'ICU / Emergency'],
      location: 'Kathmandu-31, Minbhawan',
      city: 'Kathmandu',
      openingHours: '24 Hours Emergency · OPD 08:00 AM - 08:00 PM',
      phone: '+977-1-4789000',
      showPhone: true,
      website: 'https://citycarehospital.np',
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=120&auto=format&fit=crop&q=80',
      about: 'CityCare Multispeciality Hospital is a premier tertiary healthcare centre in Kathmandu with state-of-the-art diagnostic labs, 150 beds, advanced cardiac cath lab, and round-the-clock emergency support.',
      services: [
        { name: 'Cardiology OPD Consultation', fee: 'Rs. 900', doctor: 'Dr. Aayush Sharma' },
        { name: 'Orthopedic Knee & Spine OPD', fee: 'Rs. 850', doctor: 'Dr. Binita Shrestha' },
        { name: 'Pediatric Health Checkup', fee: 'Rs. 750', doctor: 'Dr. Suresh Acharya' },
        { name: 'Full Executive Health Package', fee: 'Rs. 6,500', doctor: 'CityCare Diagnostic Team' },
        { name: '24/7 Cardiac Emergency Care', fee: 'Variable', doctor: 'On-Duty Emergency Registrar' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '09:00 AM - 01:00 PM', doctor: 'Dr. Aayush Sharma (Cardiology)' },
        { day: 'Sun - Fri', time: '02:00 PM - 06:00 PM', doctor: 'Dr. Binita Shrestha (Orthopedics)' },
        { day: 'Everyday', time: '24/7 Support', doctor: 'Emergency & Critical Care' }
      ],
      activity: [
        'Organized Free Heart Health Camp in New Baneshwor (450+ patients screened)',
        'Upgraded Cath Lab with high-precision 3D optical coherence tomography',
        'New Pediatric Intensive Care Unit (PICU) inaugurated with 12 beds'
      ],
      photos: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Ramesh Adhikari', rating: 5, date: '2 days ago', comment: 'Dr. Aayush Sharma explained my father’s heart condition with utmost patience. The hospital is very clean and staff is attentive.' },
        { user: 'Pooja Thapa', rating: 4.8, date: '1 week ago', comment: 'Prompt emergency service and swift admission. Highly recommend CityCare for cardiology and internal medicine.' }
      ]
    },
    {
      id: 'prov-2',
      name: 'Grande Metro Polyclinic & Child Care',
      category: 'clinic',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.7,
      reviewsCount: 420,
      likesCount: 1850,
      interestedCount: 230,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Smriti Pradhan',
      leadDoctorRole: 'Child Specialist & Neonatologist',
      leadDoctorExperience: '12+ Years Exp · MD Pediatrics',
      departments: ['Pediatrics', 'Gynecology', 'General Medicine', 'Dental Care'],
      location: 'Maharajgunj, Kathmandu',
      city: 'Kathmandu',
      openingHours: '07:30 AM - 07:30 PM (Sun - Sat)',
      phone: '+977-1-4412345',
      showPhone: true,
      website: 'https://grandemetroclinic.np',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
      about: 'Grande Metro Polyclinic provides friendly family healthcare, specialist pediatric OPD, growth vaccinations, and women’s health consultations.',
      services: [
        { name: 'Child OPD & Growth Assessment', fee: 'Rs. 700', doctor: 'Dr. Smriti Pradhan' },
        { name: 'Gynecology Consultation', fee: 'Rs. 800', doctor: 'Dr. Anupama Karki' },
        { name: 'Standard Child Vaccination Package', fee: 'Rs. 1,200', doctor: 'Pediatric Care Team' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '08:00 AM - 02:00 PM', doctor: 'Dr. Smriti Pradhan' },
        { day: 'Sun - Fri', time: '03:00 PM - 07:00 PM', doctor: 'Dr. Anupama Karki' }
      ],
      activity: [
        'Weekly Sunday Free Child Nutritional Assessment camp',
        'Introduced painless dental cavity filling for toddlers'
      ],
      photos: [
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Suman Ghimire', rating: 5, date: '3 days ago', comment: 'Dr. Smriti is the kindest pediatrician. My daughter was totally relaxed during her checkup!' }
      ]
    },
    {
      id: 'prov-3',
      name: 'Annapurna Advanced Pathology & Imaging',
      category: 'diagnostic',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.9,
      reviewsCount: 650,
      likesCount: 2900,
      interestedCount: 380,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Rajeshwor Gautam',
      leadDoctorRole: 'Chief Radiologist & Lab Director',
      leadDoctorExperience: '19+ Years Exp · MD Radiodiagnosis',
      departments: ['Pathology', 'MRI 3.0 Tesla', 'CT Scan 128 Slice', 'Digital X-Ray', 'Ultrasound 4D', 'Biochemistry'],
      location: 'Pulchowk, Lalitpur',
      city: 'Lalitpur',
      openingHours: '06:30 AM - 09:00 PM (Everyday)',
      phone: '+977-1-5523000',
      showPhone: true,
      website: 'https://annapurnadiagnostics.np',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=120&auto=format&fit=crop&q=80',
      about: 'Equipped with cutting-edge 3.0T MRI, high-speed 128 Slice CT, and automated ISO-certified pathology lab ensuring 99.9% accuracy with zero waiting time.',
      services: [
        { name: 'Whole Body MRI Scan', fee: 'Rs. 12,000', doctor: 'Radiology Team' },
        { name: 'Comprehensive Diabetes & Lipid Profile', fee: 'Rs. 2,100', doctor: 'Biochemistry Lab' },
        { name: '4D Pregnancy Ultrasound with Doppler', fee: 'Rs. 3,200', doctor: 'Dr. Rajeshwor Gautam' },
        { name: 'Home Blood Sample Collection (Free within Ring Road)', fee: 'Rs. 0 + Test Fee', doctor: 'Phlebotomy Care' }
      ],
      availability: [
        { day: 'Sun - Sat', time: '06:30 AM - 08:30 PM', doctor: 'Full Diagnostic Services' }
      ],
      activity: [
        'Automated instant WhatsApp delivery of verified lab reports in PDF format',
        'Received National Lab Quality Excellence Certification 2026'
      ],
      photos: [
        'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Bikash KC', rating: 5, date: 'Yesterday', comment: 'Fastest lab report in Kathmandu. Collected blood at 7 AM at home, got WhatsApp report by 11 AM.' }
      ]
    },
    {
      id: 'prov-4',
      name: 'Himalayan Physio & Spinal Rehabilitation',
      category: 'physiotherapy',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.8,
      reviewsCount: 310,
      likesCount: 1420,
      interestedCount: 195,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Niranjan Pokhrel (PT)',
      leadDoctorRole: 'Senior Musculoskeletal & Sports Physio',
      leadDoctorExperience: '11+ Years Exp · MPT Ortho',
      departments: ['Spine Rehabilitation', 'Sports Injury Care', 'Post-Surgery Mobilization', 'Dry Needling & Cupping'],
      location: 'Jhamsikhel, Lalitpur',
      city: 'Lalitpur',
      openingHours: '07:00 AM - 07:00 PM (Sun - Fri)',
      phone: '+977-1-5548900',
      showPhone: true,
      website: 'https://himalayanphysio.np',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
      about: 'Specialized clinic dedicated to non-surgical treatment of back pain, sciatica, frozen shoulder, ACL rehab, and ergonomic posture correction.',
      services: [
        { name: 'Spine & Sciatica Physio Session', fee: 'Rs. 1,000', doctor: 'Dr. Niranjan Pokhrel' },
        { name: 'Sports Injury & Muscle Rehab', fee: 'Rs. 1,200', doctor: 'Sports Physio Team' },
        { name: 'In-Home Physiotherapy Session', fee: 'Rs. 1,800', doctor: 'Home Therapist' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '07:00 AM - 01:00 PM', doctor: 'Morning Session' },
        { day: 'Sun - Fri', time: '02:00 PM - 07:00 PM', doctor: 'Evening Rehab Slots' }
      ],
      activity: [
        'Conducted Ergonomic Workshop for 3 IT firms in Lalitpur',
        'Introduced High-Intensity Laser Therapy (HILT) for chronic joint pain'
      ],
      photos: [
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Saroj Giri', rating: 5, date: '4 days ago', comment: 'Chronic lower back pain resolved in 6 sessions. Excellent manual therapy!' }
      ]
    },
    {
      id: 'prov-5',
      name: 'Sagarmatha Lumbini Health Shield',
      category: 'insurance',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.7,
      reviewsCount: 512,
      likesCount: 2200,
      interestedCount: 340,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Kishore Baniya',
      leadDoctorRole: 'Head of Health Insurance Underwriting',
      leadDoctorExperience: '14+ Years in Medical Insurance',
      departments: ['Individual Health Insurance', 'Family Floater Plan', 'Corporate Group Medical', 'Critical Illness Cover'],
      location: 'Narayanhiti Path, Durbar Marg',
      city: 'Kathmandu',
      openingHours: '09:00 AM - 05:30 PM (Sun - Fri)',
      phone: '+977-1-4221199',
      showPhone: true,
      website: 'https://salicohealth.np',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80',
      about: 'Nepal’s premier health insurance provider offering cashless claims across 85+ hospitals nationwide with instant approval and transparent claim settlements.',
      services: [
        { name: 'Family Floater Health Plan (Rs. 10 Lakhs Cover)', fee: 'From Rs. 14,500/year', doctor: 'Insurance Advisor' },
        { name: 'Senior Citizen Health Package (Rs. 5 Lakhs)', fee: 'From Rs. 18,000/year', doctor: 'Insurance Advisor' },
        { name: 'Corporate Employee Group Mediclaim', fee: 'Custom Quote', doctor: 'Corporate Manager' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '09:00 AM - 05:00 PM', doctor: 'Claim & Policy Consultations' }
      ],
      activity: [
        'Added 14 new district hospitals to the cashless partner network',
        'Average cashless claim processing time reduced to 25 minutes'
      ],
      photos: [
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Pradeep Joshi', rating: 5, date: '1 week ago', comment: 'Cashless claim at Mediciti was approved in 20 minutes without any hassle. True peace of mind.' }
      ]
    },
    {
      id: 'prov-6',
      name: 'Nepal Red Cross LifeLine Blood Bank',
      category: 'bloodbank',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.9,
      reviewsCount: 920,
      likesCount: 4800,
      interestedCount: 620,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Manisha Upadhyay',
      leadDoctorRole: 'Transfusion Medicine Specialist',
      leadDoctorExperience: '15+ Years Exp · MD Pathology',
      departments: ['Whole Blood', 'Packed Red Blood Cells (PRBC)', 'Platelet Concentrates', 'Fresh Frozen Plasma (FFP)', 'Emergency Dispatch'],
      location: 'Soaltee Mode, Kalimati',
      city: 'Kathmandu',
      openingHours: '24 Hours Open (365 Days)',
      phone: '+977-1-4288484',
      showPhone: true,
      website: 'https://nrcsbloodbank.np',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=120&auto=format&fit=crop&q=80',
      about: 'The central blood transfusion service of Nepal ensuring safe, screened, and pathogen-tested blood products available 24/7 for all emergencies.',
      services: [
        { name: 'Emergency Blood Requisition (PRBC/Whole Blood)', fee: 'Processing Fee Rs. 950', doctor: 'Transfusion Desk' },
        { name: 'Single Donor Platelet (Apheresis)', fee: 'Processing Fee Rs. 8,500', doctor: 'Apheresis Unit' },
        { name: 'Voluntary Blood Donation Drive Booking', fee: 'Free Service', doctor: 'Community Outreach' }
      ],
      availability: [
        { day: 'Everyday', time: '24 Hours Emergency Desk', doctor: 'On-Duty Officer' }
      ],
      activity: [
        'Collected 640 units in Kathmandu Valley Youth Blood Drive',
        'Live blood component inventory sync enabled with SAINO HEALTH'
      ],
      photos: [
        'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Sanjay Shrestha', rating: 5, date: 'Yesterday', comment: 'Got 2 units of O-negative blood in 15 minutes for my mother’s surgery. Lifesavers!' }
      ]
    },
    {
      id: 'prov-7',
      name: 'Everest Homecare & Elderly Support',
      category: 'homecare',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.8,
      reviewsCount: 380,
      likesCount: 1950,
      interestedCount: 290,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Sister Radhika Dhungana',
      leadDoctorRole: 'Head of Clinical Home Nursing',
      leadDoctorExperience: '14+ Years Exp · BN, Critical Care',
      departments: ['24/7 In-Home Nursing', 'Elderly Care & Companionship', 'Home Doctor Visits', 'Post-Op Wound Dressing', 'ICU Setup at Home'],
      location: 'Shankhamul, Kathmandu',
      city: 'Kathmandu',
      openingHours: '24 Hours Support (Care Staff On-Demand)',
      phone: '+977-1-4781122',
      showPhone: true,
      website: 'https://everesthomecare.np',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=120&auto=format&fit=crop&q=80',
      about: 'Nepal’s trusted home healthcare service providing certified nursing staff, doctor house visits, physiotherapy at home, and hospital-grade medical equipment rental.',
      services: [
        { name: '12-Hour Day/Night Nursing Care', fee: 'Rs. 2,200/shift', doctor: 'Registered Staff Nurse' },
        { name: 'Senior Physician Home Visit', fee: 'Rs. 2,500', doctor: 'Dr. Alok Bhattarai' },
        { name: 'Home Oxygen Concentrator Rental', fee: 'Rs. 8,000/month', doctor: 'Equipment Support' },
        { name: 'IV Cannulation & Catheter Care at Home', fee: 'Rs. 950', doctor: 'Home Care Nurse' }
      ],
      availability: [
        { day: 'Everyday', time: '24/7 On-Call Nursing & Doctor Dispatch', doctor: 'Rapid Home Response' }
      ],
      activity: [
        'Trained 30 new geriatric care nurses for dementia & Alzheimer support',
        'Equipped 20 homes with telemetry vital monitoring kits'
      ],
      photos: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Mandira Rayamajhi', rating: 5, date: '3 days ago', comment: 'Nurse Pratima took extraordinary care of my 84-year-old grandfather after his hip surgery.' }
      ]
    },
    {
      id: 'prov-8',
      name: 'Himalayan Zen Wellness Sanctuary',
      category: 'wellness',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.9,
      reviewsCount: 290,
      likesCount: 1680,
      interestedCount: 210,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Achyut Bhandari',
      leadDoctorRole: 'Holistic Physician & Ayurvedic Expert',
      leadDoctorExperience: '13+ Years Exp · BAMS, MD (Ayurveda)',
      departments: ['Ayurvedic Panchakarma', 'Yoga Therapy & Meditation', 'Naturopathy Detox', 'Mental Wellbeing & Counseling'],
      location: 'Budhanilkantha, Kathmandu',
      city: 'Kathmandu',
      openingHours: '06:00 AM - 07:00 PM (Everyday)',
      phone: '+977-1-4375500',
      showPhone: true,
      website: 'https://himalayanzen.np',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=80',
      about: 'A serene mountain-view wellness sanctuary offering traditional Vedic therapies, medical yoga, lifestyle counseling, and organic rejuvenation.',
      services: [
        { name: 'Ayurvedic Doctor Consultation & Prakriti Analysis', fee: 'Rs. 1,000', doctor: 'Dr. Achyut Bhandari' },
        { name: 'Full Body Abhyanga & Shirodhara Detox (90 mins)', fee: 'Rs. 3,500', doctor: 'Senior Therapist' },
        { name: 'Therapeutic Yoga for Back & Stress (1 Month)', fee: 'Rs. 6,000', doctor: 'Yogacharya Devendra' }
      ],
      availability: [
        { day: 'Sun - Sat', time: '06:30 AM - 06:30 PM', doctor: 'Sessions by Prior Booking' }
      ],
      activity: [
        'Completed 7-day silent meditation & gut healing retreat',
        'Awarded Best Wellness Retreat in Bagmati Province'
      ],
      photos: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Sita Devkota', rating: 5, date: '5 days ago', comment: 'Shirodhara treatment completely cured my chronic insomnia. Peaceful environment.' }
      ]
    },
    {
      id: 'prov-9',
      name: 'Saino Express Care 24/7 Pharmacy',
      category: 'pharmacy',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.8,
      reviewsCount: 780,
      likesCount: 3100,
      interestedCount: 420,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Pharm. Roshan Lamichhane',
      leadDoctorRole: 'Chief Clinical Pharmacist',
      leadDoctorExperience: '10+ Years · B.Pharm, M.Pharm',
      departments: ['Prescription Medicines', 'Cold-Chain Insulin & Vaccines', 'Surgical & Diabetic Supplies', 'Fast Home Delivery'],
      location: 'Tripureshwor / Maitighar, Kathmandu',
      city: 'Kathmandu',
      openingHours: '24 Hours Open (365 Days)',
      phone: '+977-1-4265000',
      showPhone: true,
      website: 'https://sainopharmacy.np',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      about: 'Licensed central medical pharmacy with temperature-controlled storage, 100% genuine guaranteed medicines, and express 60-minute delivery across Kathmandu Valley.',
      services: [
        { name: 'Upload Prescription & Free Delivery', fee: 'Actual Med Price (10% Off)', doctor: 'Pharmacist Verification' },
        { name: 'Diabetic Care Bundle (Glucometer + 50 Strips)', fee: 'Rs. 1,850', doctor: 'Medical Device Unit' },
        { name: 'Emergency Night Medicine Dispatch', fee: 'Flat Rs. 150 delivery', doctor: '24/7 Rider Squad' }
      ],
      availability: [
        { day: 'Everyday', time: '24/7 Counter & Online Dispatch', doctor: 'Pharmacists on Duty' }
      ],
      activity: [
        'Dispatched over 12,000 online prescription orders in last month',
        'Partnered with Nepal Diabetes Association for subsidized insulin distribution'
      ],
      photos: [
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Anil Gurung', rating: 5, date: '1 day ago', comment: 'Got my father’s heart medicines in 40 minutes at 11 PM. Extremely dependable!' }
      ]
    },
    {
      id: 'prov-10',
      name: 'Norvic Heart & Vascular Super Centre',
      category: 'hospital',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.9,
      reviewsCount: 1120,
      likesCount: 5200,
      interestedCount: 680,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Bharat Rawat',
      leadDoctorRole: 'Executive Director & Chief Cardiologist',
      leadDoctorExperience: '25+ Years Exp · MD, DM (Cardiology), FACC',
      departments: ['Interventional Cardiology', 'Cardiothoracic Surgery', 'Vascular Surgery', 'Coronary ICU', 'Emergency'],
      location: 'Thapathali, Kathmandu',
      city: 'Kathmandu',
      openingHours: '24 Hours Emergency · OPD 08:00 AM - 06:00 PM',
      phone: '+977-1-4258555',
      showPhone: true,
      website: 'https://norvichospital.np',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=120&auto=format&fit=crop&q=80',
      about: 'Nepal’s pioneer ISO 9001:2015 certified cardiac centre featuring bi-plane cath labs, international-trained surgeons, and intensive coronary recovery suites.',
      services: [
        { name: 'Senior Cardiologist OPD Consultation', fee: 'Rs. 1,200', doctor: 'Dr. Bharat Rawat' },
        { name: 'Coronary Angiography (Radial)', fee: 'Rs. 18,000', doctor: 'Cath Lab Team' },
        { name: '2D Echocardiography & Color Doppler', fee: 'Rs. 3,500', doctor: 'Cardio Non-Invasive Lab' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '10:00 AM - 04:00 PM', doctor: 'Dr. Bharat Rawat' },
        { day: 'Everyday', time: '24/7 Cath Lab Team On-Call', doctor: 'Emergency Angioplasty' }
      ],
      activity: [
        'Successfully completed 10,000+ coronary angioplasties',
        'Launched tele-cardiology clinic for remote districts in Karnali'
      ],
      photos: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Deepak Silwal', rating: 5, date: '2 days ago', comment: 'World-class doctors and outstanding nursing care. The cath lab team saved my brother’s life.' }
      ]
    },
    {
      id: 'prov-11',
      name: 'Kathmandu Smile Dental & Maxillofacial Clinic',
      category: 'clinic',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.4,
      reviewsCount: 140,
      likesCount: 420,
      interestedCount: 55,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Pradeep Bajracharya',
      leadDoctorRole: 'Dental Surgeon & Orthodontist',
      leadDoctorExperience: '8+ Years Exp · BDS, MDS',
      departments: ['Root Canal Treatment', 'Invisalign & Braces', 'Teeth Whitening', 'Dental Implants'],
      location: 'Putalisadak, Kathmandu',
      city: 'Kathmandu',
      openingHours: '10:00 AM - 06:00 PM (Sun - Fri)',
      phone: '', // Not disclosed for free listing
      showPhone: false,
      website: 'https://kathmandusmile.np',
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=120&auto=format&fit=crop&q=80',
      about: 'A modern dental setup in Putalisadak offering painless root canal treatment, clear aligners, and cosmetic smile makeovers.',
      services: [
        { name: 'Dental Consultation & X-Ray', fee: 'Rs. 500', doctor: 'Dr. Pradeep Bajracharya' },
        { name: 'Single-Visit Rotary RCT', fee: 'Rs. 4,500', doctor: 'Endodontist' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '10:00 AM - 06:00 PM', doctor: 'OPD Hours' }
      ],
      activity: [
        'Upgraded digital dental X-ray sensor (RVG)'
      ],
      photos: [
        'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Nabina Shrestha', rating: 4.5, date: '1 month ago', comment: 'Painless teeth cleaning and good advice on flossing.' }
      ]
    },
    {
      id: 'prov-12',
      name: 'Patan LifeCare Ambulance & Critical Transport',
      category: 'clinic',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.8,
      reviewsCount: 260,
      likesCount: 1100,
      interestedCount: 160,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Paramedic Bikram Rimal',
      leadDoctorRole: 'Operations In-Charge & ALS Paramedic',
      leadDoctorExperience: '9+ Years in Emergency Medical Services',
      departments: ['Type-A Ventilator Ambulance', 'Type-B Oxygen Ambulance', 'Inter-Hospital Patient Transfer', 'Air Ambulance Coordination'],
      location: 'Lagankhel, Lalitpur',
      city: 'Lalitpur',
      openingHours: '24 Hours Emergency Dispatch (Everyday)',
      phone: '+977-1-5531000',
      showPhone: true,
      website: 'https://patanlifecare.np',
      image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=120&auto=format&fit=crop&q=80',
      about: 'Rapid-response ambulance fleet equipped with transport ventilators, cardiac monitors, defibrillators, and certified emergency EMTs across Lalitpur and Kathmandu.',
      services: [
        { name: 'Advanced Life Support (ALS) Ambulance with Paramedic', fee: 'From Rs. 3,500/trip', doctor: 'ALS EMT' },
        { name: 'Basic Life Support (BLS) Oxygen Ambulance', fee: 'From Rs. 1,800/trip', doctor: 'BLS EMT' }
      ],
      availability: [
        { day: 'Everyday', time: '24/7 Instant Dispatch', doctor: 'Call Centre Team' }
      ],
      activity: [
        'Average response time under 14 minutes within Ring Road in 2026'
      ],
      photos: [
        'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Gopal Thapa', rating: 5, date: '2 weeks ago', comment: 'Ambulance arrived in 12 minutes in Lagankhel. Paramedic gave immediate oxygen.' }
      ]
    },
    {
      id: 'prov-13',
      name: 'Nepal Eye Care & Microsurgery Foundation',
      category: 'clinic',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.9,
      reviewsCount: 710,
      likesCount: 2800,
      interestedCount: 390,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Sanduk Tuladhar',
      leadDoctorRole: 'Chief Ophthalmologist & Retinal Surgeon',
      leadDoctorExperience: '18+ Years Exp · MS Ophthalmology',
      departments: ['Cataract Surgery (Phaco)', 'LASIK & Refractive Error', 'Glaucoma Care', 'Pediatric Ophthalmology', 'Retina OPD'],
      location: 'Tripureshwor, Kathmandu',
      city: 'Kathmandu',
      openingHours: '08:00 AM - 05:00 PM (Sun - Fri)',
      phone: '+977-1-4261234',
      showPhone: true,
      website: 'https://nepaleyefoundation.np',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
      about: 'World-renowned eye specialist centre dedicated to affordable high-precision cataract removal, custom Wavefront LASIK, and diabetic eye care.',
      services: [
        { name: 'Comprehensive Eye Examination & Vision Test', fee: 'Rs. 400', doctor: 'Optometry Team' },
        { name: 'Senior Ophthalmologist Retina OPD', fee: 'Rs. 900', doctor: 'Dr. Sanduk Tuladhar' },
        { name: 'Femtosecond Bladeless LASIK (Both Eyes)', fee: 'Rs. 75,000', doctor: 'LASIK Surgeon' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '08:30 AM - 04:00 PM', doctor: 'Dr. Sanduk Tuladhar' }
      ],
      activity: [
        'Restored sight to 1,200 rural cataract patients in recent medical camp'
      ],
      photos: [
        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Urmila Khadka', rating: 5, date: '1 week ago', comment: 'Got my blade-free LASIK done last month. Perfect 6/6 vision now without glasses!' }
      ]
    },
    {
      id: 'prov-14',
      name: 'Bhaktapur Diabetic & Thyroid Care Clinic',
      category: 'clinic',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.3,
      reviewsCount: 110,
      likesCount: 310,
      interestedCount: 42,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Umesh Suwal',
      leadDoctorRole: 'Diabetologist & Internal Medicine',
      leadDoctorExperience: '7+ Years Exp · MBBS, MD',
      departments: ['Diabetes Management', 'Thyroid Disorders', 'HbA1c Testing', 'Dietary Counseling'],
      location: 'Suryabinayak, Bhaktapur',
      city: 'Bhaktapur',
      openingHours: '08:00 AM - 02:00 PM (Sun - Fri)',
      phone: '', // Not disclosed
      showPhone: false,
      website: 'https://bhaktapurdiabetic.np',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=120&auto=format&fit=crop&q=80',
      about: 'Local community endocrinology and diabetes screening centre in Suryabinayak.',
      services: [
        { name: 'Diabetic OPD Consultation', fee: 'Rs. 600', doctor: 'Dr. Umesh Suwal' },
        { name: 'HbA1c & Fasting Glucose Package', fee: 'Rs. 850', doctor: 'Lab Staff' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '08:00 AM - 01:30 PM', doctor: 'Dr. Umesh Suwal' }
      ],
      activity: [
        'Monthly free blood sugar check camp on Saturdays'
      ],
      photos: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Radhe Shyam', rating: 4, date: '2 months ago', comment: 'Good local clinic for sugar testing.' }
      ]
    },
    {
      id: 'prov-15',
      name: 'Pokhara Lakeside Multispeciality Hospital',
      category: 'hospital',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.8,
      reviewsCount: 530,
      likesCount: 2400,
      interestedCount: 310,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Kapil Gurung',
      leadDoctorRole: 'Medical Director & Laparoscopic Surgeon',
      leadDoctorExperience: '17+ Years Exp · MS General Surgery',
      departments: ['Laparoscopic Surgery', 'Gastroenterology', 'OB-GYN', 'Emergency 24x7', 'Pediatrics'],
      location: 'Lakeside / Damside, Pokhara',
      city: 'Pokhara',
      openingHours: '24 Hours Emergency · OPD 09:00 AM - 06:00 PM',
      phone: '+977-61-465555',
      showPhone: true,
      website: 'https://pokharalakesidehospital.np',
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=120&auto=format&fit=crop&q=80',
      about: 'The leading private healthcare hub in Gandaki Province serving local residents and international travelers with modern modular OT and ICU facilities.',
      services: [
        { name: 'Laparoscopic Consultation', fee: 'Rs. 800', doctor: 'Dr. Kapil Gurung' },
        { name: 'Gastroscopy & Colonoscopy Package', fee: 'Rs. 5,500', doctor: 'Gastroenterologist' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '09:00 AM - 05:00 PM', doctor: 'Full OPD Roster' }
      ],
      activity: [
        'Added high-altitude altitude sickness emergency treatment chamber'
      ],
      photos: [
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Jennifer Walsh', rating: 5, date: '1 month ago', comment: 'Helped me recover immediately from severe altitude sickness. Very clean and professional.' }
      ]
    },
    {
      id: 'prov-16',
      name: 'Chitwan Cancer Screening & Oncology Care',
      category: 'hospital',
      verification: 'pro',
      badgeLabel: 'SAINO Verified Pro',
      rating: 4.9,
      reviewsCount: 680,
      likesCount: 3100,
      interestedCount: 450,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Praveen Shrestha',
      leadDoctorRole: 'Senior Medical Oncologist',
      leadDoctorExperience: '16+ Years Exp · MD, DM Medical Oncology',
      departments: ['Medical Oncology', 'Chemotherapy Daycare', 'Surgical Oncology', 'Radiation Oncology Consult', 'Palliative Support'],
      location: 'Bharatpur-10, Chitwan',
      city: 'Chitwan',
      openingHours: '08:00 AM - 07:00 PM (Sun - Fri)',
      phone: '+977-56-524000',
      showPhone: true,
      website: 'https://chitwancancercare.np',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=120&auto=format&fit=crop&q=80',
      about: 'Dedicated oncology centre in Bharatpur providing evidence-based cancer screening, customized chemotherapy regimens, and compassionate palliative nursing.',
      services: [
        { name: 'Oncology Specialist Second Opinion OPD', fee: 'Rs. 1,200', doctor: 'Dr. Praveen Shrestha' },
        { name: 'Mammography & Breast Screening Package', fee: 'Rs. 3,000', doctor: 'Radiology Team' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '09:00 AM - 04:30 PM', doctor: 'Dr. Praveen Shrestha' }
      ],
      activity: [
        'Conducted Free Cervical and Breast Cancer screening for 800 women in Chitwan'
      ],
      photos: [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Keshab Neupane', rating: 5, date: '3 weeks ago', comment: 'Compassionate and expert oncology care. The daycare chemo staff is wonderful.' }
      ]
    },
    {
      id: 'prov-17',
      name: 'Nagarjun Spine & Posture Wellness Studio',
      category: 'physiotherapy',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.2,
      reviewsCount: 88,
      likesCount: 210,
      interestedCount: 31,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Sajan Khadka (PT)',
      leadDoctorRole: 'Physiotherapist',
      leadDoctorExperience: '5+ Years Exp · BPT',
      departments: ['Neck Pain Relief', 'Ergonomic Posture Correction', 'Ultrasound Therapy'],
      location: 'Sitapaila, Kathmandu',
      city: 'Kathmandu',
      openingHours: '08:00 AM - 06:00 PM (Sun - Fri)',
      phone: '', // Not disclosed
      showPhone: false,
      website: 'https://nagarjunphysio.np',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
      about: 'Neighborhood physiotherapy studio assisting with neck stiffness and tech-neck syndrome.',
      services: [
        { name: 'Physiotherapy Consultation', fee: 'Rs. 700', doctor: 'Dr. Sajan Khadka' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '08:00 AM - 06:00 PM', doctor: 'Open OPD' }
      ],
      activity: [
        'Started ergonomic desk posture awareness'
      ],
      photos: [
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Milan KC', rating: 4, date: '1 month ago', comment: 'Helpful for my neck pain after long computer work.' }
      ]
    },
    {
      id: 'prov-18',
      name: 'Shikhar Group Health & Medisure Nepal',
      category: 'insurance',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.6,
      reviewsCount: 340,
      likesCount: 1540,
      interestedCount: 220,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Sunil Shakya',
      leadDoctorRole: 'Senior Claims & Risk Manager',
      leadDoctorExperience: '11+ Years in Health Claims',
      departments: ['Micro-Health Insurance', 'SME Group Healthcare', 'Maternity Insurance Rider'],
      location: 'Thapathali, Kathmandu',
      city: 'Kathmandu',
      openingHours: '09:30 AM - 05:00 PM (Sun - Fri)',
      phone: '+977-1-4246000',
      showPhone: true,
      website: 'https://shikharinsurance.np',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80',
      about: 'Custom health insurance coverage for startups, families, and SME enterprises with fast reimbursement options.',
      services: [
        { name: 'SME Health Insurance Package (10+ Staff)', fee: 'From Rs. 4,500/employee', doctor: 'Corporate Desk' },
        { name: 'Maternity Add-on Protection', fee: 'From Rs. 6,000/year', doctor: 'Policy Specialist' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '09:30 AM - 05:00 PM', doctor: 'Sales & Service Desk' }
      ],
      activity: [
        'Introduced 100% digital health claim submission via SAINO integration'
      ],
      photos: [
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Bijay Shrestha', rating: 4.8, date: '2 weeks ago', comment: 'Enrolled our 25 team members with zero paperwork. Fast customer support.' }
      ]
    },
    {
      id: 'prov-19',
      name: 'Biratnagar MediCare Hospital & Trauma Centre',
      category: 'hospital',
      verification: 'prime',
      badgeLabel: 'SAINO Verified Prime',
      rating: 4.7,
      reviewsCount: 410,
      likesCount: 1980,
      interestedCount: 260,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Hemant Yadav',
      leadDoctorRole: 'Trauma & Orthopedic Surgeon',
      leadDoctorExperience: '14+ Years Exp · MS Orthopedics',
      departments: ['Trauma & Emergency', 'Neurosurgery', 'Orthopedics', 'Dialysis Centre', 'ICU'],
      location: 'Main Road, Biratnagar',
      city: 'Biratnagar',
      openingHours: '24 Hours Emergency · OPD 08:30 AM - 06:00 PM',
      phone: '+977-21-530000',
      showPhone: true,
      website: 'https://biratnagarmedicare.np',
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=120&auto=format&fit=crop&q=80',
      about: 'Eastern Nepal’s premier tertiary trauma facility equipped with modern hemodialysis units, modular orthopedic OTs, and 24/7 blood bank.',
      services: [
        { name: 'Orthopedic Consultation & Joint Assessment', fee: 'Rs. 750', doctor: 'Dr. Hemant Yadav' },
        { name: 'Hemodialysis Single Session', fee: 'Rs. 2,800', doctor: 'Nephrology Unit' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '09:00 AM - 05:00 PM', doctor: 'Regular OPD' }
      ],
      activity: [
        'Added 6 new German dialysis machines in the Renal Care wing'
      ],
      photos: [
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Sanjay Mandal', rating: 5, date: '3 weeks ago', comment: 'Best trauma and fracture care in Eastern Nepal.' }
      ]
    },
    {
      id: 'prov-20',
      name: 'Kathmandu Heart & Diabetic Polyclinic',
      category: 'clinic',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.4,
      reviewsCount: 95,
      likesCount: 290,
      interestedCount: 39,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. S. K. Mahato',
      leadDoctorRole: 'Consultant Physician',
      leadDoctorExperience: '10+ Years Exp · MD Internal Med',
      departments: ['General Medicine', 'ECG', 'Blood Pressure Management', 'Blood Sugar Checks'],
      location: 'Koteshwor, Kathmandu',
      city: 'Kathmandu',
      openingHours: '07:30 AM - 07:00 PM (Sun - Fri)',
      phone: '', // Not disclosed
      showPhone: false,
      website: 'https://kathmanduheartclinic.np',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
      about: 'Neighborhood polyclinic in Koteshwor for daily medicine OPD and cardiac triage.',
      services: [
        { name: 'General Physician OPD', fee: 'Rs. 500', doctor: 'Dr. S. K. Mahato' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '08:00 AM - 01:00 PM', doctor: 'Morning Clinic' }
      ],
      activity: [
        'Routine health checkups for senior citizens'
      ],
      photos: [
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Hari Prasad', rating: 4.5, date: '1 month ago', comment: 'Affordable and good for quick BP and blood sugar check.' }
      ]
    },
    {
      id: 'prov-21',
      name: 'Valley Care Home Nursing & Palliative Unit',
      category: 'homecare',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.3,
      reviewsCount: 75,
      likesCount: 190,
      interestedCount: 28,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Staff Nurse Anjali Thapa',
      leadDoctorRole: 'Home Nurse Supervisor',
      leadDoctorExperience: '6+ Years Exp · Staff Nurse',
      departments: ['Basic Home Nursing', 'Wound Dressing', 'Vitals Check at Home'],
      location: 'Chabahil, Kathmandu',
      city: 'Kathmandu',
      openingHours: '08:00 AM - 08:00 PM',
      phone: '', // Not disclosed
      showPhone: false,
      website: 'https://valleycarehome.np',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=120&auto=format&fit=crop&q=80',
      about: 'In-home nurse dispatch for routine catheter changes, injections, and blood pressure monitoring.',
      services: [
        { name: 'Daily Nursing Visit (1 Hour)', fee: 'Rs. 800', doctor: 'Nurse Anjali Thapa' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '08:00 AM - 06:00 PM', doctor: 'Home Visits' }
      ],
      activity: [
        'Provided post-discharge home care for 150 patients'
      ],
      photos: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Sarala Pandey', rating: 4.5, date: '2 months ago', comment: 'Nurse came on time for my mother’s IV injection.' }
      ]
    },
    {
      id: 'prov-22',
      name: 'Nepal Blood Donors Network & Plasma Hub',
      category: 'bloodbank',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.4,
      reviewsCount: 160,
      likesCount: 650,
      interestedCount: 88,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Coordinator Rabin Shahi',
      leadDoctorRole: 'Volunteer Lead & Coordinator',
      leadDoctorExperience: '7+ Years in Donor Mobilization',
      departments: ['Rare Blood Group Match', 'Emergency Volunteer Dispatch', 'Blood Camp Facilitation'],
      location: 'Jawalakhel, Lalitpur',
      city: 'Lalitpur',
      openingHours: '08:00 AM - 08:00 PM (Emergency WhatsApp 24/7)',
      phone: '', // Not disclosed
      showPhone: false,
      website: 'https://nepalblooddonors.np',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=120&auto=format&fit=crop&q=80',
      about: 'Grassroots volunteer network connecting patients with voluntary blood donors in Kathmandu, Lalitpur, and Bhaktapur.',
      services: [
        { name: 'Volunteer Rare Blood Donor Match Request', fee: 'Free Volunteer Service', doctor: 'Volunteer Desk' }
      ],
      availability: [
        { day: 'Everyday', time: '24/7 WhatsApp Requisitions', doctor: 'Helpline' }
      ],
      activity: [
        'Connected 85 rare AB negative blood donors in emergencies'
      ],
      photos: [
        'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Naresh Maharjan', rating: 5, date: '1 month ago', comment: 'Connected with an AB+ donor in 30 minutes.' }
      ]
    },
    {
      id: 'prov-23',
      name: 'Chitwan Ayurveda & Panchakarma Bhavan',
      category: 'wellness',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.5,
      reviewsCount: 120,
      likesCount: 380,
      interestedCount: 49,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Vaidya Mohan Prasad Paudel',
      leadDoctorRole: 'Ayurvedic Practitioner',
      leadDoctorExperience: '20+ Years Exp · BAMS',
      departments: ['Panchakarma', 'Herbal Joint Oil Massage', 'Digestive Disorders', 'Stress Relief'],
      location: 'Narayangarh, Chitwan',
      city: 'Chitwan',
      openingHours: '07:00 AM - 05:00 PM (Sun - Fri)',
      phone: '',
      showPhone: false,
      website: 'https://chitwanayurveda.np',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=80',
      about: 'Traditional Ayurvedic clinic offering classical herbal treatments and joint therapies in Narayangarh.',
      services: [
        { name: 'Ayurvedic Pulse Diagnosis (Nadi Pariksha)', fee: 'Rs. 500', doctor: 'Vaidya Mohan Prasad' },
        { name: 'Kati Basti (Lower Back Herbal Oil Therapy)', fee: 'Rs. 1,500', doctor: 'Therapist' }
      ],
      availability: [
        { day: 'Sun - Fri', time: '07:30 AM - 04:30 PM', doctor: 'OPD Slots' }
      ],
      activity: [
        'Conducted seasonal monsoon detox workshop'
      ],
      photos: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Bhuwan Karki', rating: 4.5, date: '1 month ago', comment: 'Kati basti gave huge relief to my sciatica.' }
      ]
    },
    {
      id: 'prov-24',
      name: 'LifeTrust Medical Diagnostics & Scan Centre',
      category: 'diagnostic',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.2,
      reviewsCount: 85,
      likesCount: 220,
      interestedCount: 30,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Dr. Rita Shakya',
      leadDoctorRole: 'Pathologist',
      leadDoctorExperience: '8+ Years Exp · MD Pathology',
      departments: ['Routine Blood & Urine Tests', 'Digital X-Ray', 'Thyroid Profile', 'ECG'],
      location: 'Gongabu, Kathmandu',
      city: 'Kathmandu',
      openingHours: '07:00 AM - 07:00 PM (Sun - Sat)',
      phone: '',
      showPhone: false,
      website: 'https://lifetrustdiag.np',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=120&auto=format&fit=crop&q=80',
      about: 'Neighborhood diagnostic and laboratory testing facility in Gongabu near New Bus Park.',
      services: [
        { name: 'Complete Blood Count (CBC) + ESR', fee: 'Rs. 450', doctor: 'Lab Staff' }
      ],
      availability: [
        { day: 'Sun - Sat', time: '07:00 AM - 06:30 PM', doctor: 'Lab Desk' }
      ],
      activity: [
        'Upgraded automated 3-part hematology analyzer'
      ],
      photos: [
        'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Tara Gautam', rating: 4, date: '2 months ago', comment: 'Quick CBC test and fair pricing.' }
      ]
    },
    {
      id: 'prov-25',
      name: 'Medicare Community Pharmacy & Surgicals',
      category: 'pharmacy',
      verification: 'listed',
      badgeLabel: 'Saino Listed',
      rating: 4.3,
      reviewsCount: 130,
      likesCount: 340,
      interestedCount: 45,
      isLiked: false,
      isInterested: false,
      leadDoctor: 'Pharm. Binod Dangol',
      leadDoctorRole: 'Pharmacist',
      leadDoctorExperience: '7+ Years · D.Pharm',
      departments: ['Daily Medicines', 'Baby Care', 'First Aid Kits', 'Nebulizers'],
      location: 'Banepa, Kavre',
      city: 'Kavre / Banepa',
      openingHours: '07:00 AM - 09:00 PM (Everyday)',
      phone: '', // Not disclosed
      showPhone: false,
      website: 'https://medicarebanepa.np',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      about: 'Reliable community retail pharmacy in Banepa serving local families and highway commuters.',
      services: [
        { name: 'Prescription Refill & Free BP Check', fee: 'Standard Pricing', doctor: 'Pharmacist' }
      ],
      availability: [
        { day: 'Sun - Sat', time: '07:00 AM - 09:00 PM', doctor: 'Open Counter' }
      ],
      activity: [
        'Stocked pediatric emergency syrups and nebulizer masks'
      ],
      photos: [
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80'
      ],
      reviews: [
        { user: 'Kalyan Giri', rating: 4.5, date: '1 month ago', comment: 'Always stocked with standard medicines.' }
      ]
    }
  ],

  vendorLogos: [
    { id: 'v1', name: 'CityCare Multispeciality', verified: true, tier: 'pro', icon: 'building-2', color: 'blue', isClickable: true, providerId: 'prov-1' },
    { id: 'v2', name: 'Grande Metro Clinic', verified: true, tier: 'prime', icon: 'stethoscope', color: 'emerald', isClickable: true, providerId: 'prov-2' },
    { id: 'v3', name: 'Annapurna Diagnostics', verified: true, tier: 'pro', icon: 'activity', color: 'purple', isClickable: true, providerId: 'prov-3' },
    { id: 'v4', name: 'Himalayan Physio Care', verified: true, tier: 'prime', icon: 'heart-pulse', color: 'amber', isClickable: true, providerId: 'prov-4' },
    { id: 'v5', name: 'Sagarmatha Health Shield', verified: true, tier: 'pro', icon: 'shield-check', color: 'cyan', isClickable: true, providerId: 'prov-5' },
    { id: 'v6', name: 'Red Cross LifeLine Blood', verified: true, tier: 'pro', icon: 'droplets', color: 'red', isClickable: true, providerId: 'prov-6' },
    { id: 'v7', name: 'Everest Homecare & Nursing', verified: true, tier: 'pro', icon: 'home', color: 'indigo', isClickable: true, providerId: 'prov-7' },
    { id: 'v8', name: 'Himalayan Zen Sanctuary', verified: true, tier: 'prime', icon: 'sparkles', color: 'rose', isClickable: true, providerId: 'prov-8' },
    { id: 'v9', name: 'Saino Express Pharmacy', verified: true, tier: 'pro', icon: 'pill', color: 'teal', isClickable: true, providerId: 'prov-9' },
    { id: 'v10', name: 'Norvic Heart Institute', verified: true, tier: 'pro', icon: 'heart', color: 'red', isClickable: true, providerId: 'prov-10' },
    { id: 'v11', name: 'Kathmandu Smile Dental', verified: false, tier: 'listed', icon: 'smile', color: 'gray', isClickable: false, providerId: 'prov-11' },
    { id: 'v12', name: 'Patan LifeCare Ambulance', verified: true, tier: 'prime', icon: 'truck', color: 'blue', isClickable: true, providerId: 'prov-12' },
    { id: 'v13', name: 'Nepal Eye Care Foundation', verified: true, tier: 'pro', icon: 'eye', color: 'emerald', isClickable: true, providerId: 'prov-13' },
    { id: 'v14', name: 'Bhaktapur Diabetic Clinic', verified: false, tier: 'listed', icon: 'thermometer', color: 'gray', isClickable: false, providerId: 'prov-14' },
    { id: 'v15', name: 'Pokhara Lakeside Hospital', verified: true, tier: 'prime', icon: 'building-2', color: 'teal', isClickable: true, providerId: 'prov-15' },
    { id: 'v16', name: 'Chitwan Cancer Screening', verified: true, tier: 'pro', icon: 'cross', color: 'indigo', isClickable: true, providerId: 'prov-16' },
    { id: 'v17', name: 'Nagarjun Spine Studio', verified: false, tier: 'listed', icon: 'activity', color: 'gray', isClickable: false, providerId: 'prov-17' },
    { id: 'v18', name: 'Shikhar Medisure Nepal', verified: true, tier: 'prime', icon: 'shield', color: 'purple', isClickable: true, providerId: 'prov-18' },
    { id: 'v19', name: 'Biratnagar MediCare', verified: true, tier: 'prime', icon: 'building-2', color: 'blue', isClickable: true, providerId: 'prov-19' },
    { id: 'v20', name: 'Kathmandu Heart Clinic', verified: false, tier: 'listed', icon: 'heart', color: 'gray', isClickable: false, providerId: 'prov-20' },
    { id: 'v21', name: 'Valley Care Home Nursing', verified: false, tier: 'listed', icon: 'home', color: 'gray', isClickable: false, providerId: 'prov-21' },
    { id: 'v22', name: 'Nepal Donors Network', verified: false, tier: 'listed', icon: 'droplet', color: 'gray', isClickable: false, providerId: 'prov-22' },
    { id: 'v23', name: 'Chitwan Ayurveda Bhavan', verified: false, tier: 'listed', icon: 'leaf', color: 'gray', isClickable: false, providerId: 'prov-23' },
    { id: 'v24', name: 'LifeTrust Diagnostics', verified: false, tier: 'listed', icon: 'microscope', color: 'gray', isClickable: false, providerId: 'prov-24' },
    { id: 'v25', name: 'Medicare Banepa Pharmacy', verified: false, tier: 'listed', icon: 'pill', color: 'gray', isClickable: false, providerId: 'prov-25' },
    { id: 'v26', name: 'Baneshwor Mother & Child Care', verified: false, tier: 'listed', icon: 'baby', color: 'gray', isClickable: false, providerId: null },
    { id: 'v27', name: 'Lalitpur Orthopedic Trauma Hub', verified: false, tier: 'listed', icon: 'bone', color: 'gray', isClickable: false, providerId: null },
    { id: 'v28', name: 'Swasthya Nepal 24/7 Tele-Med', verified: false, tier: 'listed', icon: 'video', color: 'gray', isClickable: false, providerId: null },
    { id: 'v29', name: 'Bagmati Renal Dialysis Centre', verified: false, tier: 'listed', icon: 'activity', color: 'gray', isClickable: false, providerId: null },
    { id: 'v30', name: 'Universal Dental Implants Nepal', verified: false, tier: 'listed', icon: 'smile', color: 'gray', isClickable: false, providerId: null }
  ],


  subscriptionTiers: [
    {
      id: 'saino_listed',
      name: 'FREE LISTING',
      badge: 'SAINO Free Listing',
      price: 'NPR 0 / Free',
      annualPrice: 'NPR 0 / year',
      period: 'Basic marketplace presence',
      highlight: false,
      features: [
        'Provider profile, logo and facility photos',
        'Address, contact number and opening hours',
        'Up to 2 basic services',
        'Limited booking and comment features',
        'Standard marketplace visibility'
      ],
      cta: 'Start Free Listing',
      type: 'free'
    },
    {
      id: 'saino_pro',
      name: 'SAINO VERIFIED (VIP)',
      badge: 'SAINO Verified Trust Badge',
      price: 'Contact SAINO',
      annualPrice: 'Contact SAINO',
      period: 'Plan and pricing confirmed by SAINO',
      highlight: true,
      popularTag: 'TRUSTED PROVIDER',
      features: [
        'Everything in Free Listing',
        'Up to 5 services',
        'View patient reviews and comments',
        'Reply to patient reviews',
        'SAINO Verified Trust Badge after verification'
      ],
      cta: 'Request VIP plan',
      type: 'paid'
    },
    {
      id: 'saino_prime',
      name: 'SAINO VVIP',
      badge: 'SAINO VVIP Trust Badge',
      price: 'Contact SAINO',
      annualPrice: 'Contact SAINO',
      period: 'Plan and pricing confirmed by SAINO',
      highlight: false,
      popularTag: 'ADVANCED GROWTH',
      features: [
        'Everything in SAINO Verified (VIP)',
        'Up to 15 services',
        'Advanced marketplace analytics',
        'Search campaigns',
        'Higher marketplace visibility',
        'SAINO VVIP Trust Badge after verification'
      ],
      cta: 'Request VVIP plan',
      type: 'paid'
    }
  ],

  // Community Engagement / "Talk of the Town" (Page 11 Requirement)
  talkOfTheTown: [
    {
      id: 'talk-1',
      category: 'Review and Talk of Town',
      icon: 'sparkles',
      author: 'Aayusha Koirala',
      role: 'Verified Patient',
      provider: 'CityCare Multispeciality Hospital',
      tag: 'Trending Review',
      title: 'Seamless emergency cardiac care at 2 AM',
      body: 'When my uncle suffered acute chest pain at midnight, CityCare’s WhatsApp hotline answered immediately and prepared the cath lab before we arrived. Truly life-saving coordination.'
    },
    {
      id: 'talk-2',
      category: "Hospital's Talk",
      icon: 'building-2',
      author: 'Dr. Bharat Rawat',
      role: 'Executive Director, Norvic Heart Institute',
      provider: 'Norvic Heart & Vascular',
      tag: 'Hospital Announcement',
      title: 'Zero-Waiting Coronary Angioplasty Protocol',
      body: 'We are thrilled to announce that SAINO HEALTH users can now reserve priority emergency slots directly via WhatsApp with zero admission queuing.'
    },
    {
      id: 'talk-3',
      category: 'Best Clinic Talk',
      icon: 'stethoscope',
      author: 'Dr. Smriti Pradhan',
      role: 'Child Specialist, Grande Metro Clinic',
      provider: 'Grande Metro Polyclinic',
      tag: 'Pediatric Care Insight',
      title: 'Managing Seasonal Flu and Toddler Respiratory Health',
      body: 'With sudden temperature drops in Kathmandu Valley, keep children hydrated and ensure timely vaccinations. We are conducting free growth consultations every Sunday through SAINO.'
    }
  ],

  // Advertising & Boost FAQ 
  boostFaqs: [
    {
      q: 'How does SAINO Boost improve my hospital or clinic visibility?',
      a: 'SAINO Boost places your healthcare facility at the top of category searches (e.g. "Cardiologist in Kathmandu") and on the home page promotional carousel seen by over 80,000 monthly patients.'
    },
    {
      q: 'How are WhatsApp bookings tracked in the analytics dashboard?',
      a: 'SAINO VVIP providers receive marketplace metrics for profile views, searches, bookings, and service interest.'
    },
    {
      q: 'What is required for the SAINO Verified Badge?',
      a: 'Our compliance team verifies your government registration (DDA / Ministry of Health / NMC registration), doctor credentials, and premises hygiene before awarding the Verified badge.'
    },
    {
      q: 'Can insurance companies and diagnostic labs run targeted banner ads?',
      a: 'Yes! Advertisers can launch custom sponsored banners, category takeover promotions, and health package campaigns with flexible daily or monthly budgets.'
    }
  ],

  patientReviews: [
    {
      id: 'rev-1',
      title: "Life-saving Coordination",
      body: "When my uncle suffered acute chest pain at midnight, CityCare’s WhatsApp hotline answered immediately and prepared the cath lab before we arrived. Truly life-saving coordination.",
      author: "Ramesh Sharma",
      role: "Family Member",
      provider: "CityCare Hospital",
      rating: 5
    },
    {
      id: 'rev-2',
      title: "Prompt Emergency Care",
      body: "The emergency department at Grande was incredibly efficient. My father was admitted within minutes and the staff was professional throughout.",
      author: "Priya Maharjan",
      role: "Daughter",
      provider: "Grande International Hospital",
      rating: 5
    },
    {
      id: 'rev-3',
      title: "Good Cardiologist",
      body: "Good cardiologist but the waiting time is long. Arrived at 10am, waited nearly 2 hours before seeing Dr. Shrestha. The consultation was thorough.",
      author: "Rajesh Thapa",
      role: "Patient",
      provider: "Norvic International Hospital",
      rating: 4
    },
    {
      id: 'rev-4',
      title: "Excellent Physiotherapy",
      body: "Three weeks of treatment for my knee injury and I'm back to normal. The therapists genuinely care.",
      author: "Sunita Gurung",
      role: "Patient",
      provider: "HAMS Hospital",
      rating: 5
    }
  ],

  talkOfTheTown: [
    {
      id: 'talk-1',
      category: 'Review and Talk of Town',
      icon: 'sparkles',
      author: 'Aayusha Koirala',
      role: 'Verified Patient',
      provider: 'CityCare Multispeciality Hospital',
      tag: 'Trending Review',
      title: 'Seamless emergency cardiac care at 2 AM',
      body: 'When my uncle suffered acute chest pain at midnight, CityCare’s WhatsApp hotline answered immediately and prepared the cath lab before we arrived. Truly life-saving coordination.'
    },
    {
      id: 'talk-2',
      category: "Hospital's Talk",
      icon: 'building-2',
      author: 'Dr. Bharat Rawat',
      role: 'Executive Director, Norvic Heart Institute',
      provider: 'Norvic Heart & Vascular',
      tag: 'Hospital Announcement',
      title: 'Zero-Waiting Coronary Angioplasty Protocol',
      body: 'We are thrilled to announce that SAINO HEALTH users can now reserve priority emergency slots directly via WhatsApp with zero admission queuing.'
    },
    {
      id: 'talk-3',
      category: 'Best Clinic Talk',
      icon: 'stethoscope',
      author: 'Dr. Smriti Pradhan',
      role: 'Child Specialist, Grande Metro Clinic',
      provider: 'Grande Metro Polyclinic',
      tag: 'Pediatric Care Insight',
      title: 'Managing Seasonal Flu and Toddler Respiratory Health',
      body: 'With sudden temperature drops in Kathmandu Valley, keep children hydrated and ensure timely vaccinations. We are conducting free growth consultations every Sunday through SAINO.'
    }
  ],

  bigScreenCampaigns: [
    {
      id: 'camp-1',
      title: 'Kathmandu Valley Emergency Bloodline 2026',
      subtitle: '24/7 Rare Blood Group Donor Matching & Live Component Inventory Network',
      tagline: 'EVERY DROP CONNECTS A LIFE',
      tag: 'NATIONWIDE EMERGENCY DRIVE',
      category: 'bloodbank',
      sponsor: 'Nepal Red Cross LifeLine Blood Bank',
      sponsorLogo: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=120&auto=format&fit=crop&q=80',
      sponsorTier: 'SAINO Verified Pro',
      bgGradient: 'from-rose-900 via-red-800 to-slate-950',
      accentColor: 'rose',
      bannerImage: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=1200&auto=format&fit=crop&q=80',
      discountBadge: '100% Free Volunteer Triage',
      stats: [
        { label: 'Active Donors', val: '12,500+' },
        { label: 'Avg Match Time', val: '18 Mins' },
        { label: 'Emergency Hotline', val: '24/7 Live' }
      ],
      highlights: [
        'Instant WhatsApp dispatch for rare negative blood groups (O-, A-, B-, AB-)',
        'Direct connection to 14 hospital blood banks across Kathmandu & Lalitpur',
        'Digital donor card & certificate issued within 24 hours'
      ],
      validTill: 'Open 365 Days',
      whatsappMsg: 'URGENT: I need emergency blood matching support from the SAINO Red Cross Bloodline.'
    },
    {
      id: 'camp-2',
      title: 'Norvic Zero-Wait Cardiac Cath Lab Angioplasty Drive',
      subtitle: 'Senior Interventional Cardiologists on 24/7 Standby with Cashless Hospitalization',
      tagline: 'RAPID CARDIAC RESCUE',
      tag: 'EXECUTIVE SUPER-SPECIALITY',
      category: 'hospital',
      sponsor: 'Norvic Heart & Vascular Institute',
      sponsorLogo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=120&auto=format&fit=crop&q=80',
      sponsorTier: 'SAINO Verified Pro',
      bgGradient: 'from-blue-950 via-slate-900 to-indigo-950',
      accentColor: 'blue',
      bannerImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80',
      discountBadge: 'Save Rs. 2,500 on Screening',
      stats: [
        { label: 'Surgeries Done', val: '10,000+' },
        { label: 'Cath Lab Tech', val: '3D Optical OCT' },
        { label: 'Cashless Support', val: '85+ Insurances' }
      ],
      highlights: [
        'Comprehensive 6-point Heart Screening (ECG, 2D Echo, Lipid, Cardiologist Consultation)',
        'Direct WhatsApp bed reservation for critical cardiac triage',
        'Radial artery minimally invasive angioplasty with 24-hr discharge'
      ],
      validTill: 'Valid until December 2026',
      whatsappMsg: 'Hello Norvic Cardiac Desk, I would like to book the Heart Screening Package via SAINO.'
    },
    {
      id: 'camp-3',
      title: 'Sagarmatha Family Cashless Health Shield 2026',
      subtitle: 'Up to Rs. 10 Lakhs Annual Medical Coverage with Instant Hospital Desk Approvals',
      tagline: 'FINANCIAL PEACE OF MIND',
      tag: 'GROUP & INDIVIDUAL MEDICLAIM',
      category: 'insurance',
      sponsor: 'Sagarmatha Lumbini Insurance',
      sponsorLogo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80',
      sponsorTier: 'SAINO Verified Pro',
      bgGradient: 'from-cyan-950 via-teal-900 to-slate-950',
      accentColor: 'cyan',
      bannerImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80',
      discountBadge: '25% Annual Family Discount',
      stats: [
        { label: 'Hospital Network', val: '85+ Hospitals' },
        { label: 'Claim Approval', val: '< 25 Mins' },
        { label: 'Max Coverage', val: 'Rs. 10 Lakhs' }
      ],
      highlights: [
        'Cashless OPD, surgery, ICU, and day-care procedures covered nationwide',
        'Zero waiting period for accidental and emergency admissions',
        '100% digital claim submission directly integrated with SAINO Health'
      ],
      validTill: 'Open Enrollment 2026',
      whatsappMsg: 'Hi SAINO Insurance Desk, please share a customized quote for the Family Health Shield.'
    },
    {
      id: 'camp-4',
      title: 'High-Precision 3.0T MRI & Tele-Radiology Fast-Track',
      subtitle: 'Same-Day Online Diagnostic Reports with Senior Radiologist Audio Review',
      tagline: 'ACCURATE DIAGNOSTICS FIRST',
      tag: 'STATE-OF-THE-ART IMAGING',
      category: 'diagnostic',
      sponsor: 'Annapurna Advanced Diagnostics',
      sponsorLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=120&auto=format&fit=crop&q=80',
      sponsorTier: 'SAINO Verified Pro',
      bgGradient: 'from-purple-950 via-indigo-900 to-slate-950',
      accentColor: 'purple',
      bannerImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      discountBadge: 'Free Home Blood Pickup',
      stats: [
        { label: 'Scan Accuracy', val: '99.9%' },
        { label: 'Report Delivery', val: '< 2 Hours' },
        { label: 'ISO Standard', val: 'ISO 15189' }
      ],
      highlights: [
        'High-resolution quiet 3.0 Tesla MRI scanner reducing claustrophobia',
        'Automated PDF report and scan slices sent directly to WhatsApp',
        'Free home blood collection across Kathmandu, Lalitpur, and Bhaktapur'
      ],
      validTill: 'All Year Round',
      whatsappMsg: 'Hello Annapurna Diagnostics, I want to reserve a fast-track 3.0T MRI slot via SAINO.'
    },
    {
      id: 'camp-5',
      title: 'Patan LifeCare 24/7 Ventilator Ambulance Fleet',
      subtitle: 'Advanced Life Support (ALS) with Certified Emergency EMTs Across Kathmandu Valley',
      tagline: '14-MINUTE RAPID RESCUE',
      tag: 'CRITICAL TRANSPORT DISPATCH',
      category: 'clinic',
      sponsor: 'Patan LifeCare Emergency EMS',
      sponsorLogo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=120&auto=format&fit=crop&q=80',
      sponsorTier: 'SAINO Verified Prime',
      bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
      accentColor: 'emerald',
      bannerImage: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=1200&auto=format&fit=crop&q=80',
      discountBadge: 'Fixed Transparent Fares',
      stats: [
        { label: 'Avg City ETA', val: '14 Mins' },
        { label: 'Fleet Type', val: 'ALS Ventilator' },
        { label: 'Valley Coverage', val: '100% Ring Road' }
      ],
      highlights: [
        'Equipped with Hamilton transport ventilators, multi-para monitors, and defibrillators',
        'Instant GPS live tracking and direct hospital trauma bay handover',
        'Inter-city and air ambulance coordination available on request'
      ],
      validTill: '24/7 Emergency Dispatch',
      whatsappMsg: 'EMERGENCY: Need urgent ALS Ambulance dispatch to my location via SAINO.'
    },
    {
      id: 'camp-6',
      title: 'Everest In-Home Post-Op Nursing & Elderly Care',
      subtitle: 'Qualified Staff Nurses & Geriatric Attendants at Your Doorstep',
      tagline: 'COMPASSIONATE HOME HEALTH',
      tag: 'CERTIFIED IN-HOME NURSING',
      category: 'homecare',
      sponsor: 'Everest Homecare & Support',
      sponsorLogo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=120&auto=format&fit=crop&q=80',
      sponsorTier: 'SAINO Verified Pro',
      bgGradient: 'from-amber-950 via-slate-900 to-orange-950',
      accentColor: 'amber',
      bannerImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1200&auto=format&fit=crop&q=80',
      discountBadge: '15% Off 1st Month Care',
      stats: [
        { label: 'Active Nurses', val: '50+ BN/Staff' },
        { label: 'Patient Rating', val: '4.8 ★' },
        { label: 'Shifts', val: '12h / 24h Care' }
      ],
      highlights: [
        'Post-surgical wound management, catheter changes, and IV medication administration',
        'Elderly dementia and mobility assistance with continuous vital monitoring',
        'Physician house-call and hospital-grade oxygen rental support'
      ],
      validTill: 'Monthly Flexible Booking',
      whatsappMsg: 'Hello Everest Homecare, I would like to book a verified homecare nurse.'
    }
  ],

  
  sainoRated: {
    hospitals: [
      { id: 'h-1', name: 'Norvic Heart & Vascular Institute', area: 'Thapathali, Kathmandu', rating: 4.9, reviews: 340, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '24/7 Emergency & ICU', fee: 'Rs. 950', phone: '+977-1-5970032', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80', special: 'Cath Lab, Angioplasty, Cardiac ICU' },
      { id: 'h-2', name: 'CityCare Multispeciality Hospital', area: 'Lazimpat, Kathmandu', rating: 4.8, reviews: 240, badge: 'SAINO VIP', badgeType: 'vip', opd: '08:00 AM - 08:00 PM', fee: 'Rs. 750', phone: '+977-1-4428900', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80', special: 'Internal Medicine, Neuro, Pediatrics' },
      { id: 'h-3', name: 'Pokhara Lakeside Hospital', area: 'Lakeside, Pokhara', rating: 4.7, reviews: 185, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:00 AM - 08:00 PM', fee: 'Rs. 600', phone: '+977-61-465800', image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80', special: 'Tourist Trauma Care, General Surgery' },
      { id: 'h-4', name: 'Biratnagar MediCare Hospital', area: 'Main Road, Biratnagar', rating: 4.7, reviews: 195, badge: 'SAINO PRO', badgeType: 'pro', opd: '08:00 AM - 07:00 PM', fee: 'Rs. 600', phone: '+977-21-524100', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80', special: 'Cardiology, Renal Dialysis, Trauma' },
      { id: 'h-5', name: 'Grande Metro Speciality Hospital Partner', area: 'Dhapasi, Kathmandu', rating: 4.8, reviews: 310, badge: 'SAINO VIP', badgeType: 'vip', opd: '24/7 Trauma & OPD', fee: 'Rs. 900', phone: '+977-1-5159266', image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80', special: 'Joint Replacement, Spine Surgery, Oncology' },
      { id: 'h-6', name: 'Patan LifeCare Medical Center', area: 'Lagankhel, Lalitpur', rating: 4.6, reviews: 220, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:30 AM - 07:30 PM', fee: 'Rs. 550', phone: '+977-1-5522100', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', special: 'Mother & Child Care, Laparoscopy' },
      { id: 'h-7', name: 'Kathmandu Model Hospital Triage', area: 'Exhibition Road, Kathmandu', rating: 4.5, reviews: 280, badge: 'SAINO LISTED', badgeType: 'listed', opd: '08:00 AM - 05:00 PM', fee: 'Rs. 450', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80', special: 'Affordable Surgery, Community OPD' },
      { id: 'h-8', name: 'Nepal MedCity Speciality Partner Hub', area: 'Bhaisepati, Lalitpur', rating: 4.9, reviews: 420, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '24/7 Emergency Care', fee: 'Rs. 1,000', phone: '+977-1-4217766', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80', special: 'Robotic Surgery, Bone Marrow Transplant' },
      { id: 'h-9', name: 'Civil Service Hospital Triage Station', area: 'Minbhawan, Kathmandu', rating: 4.6, reviews: 215, badge: 'SAINO LISTED', badgeType: 'listed', opd: '08:30 AM - 04:30 PM', fee: 'Rs. 350', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80', special: 'Hematology, Surgical Oncology' },
      { id: 'h-10', name: 'B&B Trauma & Orthopedic Speciality', area: 'Gwarko, Lalitpur', rating: 4.8, reviews: 360, badge: 'SAINO VIP', badgeType: 'vip', opd: '24/7 Trauma Emergency', fee: 'Rs. 850', phone: '+977-1-5531930', image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80', special: 'Polytrauma, Arthroscopy, Hand Surgery' }
    ],

    clinics: [
      { id: 'c-1', name: 'Grande Metro Dental & ENT Clinic', area: 'Maharajgunj, Kathmandu', rating: 4.8, reviews: 180, badge: 'SAINO PRO', badgeType: 'pro', opd: '08:00 AM - 07:00 PM', fee: 'Rs. 600', phone: '+977-1-4720100', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80', special: 'Dental Implants, Micro-Ear Surgery' },
      { id: 'c-2', name: 'Nepal Eye Care Laser Foundation', area: 'Tripureshwor, Kathmandu', rating: 4.9, reviews: 290, badge: 'SAINO VIP', badgeType: 'vip', opd: '07:30 AM - 06:00 PM', fee: 'Rs. 500', phone: '+977-1-4261100', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', special: 'Retina Scan, SMILE Laser Eye Correction' },
      { id: 'c-3', name: 'Himalayan Physio & Sports Rehab', area: 'Baneshwor, Kathmandu', rating: 4.7, reviews: 145, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:00 AM - 07:30 PM', fee: 'Rs. 700', phone: '+977-1-4785400', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80', special: 'Dry Needling, Post-Op Joint Mobility' },
      { id: 'c-4', name: 'Kathmandu Smile Cosmetic Dentistry', area: 'New Road, Kathmandu', rating: 4.6, reviews: 110, badge: 'SAINO LISTED', badgeType: 'listed', opd: '09:00 AM - 06:00 PM', fee: 'Rs. 400', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80', special: 'Teeth Whitening, Root Canal (RCT)' },
      { id: 'c-5', name: 'Bhaktapur Diabetic & Thyroid Center', area: 'Suryabinayak, Bhaktapur', rating: 4.5, reviews: 98, badge: 'SAINO LISTED', badgeType: 'listed', opd: '08:00 AM - 05:00 PM', fee: 'Rs. 450', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80', special: 'Continuous Glucose Monitoring, Dietetics' },
      { id: 'c-6', name: 'Kathmandu Heart & ECG Clinic', area: 'Putalisadak, Kathmandu', rating: 4.6, reviews: 125, badge: 'SAINO LISTED', badgeType: 'listed', opd: '08:00 AM - 06:00 PM', fee: 'Rs. 500', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80', special: 'TMT Stress Test, 24-hr Holter Monitor' },
      { id: 'c-7', name: 'Nagarjun Spine & Posture Studio', area: 'Sitapaila, Kathmandu', rating: 4.7, reviews: 140, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:30 AM - 07:00 PM', fee: 'Rs. 750', phone: '+977-1-4281200', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80', special: 'Chiropractic Adjustment, Ergonomics' },
      { id: 'c-8', name: 'Chitwan Cancer Screening & Daycare', area: 'Bharatpur, Chitwan', rating: 4.8, reviews: 160, badge: 'SAINO VIP', badgeType: 'vip', opd: '08:00 AM - 06:00 PM', fee: 'Rs. 650', phone: '+977-56-521900', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', special: 'Mammography, Pap Smear, Day Chemotherapy' },
      { id: 'c-9', name: 'Baneshwor Mother & Pediatric Center', area: 'Old Baneshwor, Kathmandu', rating: 4.7, reviews: 130, badge: 'SAINO PRO', badgeType: 'pro', opd: '08:00 AM - 07:30 PM', fee: 'Rs. 550', phone: '+977-1-4471900', image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&auto=format&fit=crop&q=80', special: 'Childhood Vaccines, Growth Milestones' },
      { id: 'c-10', name: 'Lalitpur Orthopedic & Arthritis Clinic', area: 'Kumaripati, Lalitpur', rating: 4.6, reviews: 115, badge: 'SAINO LISTED', badgeType: 'listed', opd: '08:30 AM - 06:30 PM', fee: 'Rs. 500', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80', special: 'Hyaluronic Injections, Knee Arthroscopy OPD' }
    ],

    diagnostics: [
      { id: 'd-1', name: 'Annapurna Advanced Diagnostics & 3.0T MRI', area: 'Maitighar, Kathmandu', rating: 4.9, reviews: 310, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '06:30 AM - 08:30 PM', fee: 'Rs. 8,500 (MRI)', phone: '+977-1-4265400', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80', special: '3.0 Tesla MRI, 128-Slice Cardiac CT, 4D USG' },
      { id: 'd-2', name: 'LifeTrust Medical Diagnostics', area: 'Gongabu, Kathmandu', rating: 4.4, reviews: 85, badge: 'SAINO LISTED', badgeType: 'listed', opd: '07:00 AM - 07:00 PM', fee: 'Rs. 450 (CBC)', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80', special: 'Digital X-Ray, Thyroid Profiles, Liver Function' },
      { id: 'd-3', name: 'Quest Diagnostic PathLab Nepal', area: 'Jawalakhel, Lalitpur', rating: 4.8, reviews: 195, badge: 'SAINO VIP', badgeType: 'vip', opd: '06:30 AM - 08:00 PM', fee: 'Rs. 1,200 (Whole Body)', phone: '+977-1-5539200', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', special: 'Cancer Biomarkers, Autoimmune Panels, Hormones' },
      { id: 'd-4', name: 'Star High-Precision Imaging & Ultrasound', area: 'Sanepa, Lalitpur', rating: 4.7, reviews: 140, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:00 AM - 07:00 PM', fee: 'Rs. 1,800 (USG)', phone: '+977-1-5551900', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80', special: 'Color Doppler, Fetal Anomaly Scan, Elastography' },
      { id: 'd-5', name: 'CityCare Molecular Scanning Center', area: 'Lazimpat, Kathmandu', rating: 4.8, reviews: 165, badge: 'SAINO VIP', badgeType: 'vip', opd: '07:00 AM - 07:30 PM', fee: 'Rs. 3,500 (CT)', phone: '+977-1-4428910', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80', special: 'HRCT Chest, Bone Densitometry (DEXA), Biopsy' }
    ],

    ambulances: [
      { id: 'a-1', name: 'Patan LifeCare 24/7 ALS Ventilator Ambulance Fleet', area: 'Kathmandu Valley Wide', rating: 4.9, reviews: 290, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '24/7 Instant Dispatch', fee: 'Avg. ETA: 14 Min', phone: '+977-1-5522999', image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop&q=80', special: 'Hamilton Ventilator, Defibrillator, EMT Paramedic' },
      { id: 'a-2', name: 'Nepal Red Cross Emergency Ambulance Service', area: 'All Major Districts', rating: 4.8, reviews: 380, badge: 'SAINO VIP', badgeType: 'vip', opd: '24/7 Dial 102', fee: 'Subsidized NGO', phone: '102 / +977-1-4288000', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80', special: 'Basic Life Support, Oxygen, Trauma Spine Board' },
      { id: 'a-3', name: 'CityCare Critical Neonatal & Adult Transport EMS', area: 'Ring Road & Beyond', rating: 4.8, reviews: 175, badge: 'SAINO PRO', badgeType: 'pro', opd: '24/7 ICU on Wheels', fee: 'Fixed Transparent', phone: '+977-1-4428999', image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop&q=80', special: 'Neonatal Transport Incubator, Multi-Para Monitor' },
      { id: 'a-4', name: 'LifeLine Rapid Highway Trauma Responder', area: 'Kathmandu-Mugling-Pokhara', rating: 4.7, reviews: 120, badge: 'SAINO PRO', badgeType: 'pro', opd: '24/7 Highway Rescue', fee: 'Standard Rate', phone: '+977-9801223344', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80', special: 'Extrication Tools, Blood Cooler, ALS Monitor' },
      { id: 'a-5', name: 'Everest Air & Ground Medical Evacuation', area: 'Nationwide Nepal', rating: 4.9, reviews: 210, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '24/7 Helipad & Ground', fee: 'Insurance Direct', phone: '+977-1-4488900', image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop&q=80', special: 'Helicopter Rescue Triage, Critical Doctor Onboard' }
    ],

    labs: [
      { id: 'l-1', name: 'National Reference Pathology Laboratory (NRL)', area: 'Kathmandu Central', rating: 4.9, reviews: 410, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '06:00 AM - 08:00 PM', fee: 'Home Pickup Free', phone: '+977-1-4433100', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80', special: 'ISO 15189, RT-PCR, Histopathology, Flow Cytometry' },
      { id: 'l-2', name: 'Central Biomedical & Molecular Diagnostic Lab', area: 'Lagankhel, Lalitpur', rating: 4.8, reviews: 220, badge: 'SAINO VIP', badgeType: 'vip', opd: '06:30 AM - 07:30 PM', fee: 'Online Report in 2h', phone: '+977-1-5544200', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', special: 'Hormone Assays, Vitamin D/B12, Genetic Screening' },
      { id: 'l-3', name: 'Annapurna Diagnostic Molecular Lab', area: 'Maitighar, Kathmandu', rating: 4.8, reviews: 180, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:00 AM - 07:00 PM', fee: 'Automated Analyzer', phone: '+977-1-4265410', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80', special: 'HbA1c, Renal Profile, Lipid Subfractions' },
      { id: 'l-4', name: 'Lalitpur Central Blood & Micro-Pathology', area: 'Patan Dhoka, Lalitpur', rating: 4.6, reviews: 105, badge: 'SAINO LISTED', badgeType: 'listed', opd: '07:00 AM - 06:00 PM', fee: 'Standard Pricing', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', special: 'Microbiology Culture & Sensitivity, Urine Routine' },
      { id: 'l-5', name: 'KMC Diagnostic Clinical Research Lab', area: 'Sinamangal, Kathmandu', rating: 4.7, reviews: 155, badge: 'SAINO PRO', badgeType: 'pro', opd: '07:00 AM - 07:00 PM', fee: 'Academic Reference', phone: '+977-1-4469000', image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80', special: 'Hematology Bone Marrow, Coagulation Studies' }
    ],

    bloodBanks: [
      { id: 'b-1', name: 'Nepal Red Cross Central Blood Transfusion Service (CBTS)', area: 'Soalteemode, Kathmandu', rating: 4.9, reviews: 520, badge: 'SAINO VVIP', badgeType: 'vvip', opd: '24/7 All Groups Open', fee: 'Processing Fee Rs. 650', phone: '+977-1-4272826', image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80', special: 'PRBC, Fresh Frozen Plasma (FFP), Platelet Concentrate, Cryo' },
      { id: 'b-2', name: 'Bhaktapur Red Cross Emergency Blood Bank Hub', area: 'Suryabinayak, Bhaktapur', rating: 4.8, reviews: 260, badge: 'SAINO VIP', badgeType: 'vip', opd: '24/7 Emergency Reserve', fee: 'Govt. Subsidized', phone: '+977-1-6611661', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80', special: 'Rare Group O-ve & B-ve Reserve, Single Donor Platelets' },
      { id: 'b-3', name: 'Patan Hospital Emergency Blood Bank Reserve', area: 'Lagankhel, Lalitpur', rating: 4.8, reviews: 310, badge: 'SAINO PRO', badgeType: 'pro', opd: '24/7 Clinical Transfusion', fee: 'Standard Rate', phone: '+977-1-5522295', image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80', special: 'Crossmatch Testing, Thalassemia Patient Support' },
      { id: 'b-4', name: 'Nepal Donors Network Emergency Blood Hotline', area: 'Kathmandu Valley Wide', rating: 4.7, reviews: 180, badge: 'SAINO PRO', badgeType: 'pro', opd: '24/7 Live Volunteer Matching', fee: '100% Free Service', phone: '+977-9851000000', image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80', special: 'Live Donor WhatsApp Dispatch in < 30 Minutes' },
      { id: 'b-5', name: 'Civil Hospital Specialized Blood Unit', area: 'Minbhawan, Kathmandu', rating: 4.6, reviews: 140, badge: 'SAINO LISTED', badgeType: 'listed', opd: '08:00 AM - 08:00 PM', fee: 'Standard Rate', phone: 'Triage via SAINO', image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=600&auto=format&fit=crop&q=80', special: 'Apheresis Platelets, Pediatric Blood Filters' }
    ]
  },

  // Map Locations with Coordinates & Facilities for Google Map Simulator
  mapLocations: [
    { id: 'loc-1', name: 'Kathmandu Central Hub', city: 'Kathmandu', lat: 27.7172, lng: 85.3240, address: 'Lazimpat, Thapathali, Maitighar & Baneshwor', hospitalCount: 14, clinicCount: 38, icon: 'map-pin', featured: 'Norvic Heart, CityCare, Annapurna MRI' },
    { id: 'loc-2', name: 'Lalitpur Medical Corridor', city: 'Lalitpur', lat: 27.6710, lng: 85.3218, address: 'Lagankhel, Jawalakhel, Gwarko & Bhaisepati', hospitalCount: 8, clinicCount: 24, icon: 'map-pin', featured: 'Patan LifeCare, B&B Ortho, MedCity' },
    { id: 'loc-3', name: 'Bhaktapur Health Cluster', city: 'Bhaktapur', lat: 27.6710, lng: 85.4298, address: 'Suryabinayak, Durbar Square & Sallaghari', hospitalCount: 5, clinicCount: 16, icon: 'map-pin', featured: 'Bhaktapur Blood Hub, Diabetic Center' },
    { id: 'loc-4', name: 'Pokhara Lakeside Healthcare Zone', city: 'Pokhara', lat: 28.2096, lng: 83.9856, address: 'Lakeside, New Road & Chipledhunga', hospitalCount: 6, clinicCount: 19, icon: 'map-pin', featured: 'Pokhara Lakeside Hospital, Physio Hub' },
    { id: 'loc-5', name: 'Chitwan Medical City Corridor', city: 'Chitwan', lat: 27.6833, lng: 84.4333, address: 'Bharatpur, Narayangarh Medical College Road', hospitalCount: 7, clinicCount: 22, icon: 'map-pin', featured: 'Chitwan Cancer Screening, MediCare' },
    { id: 'loc-6', name: 'Biratnagar Eastern Regional Hub', city: 'Biratnagar', lat: 26.4525, lng: 87.2718, address: 'Main Road & Hospital Chowk', hospitalCount: 6, clinicCount: 18, icon: 'map-pin', featured: 'Biratnagar MediCare, Eastern Bloodline' }
  ],

  // Diagnostic Packages (Matching Figma Homepage Layout)
  diagnosticPackages: [
    {
      id: 'pkg-1',
      title: 'Comprehensive Full Body Checkup',
      testsCount: '64 Essential Tests (CBC, Lipid, LFT, KFT, Thyroid, Sugar, ECG)',
      originalPrice: 'Rs. 6,000',
      discountedPrice: 'Rs. 4,500',
      discount: '25% OFF',
      hospital: 'Annapurna Diagnostics / CityCare Lab',
      badge: 'POPULAR'
    },
    {
      id: 'pkg-2',
      title: 'Executive Cardiac Health Screening',
      testsCount: 'ECHO, TMT Stress Test, Lipid Subfractions, Trop-I, Cardiac Dietetics',
      originalPrice: 'Rs. 8,500',
      discountedPrice: 'Rs. 6,500',
      discount: '24% OFF',
      hospital: 'Norvic International Hospital Lab',
      badge: 'SPECIALIST'
    },
    {
      id: 'pkg-3',
      title: 'Senior Citizen Complete Wellness',
      testsCount: 'Bone Mineral Density (DEXA), Vitamin D3/B12, PSA, Renal, Eye & Dental',
      originalPrice: 'Rs. 7,000',
      discountedPrice: 'Rs. 5,200',
      discount: '26% OFF',
      hospital: 'Patan LifeCare Hospital Network',
      badge: 'RECOMMENDED'
    }
  ],

  // Online 
  onlineDoctors: [
    {
      id: 'doc-1',
      name: 'Dr. Anup Bastola',
      role: 'Senior Infectious Disease Specialist',
      experience: '16+ Years Experience',
      hospital: 'Sukraraj / Kathmandu Hospital',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
      fee: 'Rs. 600',
      status: 'OPD Available'
    },
    {
      id: 'doc-2',
      name: 'Dr. Manisha Rawal',
      role: 'Consultant Cardiologist',
      experience: '12+ Years Experience',
      hospital: 'Norvic Heart Institute',
      image: 'assets/doctor2.jpg',
      fee: 'Rs. 800',
      status: 'OPD Available'
    },
    {
      id: 'doc-3',
      name: 'Dr. Bikash Karki',
      role: 'Senior Laparoscopic Surgeon',
      experience: '15+ Years Experience',
      hospital: 'Civil Service Hospital',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
      fee: 'Rs. 650',
      status: 'OPD Available'
    },
    {
      id: 'doc-4',
      name: 'Dr. Sunita Gurung',
      role: 'Senior Pediatrician',
      experience: '14+ Years Experience',
      hospital: 'Kanti Children Care',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
      fee: 'Rs. 500',
      status: 'OPD Available'
    },
    {
      id: 'doc-5',
      name: 'Dr. Ramesh Shrestha',
      role: 'Consultant Orthopedic Surgeon',
      experience: '18+ Years Experience',
      hospital: 'B&B Hospital Partner',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
      fee: 'Rs. 750',
      status: 'OPD Available'
    }
  ]
};