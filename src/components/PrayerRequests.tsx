import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';
import { UserData, PrayerRequest } from '../types';

interface PrayerRequestsProps {
  userData: UserData;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

export function PrayerRequests({ userData, onUpdateUserData }: PrayerRequestsProps) {
  const [newRequest, setNewRequest] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmedRequest = newRequest.trim();
    
    if (!trimmedRequest) {
      setError('Please enter a prayer request.');
      return;
    }
    
    if (trimmedRequest.length < 3) {
      setError('Prayer request must be at least 3 characters long.');
      return;
    }
    
    if (trimmedRequest.length > 500) {
      setError('Prayer request cannot exceed 500 characters.');
      return;
    }

    const request: PrayerRequest = {
      id: crypto.randomUUID(),
      text: trimmedRequest,
      createdAt: new Date().toISOString(),
      isAnswered: false,
      dueDate: newDueDate || undefined
    };

    onUpdateUserData({
      prayerRequests: [request, ...(userData.prayerRequests || [])]
    });
    setNewRequest('');
    setNewDueDate('');
    setError(null);
    setIsAdding(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewRequest(e.target.value);
    if (error) setError(null);
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
        <h3 className="text-sm font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
          <Heart className="w-4 h-4" /> Prayer Requests
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-full bg-theme-accent/10 flex items-center justify-center text-theme-accent hover:bg-theme-accent/20 transition-colors"
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
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newRequest}
                onChange={handleInputChange}
                placeholder="What are you praying for?"
                className={`w-full bg-theme-card/50 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-theme-border focus:border-theme-accent/50'} rounded-2xl py-3 px-4 text-theme-text focus:outline-none transition-colors text-sm`}
                autoFocus
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-theme-card/50 border border-theme-border focus:border-theme-accent/50 rounded-2xl py-3 pl-10 pr-4 text-theme-muted focus:outline-none transition-colors text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!newRequest.trim()}
                  className="bg-theme-accent text-theme-bg px-6 rounded-2xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs px-2">{error}</p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {activeRequests.length === 0 && answeredRequests.length === 0 && !isAdding && (
          <div className="bg-theme-card/50 border border-theme-border p-6 rounded-3xl text-center">
            <p className="text-theme-muted text-sm">No prayer requests yet.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="text-theme-accent text-sm font-bold mt-2 hover:underline"
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
              className="bg-theme-card/80 border border-theme-border p-4 rounded-2xl flex items-center gap-3 group"
            >
              <button 
                onClick={() => toggleAnswered(req.id)}
                className="flex-shrink-0 text-theme-muted hover:text-theme-accent transition-colors"
              >
                <Circle className="w-6 h-6" />
              </button>
              <div className="flex-1">
                <p className="text-sm text-theme-text/90">{req.text}</p>
                {req.dueDate && (
                  <p className="text-xs text-theme-accent/80 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due: {new Date(req.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                  </p>
                )}
              </div>
              <button 
                onClick={() => deleteRequest(req.id)}
                className="opacity-0 group-hover:opacity-100 text-theme-muted/60 hover:text-theme-accent transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {answeredRequests.length > 0 && (
            <motion.div layout className="pt-4">
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-3 px-1">Answered Prayers</p>
              <div className="space-y-3">
                {answeredRequests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-theme-card/30 border border-theme-border/50 p-4 rounded-2xl flex items-center gap-3 group"
                  >
                    <button 
                      onClick={() => toggleAnswered(req.id)}
                      className="flex-shrink-0 text-emerald-500 hover:text-theme-muted transition-colors"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                      <p className="text-sm text-theme-muted line-through">{req.text}</p>
                      {req.dueDate && (
                        <p className="text-xs text-theme-muted/60 mt-1 flex items-center gap-1 line-through">
                          <Calendar className="w-3 h-3" /> Due: {new Date(req.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => deleteRequest(req.id)}
                      className="opacity-0 group-hover:opacity-100 text-theme-muted/60 hover:text-red-500 transition-all"
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
