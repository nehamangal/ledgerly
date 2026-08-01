'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/api';
import Logo from '@/components/Logo';

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function TypeBadge({ type }) {
  const styles = {
    INCOME: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    IN: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    EXPENSE: 'bg-red-50 text-red-700 ring-red-600/20',
    OUT: 'bg-red-50 text-red-700 ring-red-600/20',
    TRANSFER: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[type] || 'bg-slate-50 text-slate-600 ring-slate-500/20'}`}>
      {type}
    </span>
  );
}

function categorizeTransaction(description = '') {
  const desc = description.toLowerCase();
  if (desc.includes('food') || desc.includes('restaurant') || desc.includes('cafe') || desc.includes('swiggy') || desc.includes('zomato')) return 'Food & Dining';
  if (desc.includes('shop') || desc.includes('amazon') || desc.includes('flipkart') || desc.includes('store') || desc.includes('clothes')) return 'Shopping';
  if (desc.includes('bill') || desc.includes('electricity') || desc.includes('wifi') || desc.includes('utility') || desc.includes('recharge')) return 'Utilities';
  if (desc.includes('cab') || desc.includes('uber') || desc.includes('ola') || desc.includes('fuel') || desc.includes('metro') || desc.includes('train')) return 'Transport';
  if (desc.includes('salary') || desc.includes('freelance') || desc.includes('credit') || desc.includes('stipend')) return 'Income';
  return 'General';
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState([]);

  // Create-account form state
  const [newAccountName, setNewAccountName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('INR');
  const [initialBalance, setInitialBalance] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  // New-transaction form state
  const [type, setType] = useState('EXPENSE');
  const [toAccountId, setToAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submittingTx, setSubmittingTx] = useState(false);

  // Django Insights & Live SSE State
  const [insights, setInsights] = useState({ subscriptions: [], anomalies: [] });
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sseStatus, setSseStatus] = useState('Connecting...');

  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const router = useRouter();

  // Compute Category Spending
  const categorySpending = useMemo(() => {
    const map = {};
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const txType = (tx.type || '').toUpperCase();
      if (txType === 'EXPENSE' || txType === 'OUT') {
        const cat = categorizeTransaction(tx.description);
        const amt = parseFloat(tx.amount) || 0;
        map[cat] = (map[cat] || 0) + amt;
        totalExpense += amt;
      }
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Compute Monthly Trend (In vs Out)
  const monthlyTrend = useMemo(() => {
    const map = {};

    transactions.forEach((tx) => {
      const rawDate = tx.transaction_time || tx.date || tx.createdAt;
      const dateObj = rawDate ? new Date(rawDate) : new Date();
      const monthKey = dateObj.toLocaleString('en-US', { month: 'short', year: '2-digit' });

      if (!map[monthKey]) {
        map[monthKey] = { month: monthKey, income: 0, expense: 0, sortDate: dateObj };
      }

      const txType = (tx.type || '').toUpperCase();
      const amt = parseFloat(tx.amount) || 0;

      if (txType === 'INCOME' || txType === 'IN') {
        map[monthKey].income += amt;
      } else if (txType === 'EXPENSE' || txType === 'OUT') {
        map[monthKey].expense += amt;
      }
    });

    return Object.values(map)
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(-6);
  }, [transactions]);

  const loadAccounts = async () => {
    const accRes = await fetchWithAuth('/accounts');
    if (accRes.ok) {
      const accData = await accRes.json();
      setAccounts(accData);
      if (accData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(String(accData[0].id));
      }
    }

    const allAccRes = await fetchWithAuth('/allUserAccounts');
    if (allAccRes.ok) {
      setAllAccounts(await allAccRes.json());
    }
  };

  const loadTransactions = async (accountId) => {
    if (!accountId) {
      setTransactions([]);
      return;
    }

    setLoadingTransactions(true);
    try {
      const txRes = await fetchWithAuth(`/transactions?accountId=${accountId}`);
      if (txRes.ok) {
        setTransactions(await txRes.json());
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadInitialInsights = async (accountId) => {
    if (!accountId) return;
    setLoadingInsights(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}insight?accountId=${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setInsights({
          subscriptions: data.subscriptions || [],
          anomalies: data.anomalies || [],
        });
      }
    } catch (err) {
      console.error('Failed to load initial Django insights', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Setup Django SSE Live Stream Subscription
  useEffect(() => {
    if (!selectedAccountId) return;

    loadInitialInsights(selectedAccountId);
    loadTransactions(selectedAccountId);

    // Connect to Django SSE stream endpoint
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}stream/${selectedAccountId}/`);

    eventSource.onopen = () => {
      setSseStatus('Live Connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === 'NEW_INSIGHTS') {
          setInsights({
            subscriptions: parsedData.subscriptions || [],
            anomalies: parsedData.anomalies || [],
          });
        }
      } catch (err) {
        // Ignores heartbeats/comments
      }
    };

    eventSource.onerror = () => {
      setSseStatus('Reconnecting...');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [selectedAccountId]);

  const loadDashboardData = async () => {
    try {
      await loadAccounts();
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreatingAccount(true);
    try {
      const res = await fetchWithAuth('/account', {
        method: 'POST',
        body: JSON.stringify({
          name: newAccountName,
          bankName: newBankName,
          currency: newAccountCurrency,
          balance: parseFloat(initialBalance) || 0,
        }),
      });

      if (res.ok) {
        setNewAccountName('');
        setNewBankName('');
        setNewAccountCurrency('INR');
        setInitialBalance('');
        await loadAccounts();
        if (selectedAccountId) {
          await loadTransactions(selectedAccountId);
        }
      }
    } catch (err) {
      console.error('Failed to create account', err);
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedAccountId || !toAccountId) return;

    const selfId = parseInt(selectedAccountId);
    const counterpartyId = parseInt(toAccountId);

    // Backend always moves money fromAccount -> toAccount, so flip the
    // direction here based on the selected transaction type.
    const fromId = type === 'INCOME' ? counterpartyId : selfId;
    const toId = type === 'INCOME' ? selfId : counterpartyId;

    setSubmittingTx(true);
    try {
      const res = await fetchWithAuth('/transactions', {
        method: 'POST',
        headers: {
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          fromAccount: { id: fromId },
          toAccount: { id: toId },
          amount: parseFloat(amount),
          type,
          description,
        }),
      });

      if (res.ok) {
        setAmount('');
        setDescription('');
        setToAccountId('');
        await loadAccounts();
        await loadTransactions(selectedAccountId);
      }
    } catch (err) {
      console.error('Failed to add transaction', err);
    } finally {
      setSubmittingTx(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === parseInt(selectedAccountId));
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {sseStatus}
            </span>
            <button onClick={handleLogout} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Event-driven Spring Boot core paired with Django background predictions via RabbitMQ & SSE.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-sm">
            <p className="text-sm font-medium text-emerald-100">Total balance</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Accounts Linked</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{accounts.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-medium text-slate-500">Total Transactions</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{transactions.length}</p>
          </div>
        </div>

        {/* Create account */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create new account</h2>
              <p className="text-sm text-slate-500">Add a bank account to start tracking</p>
            </div>
          </div>

          <form onSubmit={handleCreateAccount} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Account name</label>
              <input
                type="text"
                placeholder="My Savings"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Bank name</label>
              <input
                type="text"
                placeholder="HDFC"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Currency</label>
              <input
                type="text"
                placeholder="INR"
                value={newAccountCurrency}
                onChange={(e) => setNewAccountCurrency(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Initial balance</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creatingAccount}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingAccount ? 'Adding…' : 'Add account'}
              </button>
            </div>
          </form>
        </section>

        {/* Django Real-Time Insights Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Subscriptions Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </span>
                <h2 className="font-semibold text-slate-900">Live Subscriptions</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {insights.subscriptions?.length || 0} Detected
              </span>
            </div>

            {loadingInsights ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading subscriptions...</div>
            ) : insights.subscriptions?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                No active recurring subscriptions found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {insights.subscriptions.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sub.merchant}</p>
                      <p className="text-xs text-slate-400">Frequency: {sub.frequency || 'Monthly'}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {formatCurrency(sub.amount, selectedAccount?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anomaly Alerts Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </span>
                <h2 className="font-semibold text-slate-900">Real-Time Anomaly Alerts</h2>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {insights.anomalies?.length || 0} flagged
              </span>
            </div>

            {loadingInsights ? (
              <div className="py-8 text-center text-sm text-slate-400">Checking for spikes...</div>
            ) : insights.anomalies?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                No unusual spending patterns flagged.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {insights.anomalies.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.merchant}</p>
                      <p className="text-xs text-amber-600">{item.reason}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-red-600">
                      {formatCurrency(item.amount, selectedAccount?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Spending by Category */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Spending by Category</h2>
            <div className="h-64 flex flex-col justify-center">
              {categorySpending.length > 0 ? (
                <div className="space-y-3">
                  {categorySpending.map((cat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{cat.category}</span>
                        <span className="font-mono text-slate-900">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-slate-400">
                  {loadingTransactions ? "Loading categories..." : "No expense records found."}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Monthly Trend (In vs Out)</h2>
            <div className="h-64 flex items-end gap-3 justify-around pt-6 border-b border-slate-100 pb-2">
              {monthlyTrend.length > 0 ? (
                monthlyTrend.map((m, idx) => {
                  const maxVal = Math.max(...monthlyTrend.map(x => Math.max(x.income, x.expense)), 1000);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-48">
                        <div
                          title={`Income: ${m.income}`}
                          className="w-3 bg-emerald-500 rounded-t"
                          style={{ height: `${Math.max(4, Math.min(100, (m.income / maxVal) * 100))}%` }}
                        />
                        <div
                          title={`Expense: ${m.expense}`}
                          className="w-3 bg-red-500 rounded-t"
                          style={{ height: `${Math.max(4, Math.min(100, (m.expense / maxVal) * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{m.month}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-sm text-slate-400 self-center">
                  {loadingTransactions ? "Loading trends..." : "No transaction history available."}
                </div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Income</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Expense</span>
            </div>
          </div>
        </div>

        {/* Account Cards Selector */}
        {accounts.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Your accounts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((acc) => {
                const isSelected = String(acc.id) === selectedAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(String(acc.id))}
                    className={`rounded-2xl border bg-white p-6 text-left transition-all hover:shadow-md ${
                      isSelected ? 'border-emerald-600 ring-2 ring-emerald-600/10' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-400">{acc.bankName}</p>
                        <p className="mt-0.5 font-semibold text-slate-900">{acc.name}</p>
                      </div>
                      {isSelected && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* New transaction form */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">New transaction</h2>
            {selectedAccount ? (
              <p className="mt-1 text-sm text-slate-500">
                From <span className="font-medium text-emerald-700">{selectedAccount.name}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-red-600">Create an account first to record transactions.</p>
            )}
          </div>

          {accounts.length > 0 && (
            <form onSubmit={handleAddTransaction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setToAccountId(''); // reset counterparty when type changes
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  {type === 'INCOME'
                    ? 'Received from account'
                    : type === 'EXPENSE'
                    ? 'Paid to account'
                    : 'To account'}
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select account</option>
                  {allAccounts
                    .filter((acc) => acc.id !== parseInt(selectedAccountId))
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName ? `${acc.bankName} — ` : ''}{acc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Description</label>
                <input
                  type="text"
                  placeholder={type === 'TRANSFER' ? 'Account Transfer' : 'Coffee, salary, etc.'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submittingTx}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingTx ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Transaction History Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Transaction history</h2>

          {loadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-slate-900">No transactions yet</p>
              <p className="mt-1 text-sm text-slate-400">Transactions for the selected account will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 pr-4 font-medium text-slate-900">{tx.description}</td>
                      <td className="py-3.5 pr-4">
                        <TypeBadge type={tx.type} />
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-medium text-slate-900">
                        {formatCurrency(tx.amount, selectedAccount?.currency)}
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(tx.transaction_time || tx.date || tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}