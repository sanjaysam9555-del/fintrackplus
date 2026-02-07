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

  // Ensure pending count is correct on initial load
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Fetch all data from cloud on login - PARALLEL fetch for speed
  const fetchCloudData = useCallback(async (showToast = false) => {
    if (!user) return;

    const previousStatus = useFinanceStore.getState().syncStatus;
    setSyncStatus('syncing');

    try {
      // Fetch ALL data in parallel for faster sync
      const [
        profileResult,
        categoriesResult,
        vendorsResult,
        projectsResult,
        transactionsResult,
        partnersResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('categories').select('*').eq('user_id', user.id),
        supabase.from('vendors').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('partners').select('*').eq('user_id', user.id)
      ]);

      const firstError =
        profileResult.error ||
        categoriesResult.error ||
        vendorsResult.error ||
        projectsResult.error ||
        transactionsResult.error ||
        partnersResult.error;

      if (firstError) {
        throw firstError;
      }

      const profile = profileResult.data;
      const cloudCategories = categoriesResult.data;
      const cloudVendors = vendorsResult.data;
      const cloudProjects = projectsResult.data;
      const cloudTransactions = transactionsResult.data;
      const cloudPartners = partnersResult.data;

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
          notes: (p as unknown as { notes?: string }).notes || undefined,
          budgetLimit: Number(p.budget_limit),
          margin: Number((p as unknown as { margin?: number }).margin) || 0,
          archived: (p as unknown as { archived?: boolean }).archived || false,
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
          partnerId: (t as unknown as { partner_id?: string }).partner_id || undefined,
          paymentMethod: t.payment_method as 'cash' | 'online',
          date: t.date,
          time: t.time,
          notes: t.notes || undefined,
          isRecurring: t.is_recurring || false,
          recurringFrequency: t.recurring_frequency as 'weekly' | 'monthly' | undefined,
          receiptUrl: (t as unknown as { receipt_url?: string }).receipt_url || undefined,
          isGst: (t as unknown as { is_gst?: boolean }).is_gst || false,
          isPartPayment: (t as unknown as { is_part_payment?: boolean }).is_part_payment || false,
          totalExpectedAmount: (t as unknown as { total_expected_amount?: number }).total_expected_amount ? Number((t as unknown as { total_expected_amount: number }).total_expected_amount) : undefined,
          linkedTransactionId: (t as unknown as { linked_transaction_id?: string }).linked_transaction_id || undefined,
          plannedInstallments: (t as unknown as { planned_installments?: unknown }).planned_installments 
            ? (typeof (t as unknown as { planned_installments: unknown }).planned_installments === 'string' 
                ? JSON.parse((t as unknown as { planned_installments: string }).planned_installments) 
                : (t as unknown as { planned_installments: unknown }).planned_installments) 
            : undefined
        })) || [],
        partners: cloudPartners?.map(p => ({
          id: (p as { id: string }).id,
          name: (p as { name: string }).name,
          color: (p as { color: string }).color,
          initialCashBalance: Number((p as { initial_cash_balance: number }).initial_cash_balance) || 0,
          initialOnlineBalance: Number((p as { initial_online_balance: number }).initial_online_balance) || 0,
          createdAt: (p as { created_at: string }).created_at.split('T')[0]
        })) || []
      });

      setLastSyncedAt(new Date().toISOString());
      const remainingPending = getPendingOperationsCount();

      // If we previously had a sync error and pending ops still exist, keep error state.
      if (previousStatus === 'error' && remainingPending > 0) {
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }

      if (showToast) {
        if (remainingPending > 0) {
          toast.info(`Cloud refreshed. ${remainingPending} change${remainingPending > 1 ? 's' : ''} still pending upload.`);
        } else {
          toast.success('Sync successful');
        }
      }
    } catch (error) {
      console.error('Error fetching cloud data:', error);
      setSyncStatus('error');
      toast.error('Failed to sync data from cloud');
    }
  }, [user, setCloudData, setSyncStatus, setLastSyncedAt]);

  // Sync pending operations when coming back online
  const syncOfflineChanges = useCallback(async (options: { showToast?: boolean; refreshAfter?: boolean } = {}) => {
    const { showToast = true, refreshAfter = true } = options;

    if (!user || !isOnline) {
      return { synced: 0, failed: 0, remaining: getPendingOperationsCount() };
    }

    const pending = getPendingOperationsCount();
    if (pending === 0) {
      return { synced: 0, failed: 0, remaining: 0 };
    }

    setSyncStatus('syncing');
    if (showToast) {
      toast.info(`Syncing ${pending} offline change${pending > 1 ? 's' : ''}...`);
    }

    const { synced, failed } = await syncPendingOperations();

    updatePendingCount();
    const remaining = getPendingOperationsCount();

    if (failed > 0) {
      setSyncStatus('error');
      if (showToast) {
        toast.error(`Failed to sync ${failed} change${failed > 1 ? 's' : ''}`);
      }
    } else {
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      if (showToast && synced > 0) {
        toast.success(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
      }
    }

    if (refreshAfter && synced > 0) {
      await fetchCloudData(false);
    }

    return { synced, failed, remaining };
  }, [user, isOnline, fetchCloudData, setSyncStatus, updatePendingCount, setLastSyncedAt]);

  // Manual refresh function (also tries to push pending offline changes first)
  const refreshData = useCallback(async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      await syncOfflineChanges({ showToast: false, refreshAfter: false });
      await fetchCloudData(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, syncOfflineChanges, fetchCloudData]);

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partners',
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