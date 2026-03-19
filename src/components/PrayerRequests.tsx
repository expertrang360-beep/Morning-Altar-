import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { UserData, PrayerRequest } from '../types';

interface PrayerRequestsProps {
  userData: UserData;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

export function PrayerRequests({ userData, onUpdateUserData }: PrayerRequestsProps) {
  const [newRequest, setNewRequest] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    const request: PrayerRequest = {
      id: crypto.randomUUID(),
      text: newRequest.trim(),
      createdAt: new Date().toISOString(),
      isAnswered: false
    };

    onUpdateUserData({
      prayerRequests: [request, ...(userData.prayerRequests || [])]
    });
    setNewRequest('');
    setIsAdding(false);
  };

  const toggleAnswered = (id: string) => {
    const updated = (userData.prayerRequests || []).map(req => 
      req.id === id ? { ...req, isAnswered: !req.isAnswered } : req
    );
    onUpdateUserData({ prayerRequests: updated });
  };

  const deleteRequest = (id: string) => {
    const updated = (userData.prayerRequests || []).filter(req => req.id !== id);
    onUpdateUserData({ prayerRequests: updated });
  };

  const requests = userData.prayerRequests || [];
  const activeRequests = requests.filter(r => !r.isAnswered);
  const answeredRequests = requests.filter(r => r.isAnswered);

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Heart className="w-4 h-4" /> Prayer Requests
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 hover:bg-amber-500/20 transition-colors"
        >
          <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="mb-4 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newRequest}
                onChange={(e) => setNewRequest(e.target.value)}
                placeholder="What are you praying for?"
                className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!newRequest.trim()}
                className="bg-amber-500 text-black px-4 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {activeRequests.length === 0 && answeredRequests.length === 0 && !isAdding && (
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl text-center">
            <p className="text-zinc-500 text-sm">No prayer requests yet.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="text-amber-500 text-sm font-bold mt-2 hover:underline"
            >
              Add your first request
            </button>
          </div>
        )}

        <AnimatePresence>
          {activeRequests.map(req => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center gap-3 group"
            >
              <button 
                onClick={() => toggleAnswered(req.id)}
                className="flex-shrink-0 text-zinc-500 hover:text-amber-500 transition-colors"
              >
                <Circle className="w-6 h-6" />
              </button>
              <p className="flex-1 text-sm text-zinc-200">{req.text}</p>
              <button 
                onClick={() => deleteRequest(req.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {answeredRequests.length > 0 && (
            <motion.div layout className="pt-4">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3 px-1">Answered Prayers</p>
              <div className="space-y-3">
                {answeredRequests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center gap-3 group"
                  >
                    <button 
                      onClick={() => toggleAnswered(req.id)}
                      className="flex-shrink-0 text-emerald-500 hover:text-zinc-500 transition-colors"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <p className="flex-1 text-sm text-zinc-500 line-through">{req.text}</p>
                    <button 
                      onClick={() => deleteRequest(req.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
