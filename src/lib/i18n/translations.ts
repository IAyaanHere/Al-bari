export type Language = "en" | "hi" | "ur";

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  nav: {
    overview: string;
    dashboard: string;
    madrasas: string;
    upload: string;
    myUploads: string;
    moderation: string;
    adminMadrasas: string;
    adminUsers: string;
    auditLogs: string;
    login: string;
    logout: string;
    profile: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    kpi: {
      totalPosts: string;
      totalFiles: string;
      activeMadrasas: string;
      activeTeachers: string;
      postsThisMonth: string;
      incompleteUploads: string;
    };
    filters: {
      searchPlaceholder: string;
      madrasa: string;
      allMadrasas: string;
      category: string;
      allCategories: string;
      status: string;
      allStatuses: string;
      dateRange: string;
      clearFilters: string;
      filterButton: string;
    };
    views: {
      grid: string;
      table: string;
    };
    charts: {
      monthlyUploads: string;
      categoryDistribution: string;
      madrasaBreakdown: string;
      topTeachers: string;
    };
    empty: {
      noPosts: string;
      noPostsDesc: string;
    };
  };
  post: {
    category: {
      photos: string;
      results: string;
      tests: string;
      resources: string;
      attendance: string;
      activity: string;
      other: string;
    };
    status: {
      pending: string;
      complete: string;
      incomplete: string;
      approved: string;
      rejected: string;
      public: string;
      private: string;
    };
    details: {
      eventDate: string;
      madrasa: string;
      teacher: string;
      uploadedOn: string;
      filesAttached: string;
      downloadFile: string;
      viewFile: string;
      backToPosts: string;
    };
  };
  upload: {
    title: string;
    subtitle: string;
    selectMadrasa: string;
    chooseCategory: string;
    eventDate: string;
    postTitle: string;
    postDescription: string;
    uploadFiles: string;
    dragDropText: string;
    browseFiles: string;
    imageOptimization: string;
    uploadOriginal: string;
    startUpload: string;
    uploading: string;
    uploadComplete: string;
    retry: string;
    cancel: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    username: string;
    password: string;
    signIn: string;
    changePasswordTitle: string;
    changePasswordDesc: string;
    newPassword: string;
    confirmPassword: string;
    savePassword: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "Al Bari Organization Hub",
    tagline: "Islamic Education Foundation Centralized Records & Resource Portal",
    nav: {
      overview: "Overview",
      dashboard: "Dashboard",
      madrasas: "Madrasas",
      upload: "Upload",
      myUploads: "My Uploads",
      moderation: "Moderation",
      adminMadrasas: "Manage Madrasas",
      adminUsers: "Manage Users",
      auditLogs: "Audit Logs",
      login: "Teacher / Admin Login",
      logout: "Sign Out",
      profile: "Profile",
    },
    dashboard: {
      title: "Organization Hub Dashboard",
      subtitle: "Verified educational activities, examinations, attendance records and curriculum resources.",
      kpi: {
        totalPosts: "Total Records",
        totalFiles: "Files Preserved",
        activeMadrasas: "Active Madrasas",
        activeTeachers: "Active Teachers",
        postsThisMonth: "Uploaded This Month",
        incompleteUploads: "Incomplete / Retrying",
      },
      filters: {
        searchPlaceholder: "Search records by title, notes, or teacher...",
        madrasa: "Madrasa",
        allMadrasas: "All Madrasas",
        category: "Category",
        allCategories: "All Categories",
        status: "Approval Status",
        allStatuses: "All Statuses",
        dateRange: "Date Range",
        clearFilters: "Clear Filters",
        filterButton: "Filter",
      },
      views: {
        grid: "Gallery View",
        table: "Table View",
      },
      charts: {
        monthlyUploads: "Monthly Records Ingestion",
        categoryDistribution: "Curriculum Category Distribution",
        madrasaBreakdown: "Activity by Madrasa",
        topTeachers: "Most Active Educators",
      },
      empty: {
        noPosts: "No Educational Records Found",
        noPostsDesc: "There are no approved public records matching your selected filter criteria.",
      },
    },
    post: {
      category: {
        photos: "Photographs",
        results: "Student Results",
        tests: "Examinations & Tests",
        resources: "Educational Resources",
        attendance: "Attendance Registers",
        activity: "Extracurricular Activity",
        other: "General Notice",
      },
      status: {
        pending: "Pending Review",
        complete: "Upload Complete",
        incomplete: "Incomplete Upload",
        approved: "Approved",
        rejected: "Revision Needed",
        public: "Public",
        private: "Private",
      },
      details: {
        eventDate: "Activity Date",
        madrasa: "Madrasa / School",
        teacher: "Instructor / In-Charge",
        uploadedOn: "Archived On",
        filesAttached: "Attached Documents & Media",
        downloadFile: "Download",
        viewFile: "Preview",
        backToPosts: "Back to Records",
      },
    },
    upload: {
      title: "Publish Educational Record",
      subtitle: "Direct-to-Drive zero-byte serverless upload engine with client-side compression.",
      selectMadrasa: "Select Assigned Madrasa",
      chooseCategory: "Record Category",
      eventDate: "Activity / Examination Date",
      postTitle: "Title / Topic",
      postDescription: "Detailed Notes or Summary",
      uploadFiles: "Upload Documents & Media",
      dragDropText: "Drag and drop PDFs, images, spreadsheets, or videos here, or",
      browseFiles: "Browse Files",
      imageOptimization: "Automatic Client Image Compression (WebP/JPEG 1600px)",
      uploadOriginal: "Keep Original Quality",
      startUpload: "Start Upload to Google Drive",
      uploading: "Uploading Chunks...",
      uploadComplete: "Record Successfully Archived!",
      retry: "Retry Incomplete",
      cancel: "Cancel",
    },
    auth: {
      loginTitle: "Sign in to Al Bari Hub",
      loginSubtitle: "Sign in using your admin-assigned username and password.",
      username: "Username",
      password: "Password",
      signIn: "Sign In",
      changePasswordTitle: "Set Your Permanent Password",
      changePasswordDesc: "This is your first login. Please choose a strong new password before proceeding.",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      savePassword: "Update Password & Continue",
    },
  },
  hi: {
    appName: "अल बारी संगठन केंद्र",
    tagline: "इस्लामी शिक्षा फाउंडेशन केंद्रीकृत रिकॉर्ड और संसाधन पोर्टल",
    nav: {
      overview: "अवलोकन",
      dashboard: "डैशबोर्ड",
      madrasas: "मदरसे",
      upload: "अपलोड",
      myUploads: "मेरे अपलोड",
      moderation: "समीक्षा / अनुमोदन",
      adminMadrasas: "मदरसा प्रबंधन",
      adminUsers: "उपयोगकर्ता प्रबंधन",
      auditLogs: "ऑडिट लॉग",
      login: "शिक्षक / व्यवस्थापक लॉगिन",
      logout: "साइन आउट",
      profile: "प्रोफ़ाइल",
    },
    dashboard: {
      title: "संगठन केंद्र डैशबोर्ड",
      subtitle: "सत्यापित शैक्षणिक गतिविधियाँ, परीक्षा परिणाम, उपस्थिति रिकॉर्ड और पाठ्यक्रम संसाधन।",
      kpi: {
        totalPosts: "कुल रिकॉर्ड",
        totalFiles: "संग्रहीत फ़ाइलें",
        activeMadrasas: "सक्रिय मदरसे",
        activeTeachers: "सक्रिय शिक्षक",
        postsThisMonth: "इस महीने अपलोड",
        incompleteUploads: "अधूरे अपलोड",
      },
      filters: {
        searchPlaceholder: "शीर्षक, टिप्पणी या शिक्षक द्वारा खोजें...",
        madrasa: "मदरसा",
        allMadrasas: "सभी मदरसे",
        category: "श्रेणी",
        allCategories: "सभी श्रेणियां",
        status: "अनुमोदन स्थिति",
        allStatuses: "सभी स्थितियां",
        dateRange: "दिनांक सीमा",
        clearFilters: "फ़िल्टर साफ़ करें",
        filterButton: "फ़िल्टर",
      },
      views: {
        grid: "गैलरी दृश्य",
        table: "तालिका दृश्य",
      },
      charts: {
        monthlyUploads: "मासिक अपलोड प्रगति",
        categoryDistribution: "पाठ्यक्रम श्रेणी वितरण",
        madrasaBreakdown: "मदरसा अनुसार गतिविधि",
        topTeachers: "सर्वाधिक सक्रिय शिक्षक",
      },
      empty: {
        noPosts: "कोई शैक्षणिक रिकॉर्ड नहीं मिला",
        noPostsDesc: "आपके चयनित फ़िल्टर से मेल खाने वाला कोई स्वीकृत सार्वजनिक रिकॉर्ड नहीं है।",
      },
    },
    post: {
      category: {
        photos: "तस्वीरें",
        results: "छात्र परिणाम",
        tests: "परीक्षा एवं टेस्ट",
        resources: "शैक्षणिक संसाधन",
        attendance: "उपस्थिति रजिस्टर",
        activity: "पाठ्येतर गतिविधि",
        other: "सामान्य सूचना",
      },
      status: {
        pending: "समीक्षाधीन",
        complete: "अपलोड पूर्ण",
        incomplete: "अधूरा अपलोड",
        approved: "स्वीकृत",
        rejected: "संशोधन आवश्यक",
        public: "सार्वजनिक",
        private: "निजी",
      },
      details: {
        eventDate: "गतिविधि तिथि",
        madrasa: "मदरसा / विद्यालय",
        teacher: "शिक्षक / प्रभारी",
        uploadedOn: "संग्रहीत तिथि",
        filesAttached: "संलग्न दस्तावेज़ और मीडिया",
        downloadFile: "डाउनलोड",
        viewFile: "पूर्वावलोकन",
        backToPosts: "रिकॉर्ड पर वापस जाएं",
      },
    },
    upload: {
      title: "शैक्षणिक रिकॉर्ड प्रकाशित करें",
      subtitle: "क्लाइंट-साइड कम्प्रेशन के साथ डायरेक्ट गूगल ड्राइव अपलोड इंजन।",
      selectMadrasa: "निर्दिष्ट मदरसा चुनें",
      chooseCategory: "रिकॉर्ड श्रेणी",
      eventDate: "गतिविधि / परीक्षा तिथि",
      postTitle: "शीर्षक / विषय",
      postDescription: "विस्तृत विवरण या सारांश",
      uploadFiles: "दस्तावेज़ और मीडिया अपलोड करें",
      dragDropText: "पीडीएफ, चित्र, एक्सेल या वीडियो यहां खींचें और छोड़ें, या",
      browseFiles: "फ़ाइलें चुनें",
      imageOptimization: "स्वचालित क्लाइंट छवि संपीड़न (WebP/JPEG 1600px)",
      uploadOriginal: "मूल गुणवत्ता बनाए रखें",
      startUpload: "गूगल ड्राइव पर अपलोड शुरू करें",
      uploading: "अपलोड हो रहा है...",
      uploadComplete: "रिकॉर्ड सफलतापूर्वक संग्रहीत किया गया!",
      retry: "पुनः प्रयास करें",
      cancel: "रद्द करें",
    },
    auth: {
      loginTitle: "अल बारी हब में साइन इन करें",
      loginSubtitle: "अपने व्यवस्थापक द्वारा दिए गए उपयोगकर्ता नाम और पासवर्ड से लॉगिन करें।",
      username: "उपयोगकर्ता नाम (Username)",
      password: "पासवर्ड",
      signIn: "साइन इन",
      changePasswordTitle: "नया स्थायी पासवर्ड सेट करें",
      changePasswordDesc: "यह आपका पहला लॉगिन है। कृपया आगे बढ़ने से पहले एक सुरक्षित नया पासवर्ड चुनें।",
      newPassword: "नया पासवर्ड",
      confirmPassword: "नए पासवर्ड की पुष्टि करें",
      savePassword: "पासवर्ड अपडेट करें और जारी रखें",
    },
  },
  ur: {
    appName: "الباری آرگنائزیشن ہب",
    tagline: "اسلامک ایجوکیشن فاؤنڈیشن مرکزی تعلیمی ریکارڈ اور وسائل پورٹل",
    nav: {
      overview: "جائزہ",
      dashboard: "ڈیش بورڈ",
      madrasas: "مدارس",
      upload: "اپ لوڈ کریں",
      myUploads: "میری اپ لوڈز",
      moderation: "نگرانی و منظوری",
      adminMadrasas: "مدارس کا انتظام",
      adminUsers: "صارفین کا انتظام",
      auditLogs: "آڈٹ لاگز",
      login: "استاذ / منتظم لاگ ان",
      logout: "لاگ آؤٹ",
      profile: "پروفائل",
    },
    dashboard: {
      title: "آرگنائزیشن ہب ڈیش بورڈ",
      subtitle: "تصدیق شدہ تعلیمی سرگرمیاں، امتحانی نتائج، حاضری ریکارڈ اور نصابی وسائل۔",
      kpi: {
        totalPosts: "کل ریکارڈز",
        totalFiles: "محفوظ شدہ فائلیں",
        activeMadrasas: "فعال مدارس",
        activeTeachers: "فعال اساتذہ",
        postsThisMonth: "اس ماہ کی اپ لوڈز",
        incompleteUploads: "نامکمل / زیر تکرار",
      },
      filters: {
        searchPlaceholder: "عنوان، تفصیل یا استاذ کے نام سے تلاش کریں...",
        madrasa: "مدرسہ",
        allMadrasas: "تمام مدارس",
        category: "زمرہ",
        allCategories: "تمام زمرہ جات",
        status: "منظوری کی حالت",
        allStatuses: "تمام حالتیں",
        dateRange: "تاریخی حدود",
        clearFilters: "فلٹر ختم کریں",
        filterButton: "تلاش کریں",
      },
      views: {
        grid: "گیلری منظر",
        table: "جدول منظر",
      },
      charts: {
        monthlyUploads: "ماہانہ اپ لوڈز کی رفتار",
        categoryDistribution: "نصابی زمرہ جات کی تقسیم",
        madrasaBreakdown: "مدرسہ وار سرگرمیاں",
        topTeachers: "نمایاں فعال اساتذہ",
      },
      empty: {
        noPosts: "کوئی تعلیمی ریکارڈ دستیاب نہیں",
        noPostsDesc: "منتخب کردہ فلٹرز کے مطابق کوئی منظور شدہ عوامی ریکارڈ نہیں ملا۔",
      },
    },
    post: {
      category: {
        photos: "تصاویر",
        results: "طلباء کے نتائج",
        tests: "امتحانات و ٹیسٹ",
        resources: "تعلیمی وسائل",
        attendance: "رجسٹر حاضری",
        activity: "غیر نصابی سرگرمیاں",
        other: "عام اعلانات",
      },
      status: {
        pending: "زیر جائزہ",
        complete: "اپ لوڈ مکمل",
        incomplete: "نامکمل اپ لوڈ",
        approved: "منظور شدہ",
        rejected: "تجدید مطلوب",
        public: "عوامی",
        private: "نجی",
      },
      details: {
        eventDate: "سرگرمی کی تاریخ",
        madrasa: "مدرسہ / اسکول",
        teacher: "استاذ / ذمہ دار",
        uploadedOn: "محفوظ کرنے کی تاریخ",
        filesAttached: "منسلک دستاویزات اور میڈیا",
        downloadFile: "ڈاؤن لوڈ",
        viewFile: "معائنہ",
        backToPosts: "واپس فہرست پر جائیں",
      },
    },
    upload: {
      title: "تعلیمی ریکارڈ اپ لوڈ کریں",
      subtitle: "کلائنٹ سائیڈ امیج کمپریشن کے ساتھ ڈائریکٹ گوگل ڈرائیو اپ لوڈ انجن۔",
      selectMadrasa: "متعلقہ مدرسہ منتخب کریں",
      chooseCategory: "ریکارڈ کا زمرہ",
      eventDate: "سرگرمی / امتحان کی تاریخ",
      postTitle: "عنوان / موضوع",
      postDescription: "تفصیلی خلاصہ یا نوٹس",
      uploadFiles: "دستاویزات اور میڈیا منتخب کریں",
      dragDropText: "پی ڈی ایف، تصاویر، ایکسل یا ویڈیوز یہاں کھینچ کر لائیں، یا",
      browseFiles: "فائلیں منتخب کریں",
      imageOptimization: "خودکار کلائنٹ امیج کمپریشن (WebP/JPEG 1600px)",
      uploadOriginal: "اصل معیار برقرار رکھیں",
      startUpload: "گوگل ڈرائیو پر اپ لوڈ شروع کریں",
      uploading: "اپ لوڈ ہو رہا ہے...",
      uploadComplete: "تعلیمی ریکارڈ کامیابی سے محفوظ ہو گیا!",
      retry: "دوبارہ کوشش کریں",
      cancel: "منسوخ کریں",
    },
    auth: {
      loginTitle: "الباری ہب میں لاگ ان کریں",
      loginSubtitle: "منتظم کے فراہم کردہ صارف نام (Username) اور پاس ورڈ کے ذریعے داخل ہوں۔",
      username: "صارف نام (Username)",
      password: "پاس ورڈ",
      signIn: "داخل ہوں",
      changePasswordTitle: "نیا مستقل پاس ورڈ منتخب کریں",
      changePasswordDesc: "یہ آپ کا پہلا لاگ ان ہے۔ آگے بڑھنے سے پہلے برائے مہربانی ایک مضبوط پاس ورڈ مقرر کریں۔",
      newPassword: "نیا پاس ورڈ",
      confirmPassword: "نئے پاس ورڈ کی تصدیق",
      savePassword: "پاس ورڈ محفوظ کریں اور جاری رکھیں",
    },
  },
};
