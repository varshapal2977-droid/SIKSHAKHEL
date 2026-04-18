import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  CheckCircle2,
  Type,
  FileCode,
  Upload,
  Video,
  X,
  Loader2,
  Users as UsersIcon,
  Baby,
  ShieldCheck,
  ShieldAlert,
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { worksConfig, servicesConfig, heroConfig, siteConfig } from '../config';
import type { WorkItem } from '../config';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, deleteDoc, getDocs, where } from 'firebase/firestore';
import type { ChildProfile } from '../types/childProgress';

interface AdminDashboardProps {
  onLogout: () => void;
  isParentDashboard?: boolean;
  parentData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    childName?: string;
    childClass?: string;
  } | null | undefined;
}

interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  status: 'active' | 'deactivated';
  subscription: 'free' | 'premium';
  createdAt: string;
  lastLogin: string;
  childrenCount: number;
}

export function AdminDashboard({ onLogout, isParentDashboard }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'users' | 'settings'>(isParentDashboard ? 'overview' : 'overview');
  const [contentClassTab, setContentClassTab] = useState<'Class 1' | 'Class 2' | 'Class 3' | 'All'>('Class 1');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [contentUploadProgress, setContentUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingContent, setIsUploadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [contentUploadError, setContentUploadError] = useState('');
  const [contentSaveError, setContentSaveError] = useState('');
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  
  // User Management State
   const [users, setUsers] = useState<UserProfile[]>([]);
   const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
   const [userChildren, setUserChildren] = useState<ChildProfile[]>([]);
   const [isChildModalOpen, setIsChildModalOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');

   // Form state for new game
   const [newGame, setNewGame] = useState<Partial<WorkItem>>({
     title: '',
     category: '',
     image: '',
     class: '',
     subject: '',
     type: 'game',
     contentUrl: '/gamesss.html'
   });
   const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
 
   // Local state for editable content
   const [localWorks, setLocalWorks] = useState(worksConfig);
   const [localServices] = useState(servicesConfig);
   const [localHero, setLocalHero] = useState(heroConfig);
   const [localSite, setLocalSite] = useState(siteConfig);

  useEffect(() => {
    // Real-time sync with Firestore for games
    const q = query(collection(db, "content"), orderBy("id", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreProjects = snapshot.docs.map(doc => ({
          ...doc.data()
        } as WorkItem));
        setLocalWorks(prev => ({ ...prev, projects: firestoreProjects }));
      }
    });

    // Real-time sync with Firestore for users
    const userQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribeUsers = onSnapshot(userQuery, (snapshot) => {
      const userData = snapshot.docs.map(doc => {
        const raw = doc.data() as Partial<UserProfile> & { phoneNumber?: string };
        const resolvedName = raw.fullName || (raw.email ? raw.email.split('@')[0] : 'Unnamed User');
        const resolvedPhone = raw.phone || raw.phoneNumber || '';

        return {
          uid: doc.id,
          fullName: resolvedName,
          email: raw.email || '',
          phone: resolvedPhone,
          age: raw.age ?? 0,
          status: raw.status || 'active',
          subscription: raw.subscription || 'free',
          createdAt: raw.createdAt || '',
          lastLogin: raw.lastLogin || '',
          childrenCount: raw.childrenCount || 0
        } as UserProfile;
      });
      setUsers(userData);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const resetContentForm = () => {
    setNewGame({
      title: '',
      category: '',
      image: '',
      class: '',
      subject: '',
      type: 'game',
      contentUrl: '/gamesss.html',
    });
    setEditingContentId(null);
    setUploadError('');
    setContentUploadError('');
    setContentSaveError('');
    setUploadProgress(null);
    setContentUploadProgress(null);
    setIsUploading(false);
    setIsUploadingContent(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (contentFileInputRef.current) {
      contentFileInputRef.current.value = '';
    }
  };

  const handleSave = (section: string) => {
    setSuccessMessage(`${section} updated successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    try {
      await updateDoc(doc(db, "users", user.uid), { status: newStatus });
      setSuccessMessage(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  };

  const handleViewChildren = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsChildModalOpen(true);
    // In a real app, children might be in a subcollection or separate collection
    try {
      const q = query(collection(db, "children"), where("parentId", "==", user.uid));
      const snapshot = await getDocs(q);
      const childrenData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChildProfile));
      setUserChildren(childrenData);
    } catch (err) {
      console.error("Error fetching children:", err);
      // Mock data if collection doesn't exist
      setUserChildren([
        { id: '1', parentId: user.uid, name: 'Arjun', grade: 'Class 2', progress: 75, streak: 5, lastActive: new Date().toISOString() },
        { id: '2', parentId: user.uid, name: 'Sanya', grade: 'Class 1', progress: 40, streak: 2, lastActive: new Date().toISOString() }
      ]);
    }
  };

  const uploadFileToStorage = (
    file: File,
    folder: 'content' | 'thumbnails',
    setProgress: (progress: number | null) => void,
    setUploading: (value: boolean) => void,
    setError: (value: string) => void,
  ) => {
    setError('');
    setUploading(true);
    setProgress(0);

    // Keep uploads inside /content for compatibility with common Firebase storage rules.
    const storagePath =
      folder === 'thumbnails'
        ? `content/thumbnails/${Date.now()}_${file.name}`
        : `content/videos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    let hasProgress = false;

    // Give enough time for larger video/image uploads.
    const stallTimeout = window.setTimeout(() => {
      if (!hasProgress) {
        uploadTask.cancel();
        setUploading(false);
        setProgress(null);
        setError('Upload timed out. Please check internet/Firebase storage rules and try again.');
      }
    }, 120000);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.bytesTransferred > 0) hasProgress = true;
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(progress));
        },
        (error) => {
          window.clearTimeout(stallTimeout);
          console.error('Upload failed:', error);
          setUploading(false);
          setProgress(null);
          setError('Upload failed. Please try again.');
          reject(error);
        },
        async () => {
          window.clearTimeout(stallTimeout);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          setProgress(null);
          setError('');
          resolve(downloadURL);
        }
      );
    });
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file for thumbnail.');
      return;
    }

    try {
      const downloadURL = await uploadFileToStorage(file, 'thumbnails', setUploadProgress, setIsUploading, setUploadError);
      setNewGame(prev => ({ ...prev, image: downloadURL }));
      setSuccessMessage('Thumbnail uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      // Handled in upload helper
    }
  };

  const handleContentVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setContentUploadError('Please upload a video file.');
      return;
    }

    try {
      const downloadURL = await uploadFileToStorage(
        file,
        'content',
        setContentUploadProgress,
        setIsUploadingContent,
        setContentUploadError,
      );
      setNewGame(prev => ({ ...prev, contentUrl: downloadURL, type: 'video' }));
      setSuccessMessage('Video uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      // Handled in upload helper
    }
  };

  const handleSaveGame = async () => {
    if (!newGame.title?.trim()) {
      setContentSaveError('Please enter a content title.');
      return;
    }
    if (!newGame.class) {
      setContentSaveError('Please select class.');
      return;
    }
    if (!newGame.subject) {
      setContentSaveError('Please select subject.');
      return;
    }
    if (!newGame.contentUrl?.trim()) {
      setContentSaveError('Please enter content URL/redirection path.');
      return;
    }
    if (newGame.type === 'video' && isUploadingContent) {
      setContentSaveError('Please wait for video upload to complete.');
      return;
    }

    const gameId = editingContentId ?? Date.now();
    const thumbnail = newGame.image || '/images/classroom.jpg';
    const gameToAdd: WorkItem = {
      id: gameId,
      title: newGame.title.trim(),
      category: newGame.category || `${newGame.subject || 'General'} - ${newGame.class || 'All Classes'}`,
      image: thumbnail,
      class: newGame.class || '',
      subject: newGame.subject || '',
      type: newGame.type || 'game',
      contentUrl: newGame.contentUrl?.trim() || '/gamesss.html'
    };

    try {
      setIsSavingContent(true);
      setContentSaveError('');
      await setDoc(doc(db, "content", gameId.toString()), {
        ...gameToAdd,
        updatedAt: new Date().toISOString(),
        ...(editingContentId ? {} : { createdAt: new Date().toISOString() }),
      }, { merge: true });
      setIsModalOpen(false);
      resetContentForm();
      setSuccessMessage(editingContentId ? "Content updated successfully!" : "New content added successfully!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error adding content:", err);
      setContentSaveError("Failed to save content. Check Firebase rules and try again.");
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleOpenAddModal = () => {
    resetContentForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (game: WorkItem) => {
    setEditingContentId(game.id);
    setContentSaveError('');
      setUploadError('');
      setContentUploadError('');
    setNewGame({
      title: game.title || '',
      category: game.category || '',
      image: game.image || '',
      class: game.class || '',
      subject: game.subject || '',
      type: game.type || 'game',
      contentUrl: game.contentUrl || '/gamesss.html',
    });
    setIsModalOpen(true);
  };

  const handleDeleteGame = async (id: number) => {
    try {
      await deleteDoc(doc(db, "content", id.toString()));
      setSuccessMessage("Content removed successfully!");
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Error deleting content:", err);
      alert("Failed to remove content.");
    }
  };

  // Filter tabs based on role
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    ...(!isParentDashboard ? [
      { id: 'users', label: 'User Management', icon: <UsersIcon className="w-5 h-5" /> },
      { id: 'content', label: 'Manage Content', icon: <FileText className="w-5 h-5" /> },
    ] : []),
    { id: 'settings', label: 'Site Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Add Game Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              <h3 className="text-3xl font-black mb-8">{editingContentId ? 'Update Content' : 'Add New Content'}</h3>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 scrollbar-thin">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 ml-1">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Number Bonds"
                    value={newGame.title}
                    onChange={(e) => setNewGame({...newGame, title: e.target.value})}
                      disabled={isUploading || isUploadingContent || isSavingContent}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-cyan-400/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Class</label>
                    <select 
                      value={newGame.class}
                      onChange={(e) => setNewGame({...newGame, class: e.target.value})}
                      disabled={isUploading || isUploadingContent || isSavingContent}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-cyan-400/50 outline-none appearance-none"
                    >
                      <option value="" disabled>Select Class</option>
                      <option value="Class 1">Class 1</option>
                      <option value="Class 2">Class 2</option>
                      <option value="Class 3">Class 3</option>
                      <option value="All Classes">All Classes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Subject</label>
                    <select 
                      value={newGame.subject}
                      onChange={(e) => setNewGame({...newGame, subject: e.target.value})}
                      disabled={isUploading || isUploadingContent || isSavingContent}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-cyan-400/50 outline-none appearance-none"
                    >
                      <option value="" disabled>Select Subject</option>
                      <option value="Maths">Maths</option>
                      <option value="EVS">EVS</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Type</label>
                    <div className="flex gap-2">
                      {['game', 'video'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewGame({...newGame, type: type as 'game' | 'video'})}
                          disabled={isUploading || isUploadingContent || isSavingContent}
                          className={`flex-1 py-3 rounded-xl border font-bold capitalize transition-all ${
                            newGame.type === type 
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' 
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Content (Redirection)</label>
                    {newGame.type === 'video' ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => contentFileInputRef.current?.click()}
                          disabled={isUploading || isUploadingContent || isSavingContent}
                          className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-left text-sm font-bold text-slate-300 hover:border-cyan-400/60 hover:text-white transition-all disabled:opacity-60"
                        >
                          {isUploadingContent ? 'Uploading video...' : 'Upload video file from computer'}
                        </button>
                        <input
                          type="file"
                          ref={contentFileInputRef}
                          onChange={handleContentVideoSelect}
                          className="hidden"
                          accept="video/*"
                        />
                        {isUploadingContent && (
                          <div className="w-full">
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                className="h-full bg-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${contentUploadProgress || 0}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs font-bold text-cyan-400">
                              {contentUploadProgress || 0}% uploaded
                            </p>
                          </div>
                        )}
                        {newGame.contentUrl && (
                          <p className="text-xs text-emerald-400 break-all">Video URL ready: {newGame.contentUrl}</p>
                        )}
                        {contentUploadError && (
                          <p className="text-xs font-bold text-rose-400">{contentUploadError}</p>
                        )}
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="e.g. /gamesss.html"
                        value={newGame.contentUrl}
                        onChange={(e) => setNewGame({...newGame, contentUrl: e.target.value})}
                        disabled={isUploading || isUploadingContent || isSavingContent}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-cyan-400/50 outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 ml-1">Thumbnail (Image)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full aspect-video rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400/50 hover:bg-white/10 transition-all overflow-hidden ${isUploading ? 'pointer-events-none' : ''}`}
                  >
                    {newGame.image ? (
                      <img src={newGame.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        {isUploading ? (
                          <div className="flex flex-col items-center p-6 w-full">
                            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden max-w-[200px]">
                              <motion.div 
                                className="h-full bg-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span className="mt-2 text-xs font-bold text-cyan-400">{uploadProgress}% Uploaded</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">Click to upload thumbnail</p>
                            <p className="text-xs text-slate-500 mt-1">Supports Image or Video</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleThumbnailSelect} 
                    className="hidden" 
                    accept="image/*"
                  />
                  {uploadError && (
                    <p className="text-xs font-bold text-rose-400">{uploadError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setNewGame(prev => ({ ...prev, image: '/images/classroom.jpg' }));
                      setUploadError('');
                      setUploadProgress(null);
                      setIsUploading(false);
                    }}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Use default thumbnail
                  </button>
                </div>

                {contentSaveError && (
                  <p className="text-xs font-bold text-rose-400">{contentSaveError}</p>
                )}

                <button
                  onClick={handleSaveGame}
                  disabled={!newGame.title || !newGame.class || !newGame.subject || !newGame.contentUrl || isUploading || isUploadingContent || isSavingContent}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSavingContent ? 'Saving...' : (editingContentId ? 'Confirm & Update Content' : 'Confirm & Add Content')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Child Profiles Modal */}
      <AnimatePresence>
        {isChildModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsChildModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsChildModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-all"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center">
                  <Baby className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black">Child Profiles</h3>
                  <p className="text-slate-400">Parent: <span className="text-white font-bold">{selectedUser?.fullName}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userChildren.map((child) => (
                  <div key={child.id} className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-black text-cyan-400">{child.name}</h4>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">{child.grade}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-black/20">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Current Streak</p>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <span className="text-xl font-black">{child.streak} Days</span>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-black/20">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Overall Progress</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-xl font-black">{child.progress}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>Learning Journey</span>
                        <span>{child.progress}/100</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${child.progress}%` }}
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Last Active: {new Date(child.lastActive).toLocaleDateString()}</span>
                      </div>
                      <button className="text-cyan-400 font-bold hover:underline">View History</button>
                    </div>
                  </div>
                ))}
              </div>

              {userChildren.length === 0 && (
                <div className="py-20 text-center">
                  <Baby className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No child profiles found for this user.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-white/10 flex flex-col p-8 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Admin Console</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="mt-auto flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-80 p-12">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black mb-2">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'content' && 'Content Management'}
              {activeTab === 'settings' && 'Global Settings'}
            </h2>
            <p className="text-slate-400">Welcome back, Administrator</p>
          </div>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold"
              >
                <CheckCircle2 className="w-5 h-5" />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Total Games', value: localWorks.projects.length, color: 'text-cyan-400', icon: <FileCode className="w-5 h-5" /> },
                  { label: 'Daily Active Users', value: '42', color: 'text-purple-400', icon: <TrendingUp className="w-5 h-5" /> },
                  { label: 'Total Parents', value: users.length, color: 'text-emerald-400', icon: <UsersIcon className="w-5 h-5" /> },
                  { label: 'Avg Play Time', value: '18m', color: 'text-orange-400', icon: <Clock className="w-5 h-5" /> },
                ].map((stat, i) => (
                  <div key={i} className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                    <p className="text-slate-400 font-bold text-sm mb-2 uppercase tracking-wider">{stat.label}</p>
                    <h3 className={`text-5xl font-black ${stat.color}`}>{stat.value}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <TrendingUp className="text-cyan-400" />
                    Growth Metrics
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Streak Retention', value: '68%', color: 'bg-cyan-500' },
                      { label: 'Premium Conversion', value: '12%', color: 'bg-purple-500' },
                      { label: 'User Satisfaction', value: '94%', color: 'bg-emerald-500' },
                    ].map((m, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-400">{m.label}</span>
                          <span className="text-white">{m.value}</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color}`} style={{ width: m.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10">
                  <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <BookOpen className="text-purple-400" />
                    Popular Topics
                  </h3>
                  <div className="space-y-4">
                    {[
                      { topic: 'Number Bonds', plays: 450, category: 'Maths' },
                      { topic: 'Nature Explorer', plays: 380, category: 'EVS' },
                      { topic: 'Addition Adventure', plays: 320, category: 'Maths' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-slate-500">#{i+1}</div>
                          <div>
                            <p className="font-bold text-white">{t.topic}</p>
                            <p className="text-slate-500 text-xs">{t.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-cyan-400">{t.plays}</p>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">Plays</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:border-cyan-400/50 outline-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-400">
                    Total: {users.length} Users
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Parent Details</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Children</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Subscription</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users
                        .filter(u => {
                          const name = (u.fullName || '').toLowerCase();
                          const phone = u.phone || '';
                          const queryText = searchQuery.toLowerCase();
                          return name.includes(queryText) || phone.includes(searchQuery);
                        })
                        .map((user) => (
                        <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center font-black text-cyan-400">
                                {(user.fullName || 'U').charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-lg">{user.fullName || 'Unnamed User'}</p>
                                <p className="text-slate-500 text-sm font-medium">{user.phone || 'No phone'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <button 
                              onClick={() => handleViewChildren(user)}
                              className="px-4 py-2 bg-white/5 rounded-xl text-sm font-bold hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2 mx-auto"
                            >
                              <Baby className="w-4 h-4" />
                              {user.childrenCount} Profiles
                            </button>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                              user.subscription === 'premium' 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                                : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                            }`}>
                              {user.subscription}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              <span className={`text-sm font-bold ${user.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleToggleUserStatus(user)}
                                title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                className={`p-3 rounded-xl transition-all ${
                                  user.status === 'active' 
                                    ? 'hover:bg-rose-500/10 text-rose-400' 
                                    : 'hover:bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {user.status === 'active' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                              </button>
                              <button className="p-3 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="py-20 text-center">
                      <UsersIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">No registered parents found yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-12">
              {/* Hero Section Edit */}
              <section className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                      <LayoutDashboard className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold">Hero Section</h3>
                  </div>
                  <button 
                    onClick={() => handleSave('Hero Section')}
                    className="px-6 py-2.5 bg-cyan-500 text-black font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    Save Changes
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Title</label>
                    <input 
                      type="text" 
                      value={localHero.title}
                      onChange={(e) => setLocalHero({...localHero, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-cyan-400/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Subtitle</label>
                    <input 
                      type="text" 
                      value={localHero.subtitle}
                      onChange={(e) => setLocalHero({...localHero, subtitle: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-cyan-400/50 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Games Management */}
              <section className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <FileCode className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold">Manage Games</h3>
                  </div>
                  <button 
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 text-white font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Add New Content
                  </button>
                </div>

                {/* Class Tabs for Content Management */}
                <div className="flex gap-2 mb-8 p-1.5 bg-black/20 rounded-2xl w-fit">
                  {['Class 1', 'Class 2', 'Class 3', 'All'].map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setContentClassTab(cls as any)}
                      className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                        contentClassTab === cls 
                          ? 'bg-purple-500 text-white shadow-lg' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cls === 'All' ? 'All Content' : cls}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {localWorks.projects
                    .filter(game => {
                      if (contentClassTab === 'All') return true;
                      if (contentClassTab === 'Class 1') return game.class === 'Class 1' || game.class === 'All Classes';
                      if (contentClassTab === 'Class 2') return game.class === 'Class 2' || game.class === 'All Classes';
                      if (contentClassTab === 'Class 3') return game.class === 'Class 3' || game.class === 'All Classes';
                      return true;
                    })
                    .map((game, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                          {game.image.includes('.mp4') || game.image.includes('video') ? (
                            <Video className="w-8 h-8 text-cyan-400" />
                          ) : (
                            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{game.title}</h4>
                          <p className="text-slate-400 text-sm">{game.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleOpenEditModal(game)}
                          className="p-3 hover:bg-white/10 rounded-xl text-cyan-400 transition-all"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteGame(game.id)}
                          className="p-3 hover:bg-rose-500/10 rounded-xl text-rose-400 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-12">
              <section className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                      <Settings className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold">Global Configuration</h3>
                  </div>
                  <button 
                    onClick={() => handleSave('Settings')}
                    className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    Apply Settings
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Site Title</label>
                    <input 
                      type="text" 
                      value={localSite.title}
                      onChange={(e) => setLocalSite({...localSite, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-emerald-400/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Site Description</label>
                    <textarea 
                      value={localSite.description}
                      onChange={(e) => setLocalSite({...localSite, description: e.target.value})}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-emerald-400/50 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 ml-1">Language Code</label>
                    <input 
                      type="text" 
                      value={localSite.language}
                      onChange={(e) => setLocalSite({...localSite, language: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-emerald-400/50 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Subjects Management */}
              <section className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                      <Type className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold">Manage Subjects</h3>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-black font-bold rounded-xl hover:scale-105 transition-all">
                    <Plus className="w-5 h-5" /> Add New Subject
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {localServices.services.map((service, i) => (
                    <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{service.id}</span>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg mb-2">{service.title}</h4>
                      <p className="text-slate-400 text-sm line-clamp-2">{service.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
