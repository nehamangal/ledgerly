'use client';

import { useEffect, useState } from 'react';
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

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactions, setTransactions] = useState([]);

  const [newAccountName, setNewAccountName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('INR');
  const [initialBalance, setInitialBalance] = useState('');

  const [type, setType] = useState('EXPENSE');
  const [toAccountId, setToAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const router = useRouter();

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
      const txRes = await fetchWithAuth(`/fetchTransaction?accountId=${accountId}`);
      if (txRes.ok) {
        setTransactions(await txRes.json());
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

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

  useEffect(() => {
    if (selectedAccountId) {
      loadTransactions(selectedAccountId);
    }
  }, [selectedAccountId]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
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
        setInitialBalance('');
        await loadAccounts();
        if (selectedAccountId) {
          await loadTransactions(selectedAccountId);
        }
      }
    } catch (err) {
      console.error('Failed to create account', err);
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
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const selectedAccount = accounts.find((a) => a.id === parseInt(selectedAccountId));
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo href="/dashboard" />
          <button onClick={handleLogout} className="btn-danger">
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage accounts, record transactions, and track your balance.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card bg-gradient-to-br from-primary to-primary-hover text-white">
            <p className="text-sm font-medium text-emerald-100">Total balance</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-muted">Accounts</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{accounts.length}</p>
          </div>
          <div className="card sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-medium text-muted">Transactions</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{transactions.length}</p>
          </div>
        </div>

        {/* Create account */}
        <section className="card mb-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create new account</h2>
              <p className="text-sm text-muted">Add a bank account to start tracking</p>
            </div>
          </div>

          <form onSubmit={handleCreateAccount} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label">Account name</label>
              <input
                type="text"
                placeholder="My Savings"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Bank name</label>
              <input
                type="text"
                placeholder="HDFC"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Currency</label>
              <input
                type="text"
                placeholder="INR"
                value={newAccountCurrency}
                onChange={(e) => setNewAccountCurrency(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Initial balance</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">
                Add account
              </button>
            </div>
          </form>
        </section>

        {/* Account cards */}
        {accounts.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Your accounts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((acc) => {
                const isSelected = String(acc.id) === selectedAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(String(acc.id))}
                    className={`card text-left transition-all hover:shadow-md ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted">{acc.bankName}</p>
                        <p className="mt-0.5 font-semibold text-foreground">{acc.name}</p>
                      </div>
                      {isSelected && (
                        <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-2xl font-bold tracking-tight">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Transaction form */}
        <section className="card mb-8">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">New transaction</h2>
            {selectedAccount ? (
              <p className="mt-1 text-sm text-muted">
                From{' '}
                <span className="font-medium text-primary">{selectedAccount.name}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-red-600">Create an account first to record transactions.</p>
            )}
          </div>

          {accounts.length > 0 && (
            <form onSubmit={handleAddTransaction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="label">Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setToAccountId(''); // reset counterparty when type changes
                  }}
                  className="input-field"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              <div>
                <label className="label">
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
                  className="input-field"
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
                <label className="label">Description</label>
                <input
                  type="text"
                  placeholder={type === 'TRANSFER' ? 'Account Transfer' : 'Coffee, salary, etc.'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  Submit
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Transaction history */}
        <section className="card">
          <h2 className="mb-4 text-lg font-semibold">Transaction history</h2>

          {loadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">No transactions yet</p>
              <p className="mt-1 text-sm text-muted">Transactions for the selected account will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 pr-4 font-medium text-foreground">{tx.description}</td>
                      <td className="py-3.5 pr-4">
                        <TypeBadge type={tx.type} />
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-medium">
                        {formatCurrency(tx.amount, selectedAccount?.currency)}
                      </td>
                      <td className="py-3.5 text-muted">
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
