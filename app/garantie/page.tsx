"use client"
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { FaSearch, FaCalendarAlt, FaTools, FaCheckCircle, FaClock, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'
import { FiDownload } from 'react-icons/fi'
import { toast } from 'react-hot-toast'

interface MaintenanceSchedule {
  date: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  type: string
  cost: number
  notes: string
}

interface Garantie {
  _id: string
  company: string
  name: string
  phone: string
  address: string
  surface: any
  surfaceValue: number
  montant: number
  installDate: string
  duration: number
  notes?: string
  maintenances?: { date: string }[]
  status: string
  createdAt: string
  userId?: string
  // الحقول الجديدة
  garantieStatus?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  maintenanceCount?: number
  totalMaintenanceCost?: number
  // أوقات الصيانة المحدثة
  maintenanceSchedule?: MaintenanceSchedule[]
}

export default function GarantieIndex() {
  const { data: session, status } = useSession()
  const [garanties, setGaranties] = useState<Garantie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchPhone, setSearchPhone] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadingPDFs, setDownloadingPDFs] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isApplicateur = session?.user?.role === 'APPLICATEUR'
  const isAuthenticated = !!session?.user?.id

  useEffect(() => {
    if (status === 'loading') return;
    
    console.log('=== SESSION DEBUG ===');
    console.log('User authenticated:', session?.user?.id);
    console.log('User role:', session?.user?.role);
    
    // إذا كان المستخدم مدير أو مقدم طلب، يمكنه رؤية جميع الضمانات
    if (isAdmin || isApplicateur) {
      fetchGaranties();
    } else {
      // المستخدمون العاديون والزوار يحتاجون للبحث برقم هاتف
      setLoading(false);
      setHasSearched(false);
    }
  }, [session, status, isAdmin, isApplicateur])

  async function fetchGaranties(phone?: string) {
    setLoading(true)
    setError(null)
    try {
      let query: any = {};
      
      // إذا كان المستخدم APPLICATEUR، نعرض فقط ضماناته
      if (isApplicateur) {
        query.userId = session?.user?.id;
        query.status = 'APPROVED';
      } else if (isAdmin) {
        // المدير يرى جميع الضمانات المعتمدة
        query.status = 'APPROVED';
        if (phone) query.phone = phone;
      } else {
        // المستخدمون العاديون والزوار يبحثون برقم الهاتف
        if (phone) {
          query.phone = phone;
          query.status = 'APPROVED';
        } else {
          setError('Vous devez fournir un numéro de téléphone pour rechercher des garanties');
          setGaranties([]);
          setLoading(false);
          return;
        }
      }
      
      const url = `/api/garanties?${new URLSearchParams(query as Record<string, string>)}`
      console.log('=== FRONTEND DEBUG ===');
      console.log('Fetching URL:', url);
      console.log('Query params:', query);
      console.log('User role:', session?.user?.role);
      
      const res = await fetch(url)
      const data = await res.json()
      
      console.log('API Response Status:', res.status);
      console.log('API Response Data:', data);
      
      if (res.status === 403) {
        setError(data.error || 'Accès non autorisé');
        setGaranties([]);
        return;
      }
      
      if (res.ok && Array.isArray(data.garanties)) {
        console.log('Garanties from API:', data.garanties);
        setGaranties(data.garanties);
        setHasSearched(true);
      } else {
        setError('Erreur lors du chargement des garanties');
        setGaranties([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des garanties:', error);
      setError('Erreur de connexion au serveur');
      setGaranties([]);
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // إذا كان المستخدم عادي أو زائر، يجب أن يدخل رقم هاتف
    if (!isAdmin && !isApplicateur && !searchPhone.trim()) {
      toast.error('Veuillez entrer un numéro de téléphone');
      return;
    }
    
    // إذا كان المدير يبحث، يجب أن يدخل رقم هاتف
    if (isAdmin && !searchPhone.trim()) {
      toast.error('Veuillez entrer un numéro de téléphone pour rechercher');
      return;
    }
    
    // إذا كان APPLICATEUR، لا يحتاج لرقم هاتف - يرى ضماناته فقط
    if (isApplicateur) {
      fetchGaranties();
      return;
    }
    
    // المدير والمستخدم العادي يبحثون برقم الهاتف
    fetchGaranties(searchPhone);
  };

  const handleDownloadPDF = async (garantie: Garantie) => {
    // إضافة الضمان إلى قائمة التحميل
    setDownloadingPDFs(prev => new Set(prev).add(garantie._id));
    
    try {
      const response = await fetch(`/api/garantie/${garantie._id}/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const blob = await response.blob();
      
      // التحقق من أن الـ blob صالح
      if (blob.size === 0) {
        throw new Error('Le PDF généré est vide');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `garantie-${garantie.name || garantie._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF téléchargé avec succès!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      // إزالة الضمان من قائمة التحميل
      setDownloadingPDFs(prev => {
        const newSet = new Set(prev);
        newSet.delete(garantie._id);
        return newSet;
      });
    }
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return dateString.split('-').reverse().join('/');
  };

  // دالة للحصول على أيقونة حالة الصيانة
  const getMaintenanceStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <FaCheckCircle className="text-green-500" />;
      case 'IN_PROGRESS':
        return <FaTools className="text-blue-500" />;
      case 'PENDING':
        return <FaClock className="text-yellow-500" />;
      case 'CANCELLED':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaCalendarAlt className="text-gray-500" />;
    }
  };

  // دالة للحصول على نص حالة الصيانة
  const getMaintenanceStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Terminée';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return 'Inconnue';
    }
  };

  // دالة للحصول على لون حالة الصيانة
  const getMaintenanceStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-4xl mx-auto p-4 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">Rechercher des garanties</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isAdmin || isApplicateur 
                ? 'Gérez et recherchez toutes les garanties approuvées'
                : 'Recherchez vos garanties par numéro de téléphone'
              }
            </p>
          </div>
          {session?.user?.id && ['APPLICATEUR', 'ADMIN'].includes(session?.user?.role ?? '') && (
            <div className="flex gap-3">
            <Link
              href="/garantie/create"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl text-base shadow transition"
            >
                + Ajouter une garantie
            </Link>
            </div>
          )}
        </div>

        {/* رسالة إعلامية للمستخدمين العاديين والزوار */}
        {!isAdmin && !isApplicateur && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Recherche sécurisée
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Pour protéger votre vie privée, vous devez entrer votre numéro de téléphone exact pour voir vos garanties. 
                  Seules les garanties approuvées associées à votre numéro de téléphone seront affichées.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de recherche */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <label htmlFor="phoneSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isAdmin || isApplicateur 
                    ? 'Rechercher par numéro de téléphone (optionnel)'
                    : 'Numéro de téléphone (obligatoire)'
                  }
                </label>
                <div className="relative">
                  <input
                    id="phoneSearch"
                    type="text"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder={isAdmin || isApplicateur 
                      ? "Entrez le numéro de téléphone pour filtrer..."
                      : "Entrez votre numéro de téléphone exact..."
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    required={!isAdmin && !isApplicateur}
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <FaSearch />
                  {isAdmin || isApplicateur ? 'Rechercher' : 'Voir mes garanties'}
                </button>
                {(searchPhone || (isAdmin || isApplicateur)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchPhone('');
                      setError(null);
                      if (isAdmin || isApplicateur) {
                      fetchGaranties();
                      } else {
                        setGaranties([]);
                        setHasSearched(false);
                      }
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          </div>
        )}

        {status === 'loading' || loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : !hasSearched && !isAdmin && !isApplicateur ? (
          <div className="text-center text-gray-400">
            <div className="max-w-md mx-auto">
              <FaSearch className="text-6xl mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Recherchez vos garanties</p>
              <p className="text-sm">Entrez votre numéro de téléphone ci-dessus pour voir vos garanties approuvées</p>
            </div>
          </div>
        ) : garanties.length === 0 ? (
          <div className="text-center text-gray-400">
            <p className="text-lg mb-2">Aucune garantie trouvée</p>
            <p className="text-sm">
              {isAdmin || isApplicateur 
                ? 'Essayez un autre numéro de téléphone ou vérifiez que la garantie est approuvée'
                : 'Vérifiez que votre numéro de téléphone est correct et que vous avez des garanties approuvées'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {garanties.map(g => (
              <div key={g._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-800 text-lg">{g.company}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      g.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {g.status === 'APPROVED' ? 'Approuvé' : 'En attente'}
                    </span>
                    {g.status === 'APPROVED' && (
                      <button
                        onClick={() => handleDownloadPDF(g)}
                        disabled={downloadingPDFs.has(g._id)}
                        className={`p-1 transition-all duration-200 ${
                          downloadingPDFs.has(g._id)
                            ? 'text-blue-600 cursor-not-allowed'
                            : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                        }`}
                        title={downloadingPDFs.has(g._id) ? "Téléchargement en cours..." : "Télécharger le PDF"}
                      >
                        {downloadingPDFs.has(g._id) ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                        <FiDownload className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Client :</b> {g.name}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Téléphone :</b> {g.phone}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Adresse :</b> {g.address}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                  <b>Surface :</b>{" "}
                  {Array.isArray(g.surface) && g.surface.length > 0
                    ? g.surface
                        .map((s: any) => {
                          if (s.type && s.value) return `${s.type}: ${s.value}`;
                          if (s.type) return s.type;
                          if (s.value) return `${s.value}`;
                          return '';
                        })
                        .filter(Boolean)
                        .join(', ')
                    : '-'}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Date d'installation :</b> {formatDate(g.installDate)}</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Montant :</b> {g.montant} DT</div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-1"><b>Durée :</b> {g.duration} ans</div>
                
                {/* حالة الضمان الجديدة */}
                {g.garantieStatus && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>État de la garantie :</b>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      g.garantieStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : g.garantieStatus === 'EXPIRED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {g.garantieStatus === 'ACTIVE' ? 'Active' : 
                       g.garantieStatus === 'EXPIRED' ? 'Expirée' : 'Annulée'}
                    </span>
                  </div>
                )}
                
                {/* معلومات الصيانة الجديدة */}
                {g.maintenanceCount !== undefined && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Maintenances effectuées :</b> {g.maintenanceCount}
                  </div>
                )}
                
                {g.totalMaintenanceCost !== undefined && g.totalMaintenanceCost > 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Coût total des maintenances :</b> {g.totalMaintenanceCost} DT
                  </div>
                )}
                
                {g.nextMaintenanceDate && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Prochaine maintenance :</b> {formatDate(g.nextMaintenanceDate)}
                  </div>
                )}
                
                {g.lastMaintenanceDate && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Dernière maintenance :</b> {formatDate(g.lastMaintenanceDate)}
                  </div>
                )}
                
                {/* أوقات الصيانة المحدثة */}
                {g.maintenanceSchedule && g.maintenanceSchedule.length > 0 && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Planning de maintenance :</b>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {g.maintenanceSchedule
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((maintenance, index) => (
                        <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {getMaintenanceStatusIcon(maintenance.status)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(maintenance.date)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <span className="capitalize">{maintenance.type?.toLowerCase()}</span>
                                {maintenance.notes && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-32" title={maintenance.notes}>
                                      {maintenance.notes}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusColor(maintenance.status)}`}>
                              {getMaintenanceStatusText(maintenance.status)}
                            </span>
                            {maintenance.cost > 0 && (
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                {maintenance.cost} DT
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Section des maintenances القديمة للتوافق */}
                {g.maintenances && g.maintenances.length > 0 && !g.maintenanceSchedule && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Maintenances prévues :</b>
                    <div className="mt-1 space-y-1">
                      {g.maintenances.map((maintenance, index) => (
                        <div key={index} className="text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          📅 {maintenance.date?.split('-').reverse().join('/')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {g.notes && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                    <b>Notes :</b>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                      {g.notes}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Créée le : {formatDate(g.createdAt?.slice(0,10))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// إضافة CSS للأنيميشن
const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;

// إضافة CSS إلى head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 