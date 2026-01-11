import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFinanceStore } from '@/lib/store';
import { toast } from 'sonner';

export const useCloudSync = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const { 
    setCloudData, 
    setSyncStatus
  } = useFinanceStore();

  // Fetch all data from cloud on login
  const fetchCloudData = useCallback(async () => {
    if (!user) return;
    
    setSyncStatus('syncing');
    
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check if onboarding should be shown
      if (profile && !profile.onboarding_completed) {
        setShowOnboarding(true);
        setUserName(profile.name || '');
      }

      // Fetch categories
      const { data: cloudCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      // Fetch vendors
      const { data: cloudVendors } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id);

      // Fetch projects
      const { data: cloudProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      // Fetch transactions
      const { data: cloudTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

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
    } catch (error) {
      console.error('Error fetching cloud data:', error);
      setSyncStatus('error');
      toast.error('Failed to sync data from cloud');
    }
  }, [user, setCloudData, setSyncStatus]);

  // Sync on login
  useEffect(() => {
    if (user) {
      fetchCloudData();
    }
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

  return { fetchCloudData, showOnboarding, userName, completeOnboarding };
};