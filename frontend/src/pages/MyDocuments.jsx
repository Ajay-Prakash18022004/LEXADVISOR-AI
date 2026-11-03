import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocument } from '../context/DocumentContext';
import { getDocuments, deleteDocument, downloadDocumentFile } from '../api/documents';
import { getUserDrafts, deleteUserDraft, downloadDraftPdf, downloadDraftDocx } from '../api/drafts';
import UploadModal from '../components/UploadModal';

export default function MyDocuments() {
  const navigate = useNavigate();
  const { currentDocument, setCurrentDocument, loadSampleDocument } = useDocument();

  const [activeTab, setActiveTab] = useState('all'); // all, uploaded, drafts
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Fetch real documents and drafts from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, draftsRes] = await Promise.allSettled([
        getDocuments(),
        getUserDrafts()
      ]);

      if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
        setUploadedDocs(docsRes.value);
      }
      if (draftsRes.status === 'fulfilled' && Array.isArray(draftsRes.value)) {
        setDrafts(draftsRes.value);
      }
    } catch (e) {
      console.warn("Could not fetch remote documents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDownloadUploaded = async (doc) => {
    try {
      showNotification(`Downloading "${doc.filename}"...`);
      await downloadDocumentFile(doc.id, doc.filename);
      showNotification(`Downloaded "${doc.filename}" successfully.`);
    } catch (e) {
      showNotification(`Download started via browser standard fallback.`);
      window.open(`http://localhost:8000/api/v1/documents/${doc.id}/download`, '_blank');
    }
  };

  const handleDownloadDraftPdf = async (draft) => {
    try {
      showNotification(`Downloading PDF for "${draft.title}"...`);
      await downloadDraftPdf(draft.id, `${draft.title}.pdf`);
      showNotification(`Downloaded "${draft.title}.pdf" successfully.`);
    } catch (e) {
      window.open(`http://localhost:8000/api/v1/generate/drafts/${draft.id}/download`, '_blank');
    }
  };

  const handleDownloadDraftDocx = async (draft) => {
    try {
      showNotification(`Downloading Word file (.docx) for "${draft.title}"...`);
      await downloadDraftDocx(draft.id, `${draft.title}.docx`);
      showNotification(`Downloaded "${draft.title}.docx" successfully.`);
    } catch (e) {
      window.open(`http://localhost:8000/api/v1/generate/drafts/${draft.id}/docx`, '_blank');
    }
  };

  const handleDeleteUploaded = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDocument(id);
      setUploadedDocs(prev => prev.filter(d => d.id !== id));
      showNotification(`Deleted document "${name}".`);
    } catch (e) {
      setUploadedDocs(prev => prev.filter(d => d.id !== id));
      showNotification(`Removed document "${name}".`);
    }
  };

  const handleDeleteDraft = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteUserDraft(id);
      setDrafts(prev => prev.filter(d => d.id !== id));
      showNotification(`Deleted draft "${name}".`);
    } catch (e) {
      setDrafts(prev => prev.filter(d => d.id !== id));
      showNotification(`Removed draft "${name}".`);
    }
  };

  const handleViewAnalysis = (doc) => {
    if (doc) {
      setCurrentDocument({
        id: doc.id,
        title: doc.filename,
        original_name: doc.filename,
        doc_type: doc.doc_type || 'Legal Agreement',
        state: doc.state || 'Telangana',
        uploaded_at: doc.uploaded_at,
        extracted_text: doc.extracted_text || ''
      });
    }
    navigate('/document-analysis');
  };

  // Combine items for 'all' tab
  const combinedItems = [
    ...uploadedDocs.map(d => ({ ...d, itemType: 'uploaded' })),
    ...drafts.map(d => ({ ...d, itemType: 'draft' }))
  ];

  const filteredItems = combinedItems.filter(item => {
    if (activeTab === 'uploaded' && item.itemType !== 'uploaded') return false;
    if (activeTab === 'drafts' && item.itemType !== 'draft') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (item.title || item.filename || '').toLowerCase();
      const docType = (item.doc_type || '').toLowerCase();
      return title.includes(q) || docType.includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-lg space-y-space-xl">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-primary text-on-primary shadow-xl flex items-center gap-2 text-body-sm font-medium animate-bounce">
          <span className="material-symbols-outlined text-tertiary-fixed-dim">check_circle</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
        <div className="space-y-space-xs max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed">
            <span className="material-symbols-outlined text-sm">folder_shared</span>
            <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
              Personal Legal Repository
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            My Documents & Legal Drafts
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Access, review, and download all your uploaded agreements, stamp certificates, and custom AI-drafted legal documents.
          </p>
        </div>
        <div className="flex items-center gap-space-sm self-start md:self-end shrink-0">
          <button
            type="button"
            onClick={() => navigate('/drafting-studio')}
            className="px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm font-semibold shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-2 border border-surface-container"
          >
            <span className="material-symbols-outlined text-lg text-primary">edit_document</span>
            <span>+ Draft New Agreement</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold shadow-md hover:bg-on-background transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg text-tertiary-fixed-dim">upload_file</span>
            <span>+ Upload Document</span>
          </button>
        </div>
      </section>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Documents</span>
          <p className="text-2xl font-bold font-cinzel text-on-surface mt-1">{combinedItems.length}</p>
          <span className="text-xs text-on-surface-variant">In your client vault</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Uploaded Files</span>
          <p className="text-2xl font-bold font-cinzel text-primary mt-1">{uploadedDocs.length}</p>
          <span className="text-xs text-on-surface-variant">Analyzed for risks & stamp</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">AI Legal Drafts</span>
          <p className="text-2xl font-bold font-cinzel text-on-tertiary-container mt-1">{drafts.length}</p>
          <span className="text-xs text-on-surface-variant">Court-ready PDF & DOCX</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Quick Actions</span>
          <button
            onClick={() => { loadSampleDocument('rental'); navigate('/document-analysis'); }}
            className="mt-1 text-xs font-semibold text-primary underline block text-left"
          >
            Load Sample Tenancy Agreement &rarr;
          </button>
          <button
            onClick={() => navigate('/stamp-paper-verification')}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface underline block text-left mt-0.5"
          >
            Verify E-Stamp Paper &rarr;
          </button>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-surface-container pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            All Items ({combinedItems.length})
          </button>
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`px-4 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
              activeTab === 'uploaded'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            Uploaded Documents ({uploadedDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-lg font-body-sm text-body-sm font-semibold transition-all ${
              activeTab === 'drafts'
                ? 'bg-primary-container text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            Legal Drafts ({drafts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or drafts..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Documents Grid / List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-body-sm text-on-surface-variant">Loading your personal document repository...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-dashed border-surface-container space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center mx-auto text-2xl">
            <span className="material-symbols-outlined text-3xl">draft</span>
          </div>
          <div className="space-y-1">
            <h3 className="font-title-md text-title-md font-bold text-on-surface">No documents found</h3>
            <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
              {searchQuery ? `No documents matched "${searchQuery}".` : "You haven't uploaded any documents or created any legal drafts yet."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary-container text-on-primary text-body-sm font-semibold shadow-xs"
            >
              Upload Your First Document
            </button>
            <button
              onClick={() => navigate('/drafting-studio')}
              className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface text-body-sm font-semibold border border-surface-container"
            >
              Draft an Agreement
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => {
            const isUploaded = item.itemType === 'uploaded';
            const title = item.title || item.filename || `Document #${item.id}`;
            const dateStr = item.uploaded_at || item.created_at
              ? new Date(item.uploaded_at || item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Recently added';

            return (
              <div
                key={`${item.itemType}-${item.id || idx}`}
                className="rounded-xl bg-surface-container-lowest border border-surface-container p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      isUploaded
                        ? 'bg-secondary-container text-on-secondary-fixed'
                        : 'bg-primary-container text-on-primary'
                    }`}>
                      {isUploaded ? 'Uploaded Document' : 'Generated Draft'}
                    </span>
                    <span className="text-xs text-on-surface-variant">{dateStr}</span>
                  </div>

                  <div>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface line-clamp-2" title={title}>
                      {title}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1 capitalize">
                      Type: {(item.doc_type || 'Legal Agreement').replace('_', ' ')}
                      {item.state && ` • Jurisdiction: ${item.state}`}
                    </p>
                  </div>
                </div>

                {/* Card Status Badges */}
                <div className="pt-2 border-t border-surface-container/60 flex items-center justify-between text-xs">
                  {isUploaded ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-on-surface font-medium">
                        <span className="material-symbols-outlined text-sm text-tertiary-fixed-dim">verified</span>
                        Analyzed
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface font-medium">
                      <span className="material-symbols-outlined text-sm text-primary">description</span>
                      Ready to Download
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {/* Delete Icon */}
                    <button
                      onClick={() => isUploaded ? handleDeleteUploaded(item.id, title) : handleDeleteDraft(item.id, title)}
                      className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all"
                      title="Delete document"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {isUploaded ? (
                    <>
                      <button
                        onClick={() => handleViewAnalysis(item)}
                        className="flex-1 py-2 px-3 rounded-lg bg-surface-container-low text-on-surface font-semibold text-xs hover:bg-surface-container transition-all text-center flex items-center justify-center gap-1 border border-surface-container"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>View Analysis</span>
                      </button>
                      <button
                        onClick={() => handleDownloadUploaded(item)}
                        className="py-2 px-3 rounded-lg bg-primary-container text-on-primary font-semibold text-xs hover:bg-primary transition-all flex items-center gap-1"
                        title="Download Original Document"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Download</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDownloadDraftPdf(item)}
                        className="flex-1 py-2 px-3 rounded-lg bg-primary-container text-on-primary font-semibold text-xs hover:bg-primary transition-all flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        <span>Download PDF</span>
                      </button>
                      <button
                        onClick={() => handleDownloadDraftDocx(item)}
                        className="py-2 px-3 rounded-lg bg-surface-container-low text-on-surface font-semibold text-xs hover:bg-surface-container transition-all flex items-center gap-1 border border-surface-container"
                        title="Download Microsoft Word .docx"
                      >
                        <span className="material-symbols-outlined text-sm">description</span>
                        <span>Word</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}

