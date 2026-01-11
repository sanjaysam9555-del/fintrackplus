import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFinanceStore } from '@/lib/store';
import { useOnlineStatus } from './useOnlineStatus';
import { syncPendingOperations, getPendingOperationsCount } from '@/lib/offlineSync';
import { toast } from 'sonner';

export const useCloudSync = () => {
  const { user } = useAuth();
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    setCloudData, 
    setSyncStatus,
    setLastSyncedAt,
    updatePendingCount,
    pendingCount
  } = useFinanceStore();

  // Fetch all data from cloud on login - PARALLEL fetch for speed
  const fetchCloudData = useCallback(async (showToast = false) => {
    if (!user) return;
    
    setSyncStatus('syncing');
    if (showToast) setIsRefreshing(true);
    
    try {
      // Fetch ALL data in parallel for faster sync
      const [
        profileResult,
        categoriesResult,
        vendorsResult,
        projectsResult,
        transactionsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('vendors').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      const profile = profileResult.data;
      const cloudCategories = categoriesResult.data;
      const cloudVendors = vendorsResult.data;
      const cloudProjects = projectsResult.data;
      const cloudTransactions = transactionsResult.data;

      // Check if onboarding should be shown
      if (profile && !profile.onboarding_completed) {
        setShowOnboarding(true);
        setUserName(profile.name || '');
      }

      setCloudData({
        profile: profile ? { name: profile.name, avatar: profile.avatar_url } : undefined,
        categories: cloudCategories?.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type as 'income' | 'expense'
        })) || [],
        vendors: cloudVendors?.map(v => ({
          id: v.id,
          name: v.name,
          icon: v.icon || undefined,
          color: v.color || undefined
        })) || [],
        projects: cloudProjects?.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || undefined,
          budgetLimit: Number(p.budget_limit),
          color: p.color,
          createdAt: p.created_at.split('T')[0]
        })) || [],
        transactions: cloudTransactions?.map(t => ({
          id: t.id,
          type: t.type as 'income' | 'expense',
          amount: Number(t.amount),
          title: (t as unknown as { title?: string }).title || undefined,
          vendor: t.vendor,
          categoryId: t.category_id || '',
          projectId: t.project_id || undefined,
          paymentMethod: t.payment_method as 'cash' | 'online',
          date: t.date,
          time: t.time,
          notes: t.notes || undefined,
          isRecurring: t.is_recurring || false,
          recurringFrequency: t.recurring_frequency as 'weekly' | 'monthly' | undefined
        })) || []
      });

      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      if (showToast) {
        toast.success('Data synced successfully');
      }
    } catch (error) {
      console.error('Error fetching cloud data:', error);
      setSyncStatus('error');
      toast.error('Failed to sync data from cloud');
    } finally {
      setIsRefreshing(false);
    }
  }, [user, setCloudData, setSyncStatus, setLastSyncedAt]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    fetchCloudData(true);
  }, [fetchCloudData]);

  // Sync pending operations when coming back online
  const syncOfflineChanges = useCallback(async () => {
    if (!user || !isOnline) return;
    
    const pendingCount = getPendingOperationsCount();
    if (pendingCount === 0) return;
    
    setSyncStatus('syncing');
    toast.info(`Syncing ${pendingCount} offline change${pendingCount > 1 ? 's' : ''}...`);
    
    const { synced, failed } = await syncPendingOperations();
    
    updatePendingCount();
    
    if (synced > 0) {
      toast.success(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
      // Refresh data to get the latest from cloud
      await fetchCloudData();
    }
    
    if (failed > 0) {
      toast.error(`Failed to sync ${failed} change${failed > 1 ? 's' : ''}`);
      setSyncStatus('error');
    }
  }, [user, isOnline, fetchCloudData, setSyncStatus, updatePendingCount]);

  // Sync on login
  useEffect(() => {
    if (user) {
      fetchCloudData();
      // Also sync any pending offline changes
      syncOfflineChanges();
    }
  }, [user, fetchCloudData, syncOfflineChanges]);

  // Sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline && user) {
      syncOfflineChanges();
    }
  }, [wasOffline, isOnline, user, syncOfflineChanges]);

  // Set up realtime subscriptions for live updates with debouncing
  useEffect(() => {
    if (!user) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Debounced fetch to prevent multiple rapid fetches
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchCloudData();
      }, 300); // 300ms debounce
    };

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        debouncedFetch
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user, fetchCloudData]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);
    
    setShowOnboarding(false);
  }, [user]);

  return { fetchCloudData, refreshData, isRefreshing, showOnboarding, userName, completeOnboarding, isOnline, pendingCount };
};