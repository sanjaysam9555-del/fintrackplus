import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Category, Project, ProjectLabel, FinanceState, TransactionType, PaymentMethod, UserProfile, Notification, Vendor, Partner, NotificationChange } from './types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { addToSyncQueue, getQueueSize, processSyncQueue, loadSyncQueue, loadRecentlySynced } from './syncEngine';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface PartnerBalance {
  partner: Partner;
  cashBalance: number;
  onlineBalance: number;
  // Breakdown details
  cashIncome: number;
  cashExpense: number;
  onlineIncome: number;
  onlineExpense: number;
  cashTransactionCount: number;
  onlineTransactionCount: number;
}

interface PartnerPeriodBalance {
  partner: Partner;
  openingCashBalance: number;
  openingOnlineBalance: number;
  periodCashIncome: number;
  periodCashExpense: number;
  periodOnlineIncome: number;
  periodOnlineExpense: number;
  closingCashBalance: number;
  closingOnlineBalance: number;
  periodCashTxnCount: number;
  periodOnlineTxnCount: number;
}

interface CloudData {
  profile?: UserProfile;
  categories: Category[];
  vendors: Vendor[];
  projects: Project[];
  transactions: Transaction[];
  partners: Partner[];
  projectLabels: ProjectLabel[];
}

interface FinanceStore extends FinanceState {
  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  // Default time filter preference
  defaultTimeFilter: 'week' | 'month' | 'year' | 'fy' | 'all';
  setDefaultTimeFilter: (filter: 'week' | 'month' | 'year' | 'fy' | 'all') => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>, userId?: string, preGeneratedId?: string, skipImmediateSync?: boolean) => void;
  addPartnerTransfer: (params: {
    fromPartnerId: string;
    toPartnerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
    time: string;
    notes?: string;
    expenseCategoryId: string;
    incomeCategoryId: string;
    fromPartnerName: string;
    toPartnerName: string;
  }, userId?: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>, userId?: string) => void;
  deleteTransaction: (id: string, userId?: string) => void;
  confirmInstallment: (parentTransactionId: string, installmentId: string, userId?: string, overrides?: { paymentMethod?: PaymentMethod; handledBy?: string }) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>, userId?: string) => void;
  updateCategory: (id: string, category: Partial<Category>, userId?: string) => void;
  deleteCategory: (id: string, userId?: string) => void;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>, userId?: string) => void;
  updateProject: (id: string, project: Partial<Project>, userId?: string) => void;
  deleteProject: (id: string, userId?: string) => void;
  
  // Vendor actions
  vendors: Vendor[];
  addVendor: (name: string, color?: string, icon?: string, userId?: string) => void;
  updateVendor: (id: string, updates: Partial<Vendor>, userId?: string) => void;
  deleteVendor: (id: string, userId?: string) => void;
  
  // Partner actions
  partners: Partner[];
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt'>, userId?: string) => void;
  updatePartner: (id: string, partner: Partial<Partner>, userId?: string) => void;
  deletePartner: (id: string, userId?: string) => void;
  getPartnerBalances: () => PartnerBalance[];
  getPartnerBalancesForPeriod: (startDate: string, endDate: string) => PartnerPeriodBalance[];
  
  // Project Label actions
  projectLabels: ProjectLabel[];
  addProjectLabel: (label: Omit<ProjectLabel, 'id' | 'createdAt'>, userId?: string) => void;
  updateProjectLabel: (id: string, updates: Partial<ProjectLabel>, userId?: string) => void;
  deleteProjectLabel: (id: string, userId?: string) => void;
  
  // Cloud sync
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setCloudData: (data: CloudData) => void;
  updatePendingCount: () => void;
  
  // Data management
  loadDemoData: () => void;
  clearAllData: () => void;
  
  // Computed helpers
  getTransactionsByType: (type: TransactionType) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getCategoryById: (id: string) => Category | undefined;
  getProjectById: (id: string) => Project | undefined;
  getProjectSpending: (projectId: string) => number;
  getProjectIncome: (projectId: string) => number;
  getTotalIncome: (startDate?: string, endDate?: string) => number;
  getTotalExpense: (startDate?: string, endDate?: string) => number;
  getUniqueVendors: () => string[];
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: [],
      projects: [],
      vendors: [],
      partners: [],
      projectLabels: [],
      userProfile: { name: 'User' },
      notifications: [],
      defaultTimeFilter: 'fy',
      setDefaultTimeFilter: (filter) => {
        const oldFilter = get().defaultTimeFilter;
        set({ defaultTimeFilter: filter });
        if (oldFilter !== filter) {
          const userName = get().userProfile.name || 'Unknown';
          get().addNotification({
            type: 'settings' as any,
            title: 'Time Filter Changed',
            message: `${userName} changed default time frame from ${oldFilter.toUpperCase()} to ${filter.toUpperCase()}`,
            details: [{ field: 'Time Frame', from: oldFilter.toUpperCase(), to: filter.toUpperCase() }],
          });
        }
      },
      syncStatus: 'idle',
      lastSyncedAt: null,
      pendingCount: 0,
      
      // Cloud sync
      setSyncStatus: (status) => set({ syncStatus: status }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      updatePendingCount: () => set({ pendingCount: getQueueSize() }),
      
    setCloudData: (data) => {
      // CRITICAL: Merge cloud data with pending local operations to prevent data loss
      const pendingQueue = loadSyncQueue();
      const recentlySynced = loadRecentlySynced();
      
      // Get sets of entity IDs that are pending insert/update (should be preserved locally)
      const pendingInserts = new Map<string, Set<string>>();
      const pendingUpdates = new Map<string, Set<string>>();
      const pendingDeletes = new Map<string, Set<string>>();
      
      // Also track recently synced items (within last 10s) to prevent race condition
      const recentInserts = new Map<string, Set<string>>();
      
      pendingQueue.forEach(op => {
        const key = op.entity;
        if (op.type === 'insert') {
          if (!pendingInserts.has(key)) pendingInserts.set(key, new Set());
          pendingInserts.get(key)!.add(op.entityId);
        } else if (op.type === 'update') {
          if (!pendingUpdates.has(key)) pendingUpdates.set(key, new Set());
          pendingUpdates.get(key)!.add(op.entityId);
        } else if (op.type === 'delete') {
          if (!pendingDeletes.has(key)) pendingDeletes.set(key, new Set());
          pendingDeletes.get(key)!.add(op.entityId);
        }
      });
      
      // Track recently synced items to prevent race condition
      recentlySynced.forEach(item => {
        if (!recentInserts.has(item.entityType)) recentInserts.set(item.entityType, new Set());
        recentInserts.get(item.entityType)!.add(item.entityId);
      });
      
      const currentState = get();
      
      // Helper to merge arrays: keep pending/recently-synced inserts from local, exclude pending deletes from cloud,
      // and preserve local versions for records with pending updates so stale refreshes don't overwrite avatars/names.
      const mergeData = <T extends { id: string }>(
        cloudItems: T[],
        localItems: T[],
        entityType: string
      ): T[] => {
        const insertIds = pendingInserts.get(entityType) || new Set();
        const updateIds = pendingUpdates.get(entityType) || new Set();
        const recentIds = recentInserts.get(entityType) || new Set();
        const deleteIds = pendingDeletes.get(entityType) || new Set();
        const localById = new Map(localItems.map(item => [item.id, item]));
        
        const merged = cloudItems
          .filter(item => !deleteIds.has(item.id))
          .map(item => {
            const localItem = localById.get(item.id);
            const hasPendingUpdate = updateIds.has(item.id);
            const isRecentlySynced = recentIds.has(item.id);

            if (localItem && (hasPendingUpdate || isRecentlySynced)) {
              return localItem;
            }

            return item;
          });
        
        const cloudIds = new Set(cloudItems.map(c => c.id));
        
        localItems.forEach(localItem => {
          const isPendingInsert = insertIds.has(localItem.id);
          const isRecentlySynced = recentIds.has(localItem.id);
          const notInCloud = !cloudIds.has(localItem.id);
          
          if ((isPendingInsert || isRecentlySynced) && notInCloud) {
            merged.push(localItem);
          }
        });
        
        return merged;
      };
      
      const mergedVendors = mergeData(data.vendors, currentState.vendors, 'vendor');
      const mergedCategories = mergeData(data.categories, currentState.categories, 'category');
      
      // NOTE: Do NOT inject fake "Not Specified" entries with uuidv4() here.
      // Those local-only IDs cause FK violations when used in transactions.
      // Instead, ensureDefaultTaxonomy() in useSyncEngine creates real backend records.

      // Patch existing "Not Specified" entries with missing icon/color
      mergedCategories.forEach((c, i) => {
        if (c.name === 'Not Specified') {
          if (!c.icon) mergedCategories[i] = { ...c, icon: 'other' };
          if (!c.color) mergedCategories[i] = { ...mergedCategories[i], color: '#6B7280' };
        }
      });

      mergedVendors.forEach((v, i) => {
        if (v.name === 'Not Specified') {
          if (!v.icon) mergedVendors[i] = { ...v, icon: 'Store' };
          if (!v.color) mergedVendors[i] = { ...mergedVendors[i], color: '#6B7280' };
        }
      });
      
      set({
        transactions: mergeData(data.transactions, currentState.transactions, 'transaction'),
        categories: mergedCategories,
        vendors: mergedVendors,
        projects: mergeData(data.projects, currentState.projects, 'project'),
        partners: mergeData(data.partners, currentState.partners, 'partner'),
        projectLabels: mergeData(data.projectLabels, currentState.projectLabels, 'project_label'),
        userProfile: data.profile || currentState.userProfile || { name: 'User' },
      });
    },
      
      // User Profile
      updateUserProfile: async (profile) => {
        const previousProfile = get().userProfile;
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile }
        }));
        
        // Sync to cloud
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileUpdates: Record<string, unknown> = {};
          if (profile.name !== undefined) profileUpdates.name = profile.name;
          if (profile.avatar !== undefined) profileUpdates.avatar_url = profile.avatar || null;

          if (Object.keys(profileUpdates).length > 0) {
            await supabase
              .from('profiles')
              .update(profileUpdates)
              .eq('user_id', user.id);
          }

          // Sync name/avatar to linked partner record
          const partnerUpdates: Record<string, unknown> = {};
          if (profile.name !== undefined) partnerUpdates.name = profile.name;
          if (profile.avatar !== undefined) partnerUpdates.avatar_url = profile.avatar || null;

          if (Object.keys(partnerUpdates).length > 0) {
            const { data: linkedPartner } = await supabase
              .from('partners')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (linkedPartner) {
              await supabase.from('partners').update(partnerUpdates).eq('id', linkedPartner.id);

              // Update local partners state immediately
              set((state) => ({
                partners: state.partners.map(p =>
                  p.id === linkedPartner.id
                    ? {
                        ...p,
                        ...(profile.name !== undefined ? { name: profile.name } : {}),
                        ...(profile.avatar !== undefined ? { avatarUrl: profile.avatar || undefined } : {}),
                      }
                    : p
                ),
              }));
            }
          }
        }
        
        // Log distinct notifications based on what changed
        if (profile.name !== undefined && profile.name !== previousProfile.name) {
          get().addNotification({
            type: 'profile',
            title: 'Name Changed',
            message: `${profile.name} changed display name from '${previousProfile.name || 'Not set'}' to '${profile.name}'`,
            details: [
              { field: 'Name', from: previousProfile.name || 'Not set', to: profile.name },
            ],
          });
        }
        if (profile.avatar !== undefined && profile.avatar !== previousProfile.avatar) {
          const currentName = get().userProfile.name || 'Unknown';
          get().addNotification({
            type: 'profile',
            title: 'Profile Photo Changed',
            message: `${currentName} updated their display picture`,
          });
        }
      },
      
      // Notifications
      addNotification: (notification) => {
        const actorName = notification.actorName || get().userProfile.name || 'Unknown';
        const id = uuidv4();
        const timestamp = new Date().toISOString();
        
        // Update local state
        set((state) => ({
          notifications: [{
            ...notification,
            id,
            timestamp,
            read: false,
            actorName,
          }, ...state.notifications].slice(0, 200)
        }));

        // Persist to DB (fire-and-forget)
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const orgId = await supabase.rpc('get_user_org_id', { _user_id: user.id }).then(r => r.data);
            if (!orgId) return;
            await supabase.from('notifications').insert({
              id,
              user_id: user.id,
              org_id: orgId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              details: (notification.details || []) as any,
              entity_type: notification.entityType || null,
              entity_id: notification.entityId || null,
              actor_name: actorName,
              read: false,
            } as any);
          } catch (e) {
            console.error('Failed to persist notification:', e);
          }
        })();
      },
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      })),
      
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      })),
      
      // Transaction actions - Optimistic local-first with background sync
      addTransaction: async (transaction, userId, preGeneratedId, skipImmediateSync) => {
        const id = preGeneratedId || uuidv4();
        
        const transactionData = {
          type: transaction.type,
          amount: transaction.amount,
          title: transaction.title || null,
          vendor: transaction.vendor,
          category_id: (transaction.categoryId && get().categories.some(c => c.id === transaction.categoryId)) ? transaction.categoryId : null,
          project_id: transaction.projectId || null,
          handled_by: transaction.handledBy || null,
          payment_method: transaction.paymentMethod,
          date: transaction.date,
          time: transaction.time,
          notes: transaction.notes || null,
          is_recurring: transaction.isRecurring || false,
          recurring_frequency: transaction.recurringFrequency || null,
          receipt_url: transaction.receiptUrl || null,
          is_gst: transaction.isGst || false,
          is_part_payment: transaction.isPartPayment || false,
          total_expected_amount: transaction.totalExpectedAmount || null,
          linked_transaction_id: transaction.linkedTransactionId || null,
          planned_installments: transaction.plannedInstallments 
            ? JSON.stringify(transaction.plannedInstallments) 
            : '[]',
        };
        
        // 1. Add to local state immediately (optimistic)
        set((state) => ({
          transactions: [{ ...transaction, id, createdAt: new Date().toISOString() }, ...state.transactions]
        }));

        // Resolve userId if caller didn't pass it (prevents local items being overwritten by cloud refresh)
        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
        
        // 2. Queue for sync (handles online/offline automatically)
        if (uid) {
          addToSyncQueue({
            type: 'insert',
            entity: 'transaction',
            entityId: id,
            data: transactionData,
            userId: uid,
          });
          get().updatePendingCount();
          
          // 3. Try to sync immediately if online (silently), unless caller wants to batch
          if (navigator.onLine && !skipImmediateSync) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        const { categories, projects, partners } = get();
        const getCategoryName = (catId?: string) => categories.find(c => c.id === catId)?.name || 'None';
        const getProjectName = (projId?: string) => projects.find(p => p.id === projId)?.name || 'None';
        const getPartnerName = (pId?: string) => partners.find(p => p.id === pId)?.name || 'None';
        
        const addDetails: NotificationChange[] = [
          { field: 'Title', from: 'New', to: transaction.title || transaction.vendor },
          { field: 'Amount', from: 'New', to: `₹${transaction.amount.toLocaleString()}` },
          { field: 'Type', from: 'New', to: transaction.type === 'income' ? 'Income' : 'Expense' },
          { field: 'Vendor', from: 'New', to: transaction.vendor },
          { field: 'Category', from: 'New', to: getCategoryName(transaction.categoryId) },
          { field: 'Payment', from: 'New', to: transaction.paymentMethod === 'cash' ? 'Cash' : 'Online' },
          { field: 'Date', from: 'New', to: transaction.date },
        ];
        if (transaction.projectId) addDetails.push({ field: 'Project', from: 'New', to: getProjectName(transaction.projectId) });
        if (transaction.handledBy) addDetails.push({ field: 'Partner', from: 'New', to: getPartnerName(transaction.handledBy) });
        
        const userName = get().userProfile.name || 'Unknown';
        get().addNotification({
          type: 'transaction',
          title: `${transaction.type === 'income' ? 'Income' : 'Expense'} Added`,
          message: `${userName} added ${transaction.type} '${transaction.title || transaction.vendor}' — ₹${transaction.amount.toLocaleString()}`,
          details: addDetails,
          entityType: 'transaction',
          entityId: id,
        });
      },
      
      addPartnerTransfer: async (params, userId) => {
        const expenseId = uuidv4();
        const incomeId = uuidv4();
        const now = new Date().toISOString();
        
        const expenseTxn: Transaction = {
          id: expenseId,
          type: 'expense',
          amount: params.amount,
          title: `Transfer to ${params.toPartnerName}`,
          vendor: 'Partner Transfer',
          categoryId: params.expenseCategoryId,
          handledBy: params.fromPartnerId,
          paymentMethod: params.paymentMethod,
          date: params.date,
          time: params.time,
          notes: params.notes || `Transfer to ${params.toPartnerName}`,
          linkedTransactionId: incomeId,
          createdAt: now,
        };
        
        const incomeTxn: Transaction = {
          id: incomeId,
          type: 'income',
          amount: params.amount,
          title: `Transfer from ${params.fromPartnerName}`,
          vendor: 'Partner Transfer',
          categoryId: params.incomeCategoryId,
          handledBy: params.toPartnerId,
          paymentMethod: params.paymentMethod,
          date: params.date,
          time: params.time,
          notes: params.notes || `Transfer from ${params.fromPartnerName}`,
          linkedTransactionId: expenseId,
          createdAt: now,
        };
        
        // 1. Insert both into local state atomically
        set((state) => ({
          transactions: [incomeTxn, expenseTxn, ...state.transactions]
        }));
        
        // Resolve userId
        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
        
        if (uid) {
          const buildDbData = (txn: Transaction) => {
            // Guard: only send category_id if it exists in current store
            const validCategoryId = txn.categoryId && get().categories.some(c => c.id === txn.categoryId)
              ? txn.categoryId
              : null;
            return {
            type: txn.type,
            amount: txn.amount,
            title: txn.title || null,
            vendor: txn.vendor,
            category_id: validCategoryId,
            project_id: txn.projectId || null,
            handled_by: txn.handledBy || null,
            payment_method: txn.paymentMethod,
            date: txn.date,
            time: txn.time,
            notes: txn.notes || null,
            is_recurring: false,
            recurring_frequency: null,
            receipt_url: null,
            is_gst: false,
            is_part_payment: false,
            total_expected_amount: null,
            linked_transaction_id: txn.linkedTransactionId || null,
            planned_installments: '[]',
          };};
          
          // 2. Queue both sync ops back-to-back
          addToSyncQueue({ type: 'insert', entity: 'transaction', entityId: expenseId, data: buildDbData(expenseTxn), userId: uid });
          addToSyncQueue({ type: 'insert', entity: 'transaction', entityId: incomeId, data: buildDbData(incomeTxn), userId: uid });
          get().updatePendingCount();
          
          // 3. Single sync trigger
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        // Notifications
        const userName = get().userProfile.name || 'Unknown';
        get().addNotification({
          type: 'partner',
          title: 'Partner Transfer',
          message: `${userName} transferred ₹${params.amount.toLocaleString()} from ${params.fromPartnerName} to ${params.toPartnerName}`,
          entityType: 'transaction',
          entityId: expenseId,
          details: [
            { field: 'Amount', from: '', to: `₹${params.amount.toLocaleString()}` },
            { field: 'From', from: '', to: params.fromPartnerName },
            { field: 'To', from: '', to: params.toPartnerName },
            { field: 'Payment Mode', from: '', to: params.paymentMethod === 'cash' ? 'Cash' : 'Online' },
            { field: 'Date', from: '', to: params.date },
          ],
        });
      },
      
      updateTransaction: async (id, updates, userId) => {
        const transaction = get().transactions.find(t => t.id === id);
        const { categories, projects, partners } = get();
        
        // Helper to get readable names
        const getCategoryName = (catId?: string) => 
          categories.find(c => c.id === catId)?.name || 'None';
        const getProjectName = (projId?: string) => 
          projects.find(p => p.id === projId)?.name || 'None';
        const getPartnerName = (handledBy?: string) => 
          partners.find(p => p.userId === handledBy)?.name || 'None';
        
        // Build change details before update
        const changes: NotificationChange[] = [];
        
        if (transaction) {
          if (updates.amount !== undefined && updates.amount !== transaction.amount) {
            changes.push({
              field: 'Amount',
              from: `₹${transaction.amount.toLocaleString()}`,
              to: `₹${updates.amount.toLocaleString()}`
            });
          }
          if (updates.type && updates.type !== transaction.type) {
            changes.push({
              field: 'Type',
              from: transaction.type === 'income' ? 'Income' : 'Expense',
              to: updates.type === 'income' ? 'Income' : 'Expense'
            });
          }
          if (updates.vendor && updates.vendor !== transaction.vendor) {
            changes.push({
              field: 'Vendor',
              from: transaction.vendor,
              to: updates.vendor
            });
          }
          if (updates.categoryId !== undefined && updates.categoryId !== transaction.categoryId) {
            changes.push({
              field: 'Category',
              from: getCategoryName(transaction.categoryId),
              to: getCategoryName(updates.categoryId)
            });
          }
          if (updates.projectId !== undefined && updates.projectId !== transaction.projectId) {
            changes.push({
              field: 'Project',
              from: getProjectName(transaction.projectId),
              to: getProjectName(updates.projectId)
            });
          }
          if (updates.handledBy !== undefined && updates.handledBy !== transaction.handledBy) {
            changes.push({
              field: 'Partner',
              from: getPartnerName(transaction.handledBy),
              to: getPartnerName(updates.handledBy)
            });
          }
          if (updates.paymentMethod && updates.paymentMethod !== transaction.paymentMethod) {
            changes.push({
              field: 'Payment',
              from: transaction.paymentMethod === 'cash' ? 'Cash' : 'Online',
              to: updates.paymentMethod === 'cash' ? 'Cash' : 'Online'
            });
          }
          if (updates.date && updates.date !== transaction.date) {
            changes.push({
              field: 'Date',
              from: transaction.date,
              to: updates.date
            });
          }
          if (updates.isGst !== undefined && updates.isGst !== transaction.isGst) {
            changes.push({
              field: 'GST',
              from: transaction.isGst ? 'Yes' : 'No',
              to: updates.isGst ? 'Yes' : 'No'
            });
          }
        }
        
        // 1. Update local state immediately (optimistic)
        set((state) => ({
          transactions: state.transactions.map((t) => 
            t.id === id ? { ...t, ...updates } : t
          )
        }));
        
        // 2. Queue for sync
        if (userId) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.type) dbUpdates.type = updates.type;
          if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
          if (updates.title !== undefined) dbUpdates.title = updates.title || null;
          if (updates.vendor) dbUpdates.vendor = updates.vendor;
          if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null;
          if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null;
          if (updates.handledBy !== undefined) dbUpdates.handled_by = updates.handledBy || null;
          if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
          if (updates.date) dbUpdates.date = updates.date;
          if (updates.time) dbUpdates.time = updates.time;
          if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
          if (updates.receiptUrl !== undefined) dbUpdates.receipt_url = updates.receiptUrl || null;
          if (updates.isGst !== undefined) dbUpdates.is_gst = updates.isGst || false;
          if (updates.isPartPayment !== undefined) dbUpdates.is_part_payment = updates.isPartPayment || false;
          if (updates.totalExpectedAmount !== undefined) dbUpdates.total_expected_amount = updates.totalExpectedAmount || null;
          if (updates.linkedTransactionId !== undefined) dbUpdates.linked_transaction_id = updates.linkedTransactionId || null;
          if (updates.plannedInstallments !== undefined) {
            dbUpdates.planned_installments = updates.plannedInstallments 
              ? JSON.stringify(updates.plannedInstallments) 
              : '[]';
          }
          
          addToSyncQueue({
            type: 'update',
            entity: 'transaction',
            entityId: id,
            data: dbUpdates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }

        if (transaction) {
          const userName = get().userProfile.name || 'Unknown';
          get().addNotification({
            type: 'edit',
            title: 'Transaction Updated',
            message: `${userName} edited transaction '${updates.title || updates.vendor || transaction.title || transaction.vendor}' — ₹${(updates.amount ?? transaction.amount).toLocaleString()}`,
            details: changes.length > 0 ? changes : undefined,
            entityType: 'transaction',
            entityId: id,
          });
        }
      },
      
      deleteTransaction: async (id, userId) => {
        const transaction = get().transactions.find(t => t.id === id);
        const { categories, projects, partners } = get();
        
        // Cascade delete for linked partner transfers
        let linkedTransaction: typeof transaction | undefined;
        if (transaction?.vendor === 'Partner Transfer' && transaction.linkedTransactionId) {
          linkedTransaction = get().transactions.find(t => t.id === transaction.linkedTransactionId);
        }
        
        // Helper to get readable names
        const getCategoryName = (catId?: string) => 
          categories.find(c => c.id === catId)?.name || 'None';
        const getProjectName = (projId?: string) => 
          projects.find(p => p.id === projId)?.name || 'None';
        const getPartnerName = (handledBy?: string) => 
          partners.find(p => p.userId === handledBy)?.name || 'None';
        
        // Capture details before deletion
        const details: NotificationChange[] = transaction ? [
          { field: 'Type', from: transaction.type === 'income' ? 'Income' : 'Expense', to: 'Deleted' },
          { field: 'Amount', from: `₹${transaction.amount.toLocaleString()}`, to: 'Deleted' },
          { field: 'Date', from: transaction.date, to: 'Deleted' },
          { field: 'Category', from: getCategoryName(transaction.categoryId), to: 'Deleted' },
          ...(transaction.projectId ? [{ field: 'Project', from: getProjectName(transaction.projectId), to: 'Deleted' }] : []),
          ...(transaction.handledBy ? [{ field: 'Partner', from: getPartnerName(transaction.handledBy), to: 'Deleted' }] : []),
          { field: 'Payment', from: transaction.paymentMethod === 'cash' ? 'Cash' : 'Online', to: 'Deleted' },
        ] : [];
        
        // 1. Remove from local state immediately (optimistic) — include linked transfer
        const idsToDelete = new Set([id]);
        if (linkedTransaction) idsToDelete.add(linkedTransaction.id);
        
        set((state) => ({
          transactions: state.transactions.filter((t) => !idsToDelete.has(t.id))
        }));
        
        // 2. Queue for sync
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'transaction',
            entityId: id,
            data: {},
            userId,
          });
          
          // Also queue linked transfer for cloud deletion
          if (linkedTransaction) {
            addToSyncQueue({
              type: 'delete',
              entity: 'transaction',
              entityId: linkedTransaction.id,
              data: {},
              userId,
            });
          }
          
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (transaction) {
          const userName = get().userProfile.name || 'Unknown';
          get().addNotification({
            type: 'delete',
            title: 'Transaction Deleted',
            message: `${userName} deleted transaction '${transaction.title || transaction.vendor}' — ₹${transaction.amount.toLocaleString()}`,
            details,
            entityType: 'transaction',
            entityId: id,
          });
        }
      },
      
      // Confirm an installment payment - creates linked transaction and updates parent
      confirmInstallment: async (parentTransactionId, installmentId, userId, overrides) => {
        const parent = get().transactions.find(t => t.id === parentTransactionId);
        if (!parent || !parent.plannedInstallments) return;
        
        const installment = parent.plannedInstallments.find(i => i.id === installmentId);
        if (!installment || installment.status === 'received') return;
        
        const today = new Date();
        const newTransactionId = uuidv4();
        
        // 1. Create a new linked transaction for this installment
        const linkedTransaction = {
          id: newTransactionId,
          type: parent.type,
          amount: installment.amount,
          title: parent.title ? `${parent.title} - Installment` : `${parent.vendor} - Installment`,
          vendor: parent.vendor,
          categoryId: parent.categoryId,
          projectId: parent.projectId,
          handledBy: overrides?.handledBy ?? parent.handledBy,
          paymentMethod: overrides?.paymentMethod ?? parent.paymentMethod,
          date: today.toISOString().split('T')[0],
          time: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`,
          notes: `Installment payment for ${parent.title || parent.vendor}`,
          linkedTransactionId: parentTransactionId,
        };
        
        // 2. Update parent's plannedInstallments to mark as received
        const updatedInstallments = parent.plannedInstallments.map(i => 
          i.id === installmentId 
            ? { ...i, status: 'received' as const, receivedDate: today.toISOString().split('T')[0] }
            : i
        );
        
        // 3. Optimistically update local state
        set((state) => ({
          transactions: [
            linkedTransaction,
            ...state.transactions.map(t => 
              t.id === parentTransactionId 
                ? { ...t, plannedInstallments: updatedInstallments }
                : t
            )
          ]
        }));
        
        // Resolve userId
        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
        
        // 4. Queue both operations for sync
        if (uid) {
          // Queue the new linked transaction
          addToSyncQueue({
            type: 'insert',
            entity: 'transaction',
            entityId: newTransactionId,
            data: {
              type: linkedTransaction.type,
              amount: linkedTransaction.amount,
              title: linkedTransaction.title,
              vendor: linkedTransaction.vendor,
              category_id: linkedTransaction.categoryId || null,
              project_id: linkedTransaction.projectId || null,
              handled_by: linkedTransaction.handledBy || null,
              payment_method: linkedTransaction.paymentMethod,
              date: linkedTransaction.date,
              time: linkedTransaction.time,
              notes: linkedTransaction.notes,
              linked_transaction_id: linkedTransaction.linkedTransactionId,
            },
            userId: uid,
          });
          
          // Queue the parent update
          addToSyncQueue({
            type: 'update',
            entity: 'transaction',
            entityId: parentTransactionId,
            data: {
              planned_installments: JSON.stringify(updatedInstallments),
            },
            userId: uid,
          });
          
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'transaction',
          title: 'Installment Confirmed',
          message: `₹${installment.amount.toLocaleString('en-IN')} received for ${parent.title || parent.vendor}`,
          details: [
            { field: 'Amount', from: 'New', to: `₹${installment.amount.toLocaleString('en-IN')}` },
            { field: 'Parent Transaction', from: 'New', to: parent.title || parent.vendor },
            { field: 'Date', from: 'New', to: installment.receivedDate || new Date().toISOString().split('T')[0] },
          ],
          entityType: 'transaction',
          entityId: parentTransactionId,
        });
      },
      
      // Category actions - Optimistic local-first with background sync
      addCategory: async (category, userId) => {
        const id = uuidv4();
        
        set((state) => ({
          categories: [...state.categories, { ...category, id }]
        }));

        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
         
        if (uid) {
          addToSyncQueue({
            type: 'insert',
            entity: 'category',
            entityId: id,
            data: {
              name: category.name,
              icon: category.icon,
              color: category.color,
              type: category.type,
            },
            userId: uid,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'category',
          title: 'Category Added',
          message: category.name,
          details: [
            { field: 'Name', from: 'New', to: category.name },
            { field: 'Type', from: 'New', to: category.type === 'income' ? 'Income' : 'Expense' },
            { field: 'Icon', from: 'New', to: category.icon || 'None' },
          ],
          entityType: 'category',
          entityId: id,
        });
      },
      
      updateCategory: async (id, updates, userId) => {
        const category = get().categories.find(c => c.id === id);
        
        // Build change details
        const changes: NotificationChange[] = [];
        if (category) {
          if (updates.name && updates.name !== category.name) {
            changes.push({ field: 'Name', from: category.name, to: updates.name });
          }
          if (updates.icon && updates.icon !== category.icon) {
            changes.push({ field: 'Icon', from: category.icon, to: updates.icon });
          }
          if (updates.type && updates.type !== category.type) {
            changes.push({ 
              field: 'Type', 
              from: category.type === 'income' ? 'Income' : 'Expense', 
              to: updates.type === 'income' ? 'Income' : 'Expense' 
            });
          }
        }
        
        set((state) => ({
          categories: state.categories.map((c) => 
            c.id === id ? { ...c, ...updates } : c
          )
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'update',
            entity: 'category',
            entityId: id,
            data: updates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'edit',
          title: 'Category Updated',
          message: updates.name || category?.name || 'Category modified',
          details: changes.length > 0 ? changes : undefined,
          entityType: 'category',
          entityId: id,
        });
      },
      
      deleteCategory: async (id, userId) => {
        const category = get().categories.find(c => c.id === id);
        
        // Capture details before deletion
        const details: NotificationChange[] = category ? [
          { field: 'Name', from: category.name, to: 'Deleted' },
          { field: 'Type', from: category.type === 'income' ? 'Income' : 'Expense', to: 'Deleted' },
          { field: 'Icon', from: category.icon, to: 'Deleted' },
        ] : [];
        
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id)
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'category',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (category) {
          get().addNotification({
            type: 'delete',
            title: 'Category Deleted',
            message: category.name,
            details,
            entityType: 'category',
            entityId: id,
          });
        }
      },
      
      // Project actions - Optimistic local-first with background sync
      addProject: async (project, userId) => {
        const id = uuidv4();
        const createdAt = new Date().toISOString().split('T')[0];
        
        set((state) => ({
          projects: [...state.projects, { ...project, id, createdAt }]
        }));

        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
         
        if (uid) {
          addToSyncQueue({
            type: 'insert',
            entity: 'project',
            entityId: id,
            data: {
              name: project.name,
              description: project.description || null,
              budget_limit: project.internalCost,
              margin: project.clientCost || 0,
              expected_margin: project.expectedMargin || 0,
              color: project.color,
              label_ids: project.labelIds || [],
              assigned_employee_ids: project.assignedEmployeeIds || [],
              event_date: project.eventDate || null,
              start_date: project.startDate || null,
            },
            userId: uid,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'project',
          title: 'Project Added',
          message: project.name,
          details: [
            { field: 'Name', from: 'New', to: project.name },
            { field: 'Internal Cost', from: 'New', to: `₹${project.internalCost.toLocaleString()}` },
            { field: 'Client Cost', from: 'New', to: `₹${(project.clientCost || 0).toLocaleString()}` },
            ...(project.description ? [{ field: 'Description', from: 'New', to: project.description }] : []),
          ],
          entityType: 'project',
          entityId: id,
        });
      },
      
      updateProject: async (id, updates, userId) => {
        const project = get().projects.find(p => p.id === id);
        
        // Build change details
        const changes: NotificationChange[] = [];
        if (project) {
          if (updates.name && updates.name !== project.name) {
            changes.push({ field: 'Name', from: project.name, to: updates.name });
          }
          if (updates.internalCost !== undefined && updates.internalCost !== project.internalCost) {
            changes.push({ 
              field: 'Internal Cost', 
              from: `₹${project.internalCost.toLocaleString()}`, 
              to: `₹${updates.internalCost.toLocaleString()}` 
            });
          }
          if (updates.clientCost !== undefined && updates.clientCost !== project.clientCost) {
            changes.push({ 
              field: 'Client Cost', 
              from: `₹${project.clientCost.toLocaleString()}`, 
              to: `₹${updates.clientCost.toLocaleString()}` 
            });
          }
          if (updates.archived !== undefined && updates.archived !== project.archived) {
            changes.push({ 
              field: 'Status', 
              from: project.archived ? 'Archived' : 'Active', 
              to: updates.archived ? 'Archived' : 'Active' 
            });
          }
          if (updates.description !== undefined && updates.description !== project.description) {
            changes.push({ 
              field: 'Description', 
              from: project.description || 'None', 
              to: updates.description || 'None' 
            });
          }
        }
        
        set((state) => ({
          projects: state.projects.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          )
        }));
        
        if (userId) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
          if (updates.internalCost !== undefined) dbUpdates.budget_limit = updates.internalCost;
          if (updates.clientCost !== undefined) dbUpdates.margin = updates.clientCost;
          if (updates.expectedMargin !== undefined) dbUpdates.expected_margin = updates.expectedMargin;
          if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
          if (updates.color) dbUpdates.color = updates.color;
          if (updates.labelIds !== undefined) dbUpdates.label_ids = updates.labelIds;
          if (updates.assignedEmployeeIds !== undefined) dbUpdates.assigned_employee_ids = updates.assignedEmployeeIds;
          if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate || null;
          if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
          
          addToSyncQueue({
            type: 'update',
            entity: 'project',
            entityId: id,
            data: dbUpdates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'edit',
          title: 'Project Updated',
          message: updates.name || project?.name || 'Project modified',
          details: changes.length > 0 ? changes : undefined,
          entityType: 'project',
          entityId: id,
        });
      },
      
      deleteProject: async (id, userId) => {
        const project = get().projects.find(p => p.id === id);
        
        // Capture details before deletion
        const details: NotificationChange[] = project ? [
          { field: 'Name', from: project.name, to: 'Deleted' },
          { field: 'Internal Cost', from: `₹${project.internalCost.toLocaleString()}`, to: 'Deleted' },
          { field: 'Client Cost', from: `₹${project.clientCost.toLocaleString()}`, to: 'Deleted' },
          { field: 'Status', from: project.archived ? 'Archived' : 'Active', to: 'Deleted' },
        ] : [];
        
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'project',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (project) {
          get().addNotification({
            type: 'delete',
            title: 'Project Deleted',
            message: project.name,
            details,
            entityType: 'project',
            entityId: id,
          });
        }
      },
      
      // Vendor actions - Optimistic local-first with background sync
      addVendor: async (name, color, icon, userId) => {
        const id = uuidv4();
        
        set((state) => ({
          vendors: [...state.vendors, { id, name, color, icon }]
        }));

        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
         
        if (uid) {
          addToSyncQueue({
            type: 'insert',
            entity: 'vendor',
            entityId: id,
            data: {
              name,
              icon: icon || null,
              color: color || null,
            },
            userId: uid,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'vendor',
          title: 'Vendor Added',
          message: name,
          details: [
            { field: 'Name', from: 'New', to: name },
            ...(icon ? [{ field: 'Icon', from: 'New', to: icon }] : []),
          ],
          entityType: 'vendor',
          entityId: id,
        });
      },
      
      updateVendor: async (id, updates, userId) => {
        const vendor = get().vendors.find(v => v.id === id);
        const oldVendorName = vendor?.name;
        
        // Build change details
        const changes: NotificationChange[] = [];
        if (vendor) {
          if (updates.name && updates.name !== vendor.name) {
            changes.push({ field: 'Name', from: vendor.name, to: updates.name });
          }
          if (updates.icon !== undefined && updates.icon !== vendor.icon) {
            changes.push({ field: 'Icon', from: vendor.icon || 'None', to: updates.icon || 'None' });
          }
        }
        
        // Check if name is changing - we'll need to update transactions too
        const nameChanged = updates.name && oldVendorName && updates.name !== oldVendorName;
        
        set((state) => ({
          vendors: state.vendors.map((v) => 
            v.id === id ? { ...v, ...updates } : v
          ),
          // Also update transactions that reference the old vendor name
          transactions: nameChanged
            ? state.transactions.map((t) =>
                t.vendor === oldVendorName ? { ...t, vendor: updates.name! } : t
              )
            : state.transactions
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'update',
            entity: 'vendor',
            entityId: id,
            data: updates,
            userId,
          });
          
          // If name changed, also queue transaction updates
          if (nameChanged) {
            const affectedTransactions = get().transactions.filter(t => t.vendor === updates.name);
            for (const txn of affectedTransactions) {
              addToSyncQueue({
                type: 'update',
                entity: 'transaction',
                entityId: txn.id,
                data: { vendor: updates.name },
                userId,
              });
            }
          }
          
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'edit',
          title: 'Vendor Updated',
          message: updates.name || vendor?.name || 'Vendor modified',
          details: changes.length > 0 ? changes : undefined,
          entityType: 'vendor',
          entityId: id,
        });
      },
      
      deleteVendor: async (id, userId) => {
        const vendor = get().vendors.find(v => v.id === id);
        
        // Capture details before deletion
        const details: NotificationChange[] = vendor ? [
          { field: 'Name', from: vendor.name, to: 'Deleted' },
          ...(vendor.icon ? [{ field: 'Icon', from: vendor.icon, to: 'Deleted' }] : []),
        ] : [];
        
        set((state) => ({
          vendors: state.vendors.filter((v) => v.id !== id)
        }));
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'vendor',
            entityId: id,
            data: {},
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (vendor) {
          get().addNotification({
            type: 'delete',
            title: 'Vendor Deleted',
            message: vendor.name,
            details,
            entityType: 'vendor',
            entityId: id,
          });
        }
      },
      
      // Partner actions - Optimistic local-first with background sync
      addPartner: async (partner, userId) => {
        const id = uuidv4();
        const createdAt = new Date().toISOString().split('T')[0];
        
        set((state) => ({
          partners: [...state.partners, { ...partner, id, createdAt }]
        }));

        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
         
        if (uid) {
          addToSyncQueue({
            type: 'insert',
            entity: 'partner',
            entityId: id,
            data: {
              name: partner.name,
              color: partner.color,
              initial_cash_balance: partner.initialCashBalance,
              initial_online_balance: partner.initialOnlineBalance,
              avatar_url: partner.avatarUrl || null,
            },
            userId: uid,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        get().addNotification({
          type: 'partner',
          title: 'Partner Added',
          message: partner.name,
          details: [
            { field: 'Name', from: 'New', to: partner.name },
            { field: 'Cash Balance', from: 'New', to: `₹${partner.initialCashBalance.toLocaleString()}` },
            { field: 'Online Balance', from: 'New', to: `₹${partner.initialOnlineBalance.toLocaleString()}` },
          ],
          entityType: 'partner',
          entityId: id,
        });
      },
      
      updatePartner: async (id, updates, userId) => {
        const partner = get().partners.find(p => p.id === id);
        
        // Build change details
        const changes: NotificationChange[] = [];
        if (partner) {
          if (updates.name && updates.name !== partner.name) {
            changes.push({ field: 'Name', from: partner.name, to: updates.name });
          }
          if (updates.initialCashBalance !== undefined && updates.initialCashBalance !== partner.initialCashBalance) {
            changes.push({ 
              field: 'Cash Balance', 
              from: `₹${partner.initialCashBalance.toLocaleString()}`, 
              to: `₹${updates.initialCashBalance.toLocaleString()}` 
            });
          }
          if (updates.initialOnlineBalance !== undefined && updates.initialOnlineBalance !== partner.initialOnlineBalance) {
            changes.push({ 
              field: 'Online Balance', 
              from: `₹${partner.initialOnlineBalance.toLocaleString()}`, 
              to: `₹${updates.initialOnlineBalance.toLocaleString()}` 
            });
          }
        }
        
        set((state) => ({
          partners: state.partners.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          )
        }));
        
        if (userId) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.color) dbUpdates.color = updates.color;
          if (updates.initialCashBalance !== undefined) dbUpdates.initial_cash_balance = updates.initialCashBalance;
          if (updates.initialOnlineBalance !== undefined) dbUpdates.initial_online_balance = updates.initialOnlineBalance;
          if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl || null;
          
          addToSyncQueue({
            type: 'update',
            entity: 'partner',
            entityId: id,
            data: dbUpdates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (partner) {
          get().addNotification({
            type: 'edit',
            title: 'Partner Updated',
            message: updates.name || partner.name,
            details: changes.length > 0 ? changes : undefined,
            entityType: 'partner',
            entityId: id,
          });
        }
      },
      
      deletePartner: async (id, userId) => {
        const partner = get().partners.find(p => p.id === id);
        
        // Capture details before deletion
        const details: NotificationChange[] = partner ? [
          { field: 'Name', from: partner.name, to: 'Deleted' },
          { field: 'Cash Balance', from: `₹${partner.initialCashBalance.toLocaleString()}`, to: 'Deleted' },
          { field: 'Online Balance', from: `₹${partner.initialOnlineBalance.toLocaleString()}`, to: 'Deleted' },
        ] : [];
        
        // Find all transactions assigned to this partner so we can unassign them
        const partnerUserId = partner?.userId;
        const affectedTransactionIds = partnerUserId ? get().transactions
          .filter(t => t.handledBy === partnerUserId)
          .map(t => t.id) : [];
        
        set((state) => ({
          partners: state.partners.filter((p) => p.id !== id),
          // Unassign transactions from deleted partner
          transactions: partnerUserId ? state.transactions.map(t => 
            t.handledBy === partnerUserId ? { ...t, handledBy: undefined } : t
          ) : state.transactions,
        }));
        
        if (userId) {
          // Queue partner deletion
          addToSyncQueue({
            type: 'delete',
            entity: 'partner',
            entityId: id,
            data: {},
            userId,
          });
          
          // Queue transaction unassignments
          affectedTransactionIds.forEach(txnId => {
            addToSyncQueue({
              type: 'update',
              entity: 'transaction',
              entityId: txnId,
              data: { handled_by: null },
              userId,
            });
          });
          
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
        
        if (partner) {
          get().addNotification({
            type: 'delete',
            title: 'Partner Deleted',
            message: `${partner.name} — ${affectedTransactionIds.length} transaction${affectedTransactionIds.length !== 1 ? 's' : ''} unassigned`,
            details,
            entityType: 'partner',
            entityId: id,
          });
        }
      },
      
      // Project Label actions - Optimistic local-first with background sync
      addProjectLabel: async (label, userId) => {
        const id = uuidv4();
        const createdAt = new Date().toISOString().split('T')[0];
        
        set((state) => ({
          projectLabels: [...state.projectLabels, { ...label, id, createdAt }]
        }));

        get().addNotification({
          type: 'label',
          title: 'Label Added',
          message: `#${label.name}`,
          details: [
            { field: 'Name', from: 'New', to: label.name },
            { field: 'Color', from: 'New', to: label.color },
          ],
          entityType: 'label',
          entityId: id,
        });

        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
         
        if (uid) {
          addToSyncQueue({
            type: 'insert',
            entity: 'project_label',
            entityId: id,
            data: {
              name: label.name,
              color: label.color,
            },
            userId: uid,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
      },
      
      updateProjectLabel: async (id, updates, userId) => {
        const oldLabel = get().projectLabels.find(l => l.id === id);
        set((state) => ({
          projectLabels: state.projectLabels.map((l) => 
            l.id === id ? { ...l, ...updates } : l
          )
        }));

        const labelChanges: { field: string; from: string; to: string }[] = [];
        if (updates.name && updates.name !== oldLabel?.name) labelChanges.push({ field: 'Name', from: oldLabel?.name || '', to: updates.name });
        if (updates.color && updates.color !== oldLabel?.color) labelChanges.push({ field: 'Color', from: oldLabel?.color || '', to: updates.color });
        
        get().addNotification({
          type: 'edit',
          title: 'Label Updated',
          message: `#${updates.name || oldLabel?.name || 'Label'}`,
          details: labelChanges.length > 0 ? labelChanges : undefined,
          entityType: 'label',
          entityId: id,
        });
        
        if (userId) {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.color) dbUpdates.color = updates.color;
          
          addToSyncQueue({
            type: 'update',
            entity: 'project_label',
            entityId: id,
            data: dbUpdates,
            userId,
          });
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
      },
      
      deleteProjectLabel: async (id, userId) => {
        const label = get().projectLabels.find(l => l.id === id);
        // Also remove this label from any projects that reference it
        set((state) => ({
          projectLabels: state.projectLabels.filter((l) => l.id !== id),
          projects: state.projects.map(p => 
            p.labelIds?.includes(id) 
              ? { ...p, labelIds: p.labelIds.filter(lid => lid !== id) }
              : p
          )
        }));

        if (label) {
          get().addNotification({
            type: 'delete',
            title: 'Label Deleted',
            message: `#${label.name}`,
            details: [
              { field: 'Name', from: label.name, to: 'Deleted' },
              { field: 'Color', from: label.color, to: 'Deleted' },
            ],
            entityType: 'label',
            entityId: id,
          });
        }
        
        if (userId) {
          addToSyncQueue({
            type: 'delete',
            entity: 'project_label',
            entityId: id,
            data: {},
            userId,
          });
          
          // Also update projects that had this label
          const projectsWithLabel = get().projects.filter(p => p.labelIds?.includes(id));
          for (const proj of projectsWithLabel) {
            addToSyncQueue({
              type: 'update',
              entity: 'project',
              entityId: proj.id,
              data: { label_ids: proj.labelIds?.filter(lid => lid !== id) || [] },
              userId,
            });
          }
          
          get().updatePendingCount();
          
          if (navigator.onLine) {
            processSyncQueue().then(() => get().updatePendingCount()).catch(console.error);
          }
        }
      },
      
      getPartnerBalances: () => {
        const { transactions, partners } = get();
        
        return partners.map(partner => {
          const partnerTxns = transactions.filter(t => t.handledBy === partner.userId);
          
          const cashTxns = partnerTxns.filter(t => t.paymentMethod === 'cash');
          const onlineTxns = partnerTxns.filter(t => t.paymentMethod === 'online');
          
          const cashIncome = cashTxns
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          const cashExpense = cashTxns
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          const onlineIncome = onlineTxns
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          const onlineExpense = onlineTxns
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          
          return {
            partner,
            cashBalance: partner.initialCashBalance + cashIncome - cashExpense,
            onlineBalance: partner.initialOnlineBalance + onlineIncome - onlineExpense,
            cashIncome,
            cashExpense,
            onlineIncome,
            onlineExpense,
            cashTransactionCount: cashTxns.length,
            onlineTransactionCount: onlineTxns.length,
          };
        });
      },
      
      getPartnerBalancesForPeriod: (startDate: string, endDate: string) => {
        const { transactions, partners } = get();
        
        return partners.map(partner => {
          // Opening balance = initialBalance + all transactions BEFORE startDate
          const txnsBeforePeriod = transactions.filter(t => 
            t.handledBy === partner.userId && t.date < startDate
          );
          const txnsInPeriod = transactions.filter(t => 
            t.handledBy === partner.userId && t.date >= startDate && t.date <= endDate
          );
          
          // Calculate opening balances (initial + all txns before period)
          const preCashIncome = txnsBeforePeriod.filter(t => t.paymentMethod === 'cash' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const preCashExpense = txnsBeforePeriod.filter(t => t.paymentMethod === 'cash' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const preOnlineIncome = txnsBeforePeriod.filter(t => t.paymentMethod === 'online' && t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const preOnlineExpense = txnsBeforePeriod.filter(t => t.paymentMethod === 'online' && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          
          const openingCashBalance = partner.initialCashBalance + preCashIncome - preCashExpense;
          const openingOnlineBalance = partner.initialOnlineBalance + preOnlineIncome - preOnlineExpense;
          
          // Calculate period activity
          const periodCashTxns = txnsInPeriod.filter(t => t.paymentMethod === 'cash');
          const periodOnlineTxns = txnsInPeriod.filter(t => t.paymentMethod === 'online');
          
          const periodCashIncome = periodCashTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const periodCashExpense = periodCashTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const periodOnlineIncome = periodOnlineTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const periodOnlineExpense = periodOnlineTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          
          return {
            partner,
            openingCashBalance,
            openingOnlineBalance,
            periodCashIncome,
            periodCashExpense,
            periodOnlineIncome,
            periodOnlineExpense,
            closingCashBalance: openingCashBalance + periodCashIncome - periodCashExpense,
            closingOnlineBalance: openingOnlineBalance + periodOnlineIncome - periodOnlineExpense,
            periodCashTxnCount: periodCashTxns.length,
            periodOnlineTxnCount: periodOnlineTxns.length,
          };
        });
      },
      
      loadDemoData: () => {
        set({
          transactions: [],
          categories: [],
          projects: [],
          vendors: [],
          partners: [],
          projectLabels: [],
        });
      },
      
      clearAllData: () => set({
        transactions: [],
        categories: [],
        projects: [],
        vendors: [],
        partners: [],
        projectLabels: [],
      }),
      
      // Computed helpers
      getTransactionsByType: (type) => 
        get().transactions.filter((t) => t.type === type),
      
      getTransactionsByDateRange: (startDate, endDate) => 
        get().transactions.filter((t) => t.date >= startDate && t.date <= endDate),
      
      getCategoryById: (id) => 
        get().categories.find((c) => c.id === id),
      
      getProjectById: (id) => 
        get().projects.find((p) => p.id === id),
      
      getProjectSpending: (projectId) => 
        get().transactions
          .filter((t) => t.projectId === projectId && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
      
      getProjectIncome: (projectId) => 
        get().transactions
          .filter((t) => t.projectId === projectId && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
      
      getTotalIncome: (startDate, endDate) => {
        let transactions = get().transactions.filter((t) => t.type === 'income');
        if (startDate && endDate) {
          transactions = transactions.filter((t) => t.date >= startDate && t.date <= endDate);
        }
        return transactions.reduce((sum, t) => sum + t.amount, 0);
      },
      
      getTotalExpense: (startDate, endDate) => {
        let transactions = get().transactions.filter((t) => t.type === 'expense');
        if (startDate && endDate) {
          transactions = transactions.filter((t) => t.date >= startDate && t.date <= endDate);
        }
        return transactions.reduce((sum, t) => sum + t.amount, 0);
      },
      
      getUniqueVendors: () => {
        const vendors = new Set(get().transactions.map(t => t.vendor));
        return Array.from(vendors);
      },
    }),
    {
      name: 'fintrack-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        categories: state.categories,
        projects: state.projects,
        vendors: state.vendors,
        partners: state.partners,
        projectLabels: state.projectLabels,
        userProfile: state.userProfile,
        notifications: state.notifications,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);