import { motion } from 'framer-motion';
import { Baby, Users, ArrowRight, TrendingUp, Zap, Clock } from 'lucide-react';
import type { ChildProfile } from '../types/childProgress';

interface ParentData {
  fullName: string;
  email: string;
  childName: string;
  childClass: string;
  childAge?: string;
  schoolName?: string;
  learningGoal?: string;
}

interface ParentChoiceModalProps {
  parentData: ParentData;
  childProfile?: ChildProfile | null;
  onContinueChild: () => void;
  onOpenDashboard: () => void;
  onLogout: () => void;
}

export function ParentChoiceModal({ 
  parentData, 
  childProfile, 
  onContinueChild, 
  onOpenDashboard,
  onLogout 
}: ParentChoiceModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/90 rounded-[2.5rem] border border-white/10 p-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">
            Welcome, {parentData.fullName}!
          </h2>
          <p className="text-slate-400">
            Your child <span className="text-cyan-400 font-bold">{parentData.childName}</span> is waiting!
          </p>
        </div>

        {/* Child Progress Preview for Returning Parents */}
        {childProfile && (
          <div className="mb-8 p-6 rounded-3xl bg-black/30 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Baby className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-bold">{childProfile.name}</span>
              </div>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-bold text-cyan-400">
                {childProfile.grade}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <Zap className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">{childProfile.streak}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Day Streak</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-black text-white">{childProfile.progress}%</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Progress</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-xs font-black text-white">
                  {childProfile.lastActive ? new Date(childProfile.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Last Active</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Learning Journey</span>
                <span className="text-white font-bold">{childProfile.progress}/100</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${childProfile.progress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Option 1: Continue Child Learning */}
          <button
            onClick={onContinueChild}
            className="w-full p-6 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 border border-cyan-400/30 text-left group hover:scale-[1.02] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center">
                  <Baby className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black">Continue Learning</h3>
                  <p className="text-black/60 text-sm">Open games for {parentData.childName}</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 2: Parent Dashboard */}
          <button
            onClick={onOpenDashboard}
            className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 text-left group hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Parent Dashboard</h3>
                  <p className="text-slate-400 text-sm">Track progress & manage settings</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all" />
            </div>
          </button>

          {/* Logout Option */}
          <button
            onClick={onLogout}
            className="w-full text-center py-3 text-slate-500 hover:text-rose-400 text-sm transition-colors"
          >
            Logout from this account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
