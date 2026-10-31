import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CirclePlus,
  Clock3,
  CreditCard,
  Copy,
  House,
  IndianRupee,
  LogOut,
  MailPlus,
  Pencil,
  PiggyBank,
  ReceiptText,
  ShoppingBag,
  Trash2,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-react';
import AuthScreen from './AuthScreen.jsx';
import AccountMethods from './AccountMethods.jsx';
import FinanceModule from './FinanceModule.jsx';
import HistoryModule from './HistoryModule.jsx';
import LoanTracker from './LoanTracker.jsx';
import HouseholdSetup from './HouseholdSetup.jsx';
import { supabase } from './supabaseClient.js';

const merchants = [
  'Express Delivery App',
  'Amazon',
  'Flipkart',
  'Meesho',
  'Myntra',
  'Dmart',
  'RatanDip',
  'Vijetha',
  'Swiggy',
  'Zomato',
  'Restaurant',
  'Rent',
  'Maintenance',
  'Electricity Bill',
  'Water Bill',
  'Newspaper',
  'Internet Bill',
  'Fuel',
  'OTT Subscriptions',
  'Other',
];
const namedMerchants = new Set(['Other', 'Restaurant', 'OTT Subscriptions']);
const pageTitles = {
  overview: 'Home',
  earnings: 'Earnings',
  expenses: 'Expenses',
  savings: 'Savings',
  history: 'History',
  loans: 'Loans & EMIs',
  household: 'Household',
};

const storageKey = 'expense-tracker-entries';
const today = new Date();
const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function readEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString, options = { day: 'numeric', month: 'short' }) {
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(`${dateString}T00:00:00`));
}

function merchantColor(merchant) {
  const colors = {
    Amazon: 'lavender',
    Flipkart: 'blue',
    Meesho: 'rose',
    Myntra: 'rose',
    Dmart: 'lime',
    RatanDip: 'rose',
    Vijetha: 'lime',
    Swiggy: 'orange',
    Zomato: 'rose',
    Restaurant: 'mint',
    Rent: 'blue',
    Maintenance: 'lime',
    'Electricity Bill': 'orange',
    'Water Bill': 'blue',
    Newspaper: 'mint',
    'Internet Bill': 'lavender',
    Fuel: 'orange',
    'OTT Subscriptions': 'rose',
    Other: 'mint',
    'Express Delivery App': 'blue',
  };
  return colors[merchant] ?? 'mint';
}

function fromDatabaseRow(row) {
  return {
    id: row.id,
    memberId: row.member_id,
    createdBy: row.created_by,
    merchant: row.merchant,
    merchantName: row.merchant_name ?? '',
    date: row.expense_date,
    amount: Number(row.amount),
    createdAt: new Date(row.created_at).getTime(),
  };
}

function fromFinanceRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    memberId: row.member_id,
    createdBy: row.created_by,
    kind: row.kind,
    category: row.category,
    description: row.description,
    date: row.record_date,
    amount: Number(row.amount),
    createdAt: new Date(row.created_at).getTime(),
  };
}

function fromLoanRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    memberId: row.member_id,
    createdBy: row.created_by,
    name: row.name,
    lender: row.lender,
    principal: Number(row.principal),
    emiAmount: Number(row.emi_amount),
    dueDay: Number(row.due_day),
    startDate: row.start_date,
    active: row.active,
  };
}

function fromLoanPaymentRow(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    loanId: row.loan_id,
    memberId: row.member_id,
    createdBy: row.created_by,
    periodMonth: row.period_month.slice(0, 7),
    paymentDate: row.payment_date,
    amount: Number(row.amount),
    createdAt: new Date(row.created_at).getTime(),
  };
}

const financeStorageKey = 'pocket-tracker-finance-records';
const loansStorageKey = 'pocket-tracker-loans';
const loanPaymentsStorageKey = 'pocket-tracker-loan-payments';

function readLocalRecords(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function readHouseholdMembership(userId) {
  return supabase.from('household_members')
    .select('household_id, role, households(name)')
    .eq('user_id', userId)
    .maybeSingle();
}

function ExpenseTracker() {
  const [entries, setEntries] = useState(() => (supabase ? [] : readEntries()));
  const [financeRecords, setFinanceRecords] = useState(() => (supabase ? [] : readLocalRecords(financeStorageKey)));
  const [loans, setLoans] = useState(() => (supabase ? [] : readLocalRecords(loansStorageKey)));
  const [loanPayments, setLoanPayments] = useState(() => (supabase ? [] : readLocalRecords(loanPaymentsStorageKey)));
  const [activePage, setActivePage] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(localDate(today).slice(0, 7));
  const [homeTrendMetric, setHomeTrendMetric] = useState('expenses');
  const [merchant, setMerchant] = useState(merchants[0]);
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState(localDate(today));
  const [amount, setAmount] = useState('');
  const [expenseMemberId, setExpenseMemberId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [authMode, setAuthMode] = useState('sign-in');
  const [authMethod, setAuthMethod] = useState('email-otp');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCodeSent, setAuthCodeSent] = useState(false);
  const [authRecovery, setAuthRecovery] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [saving, setSaving] = useState(false);
  const [financeSaving, setFinanceSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [localImportEntries] = useState(readEntries);
  const [localImportDismissed, setLocalImportDismissed] = useState(false);
  const [householdId, setHouseholdId] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [householdRole, setHouseholdRole] = useState('');
  const [householdReady, setHouseholdReady] = useState(!supabase);
  const [householdError, setHouseholdError] = useState('');
  const [householdActionError, setHouseholdActionError] = useState('');
  const [householdActionBusy, setHouseholdActionBusy] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const needsMerchantName = namedMerchants.has(merchant);

  useEffect(() => {
    setExpenseMemberId(session?.user.id ?? '');
  }, [session]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setAuthError(sessionError.message);
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setAuthRecovery(true);
      setSession(nextSession);
      setAuthError('');
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    if (!session) {
      setHouseholdId('');
      setHouseholdName('');
      setHouseholdRole('');
      setHouseholdReady(true);
      return undefined;
    }

    let active = true;
    setHouseholdReady(false);
    setHouseholdError('');
    readHouseholdMembership(session.user.id).then(({ data, error: membershipError }) => {
      if (!active) return;
      if (membershipError) {
        setHouseholdError(`Could not load household setup. Run supabase/schema.sql in the Supabase SQL Editor. ${membershipError.message}`);
        setHouseholdId('');
        setHouseholdName('');
        setHouseholdRole('');
      } else {
        const relation = data?.households;
        const household = Array.isArray(relation) ? relation[0] : relation;
        setHouseholdId(data?.household_id ?? '');
        setHouseholdName(household?.name ?? '');
        setHouseholdRole(data?.role ?? '');
      }
      setHouseholdReady(true);
    });
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      setEntries(readEntries());
      setFinanceRecords(readLocalRecords(financeStorageKey));
      setLoans(readLocalRecords(loansStorageKey));
      setLoanPayments(readLocalRecords(loanPaymentsStorageKey));
      return undefined;
    }
    if (!session || !householdId) {
      setEntries([]);
      setFinanceRecords([]);
      setLoans([]);
      setLoanPayments([]);
      setDataLoading(false);
      return undefined;
    }

    let active = true;
    setDataLoading(true);
    setDataError('');
    supabase.from('expenses')
      .select('id, household_id, member_id, created_by, merchant, merchant_name, expense_date, amount, created_at')
      .eq('household_id', householdId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setEntries([]);
          setDataError(`Could not load expenses. Run supabase/schema.sql in the Supabase SQL Editor. ${queryError.message}`);
        } else {
          setEntries(data.map(fromDatabaseRow));
        }
        setDataLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, householdId]);

  useEffect(() => {
    if (!supabase || !session || !householdId) {
      return undefined;
    }
    let active = true;
    Promise.all([
      supabase.from('household_finances')
        .select('id, household_id, member_id, created_by, kind, category, description, record_date, amount, created_at')
        .eq('household_id', householdId)
        .order('record_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('household_loans')
        .select('id, household_id, member_id, created_by, name, lender, principal, emi_amount, due_day, start_date, active')
        .eq('household_id', householdId)
        .eq('active', true)
        .order('created_at', { ascending: false }),
      supabase.from('household_loan_payments')
        .select('id, household_id, loan_id, member_id, created_by, period_month, payment_date, amount, created_at')
        .eq('household_id', householdId)
        .order('period_month', { ascending: false }),
    ]).then(([financeResult, loanResult, paymentResult]) => {
        if (!active) return;
        const queryError = financeResult.error || loanResult.error || paymentResult.error;
        if (queryError) {
          setFinanceRecords([]);
          setLoans([]);
          setLoanPayments([]);
          setDataError(`Could not load earnings, savings, and loans. Run the updated supabase/schema.sql in the Supabase SQL Editor. ${queryError.message}`);
        } else {
          setFinanceRecords(financeResult.data.map(fromFinanceRow));
          setLoans(loanResult.data.map(fromLoanRow));
          setLoanPayments(paymentResult.data.map(fromLoanPaymentRow));
        }
      });
    return () => {
      active = false;
    };
  }, [session, householdId]);

  useEffect(() => {
    if (!supabase || !session || !householdId) {
      setMembers([]);
      return undefined;
    }
    let active = true;
    supabase.from('household_members')
      .select('user_id, email, role')
      .eq('household_id', householdId)
      .order('joined_at', { ascending: true })
      .then(({ data, error: membersError }) => {
        if (!active) return;
        if (membersError) setDataError(membersError.message);
        else setMembers(data);
      });
    return () => {
      active = false;
    };
  }, [session, householdId]);

  useEffect(() => {
    if (!session || !householdId) return;
    const importFlag = `${storageKey}-imported-${householdId}`;
    setLocalImportDismissed(localStorage.getItem(importFlag) === 'true');
  }, [session, householdId]);

  const loanFinanceRecords = loanPayments.map((payment) => {
    const loan = loans.find((candidate) => candidate.id === payment.loanId);
    return {
      id: `loan-payment-${payment.id}`,
      kind: 'loan_repayment',
      category: 'Loan EMI',
      description: `${loan?.name ?? 'Loan'} EMI`,
      date: payment.paymentDate,
      amount: payment.amount,
      memberId: payment.memberId,
      createdBy: payment.createdBy,
    };
  });
  const allFinanceRecords = [...financeRecords, ...loanFinanceRecords];

  const sortedEntries = useMemo(
    () => [...entries].sort((first, second) => second.date.localeCompare(first.date) || second.createdAt - first.createdAt),
    [entries],
  );
  const thisMonthEntries = useMemo(
    () => entries.filter((entry) => entry.date.slice(0, 7) === selectedMonth),
    [entries, selectedMonth],
  );
  const monthlyTrend = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(selectedYear, selectedMonthNumber - 6 + index, 1);
    const monthKey = localDate(monthDate).slice(0, 7);
    const monthFinance = allFinanceRecords.filter((record) => record.date.slice(0, 7) === monthKey);
    return {
      key: monthKey,
      label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(monthDate),
      total: entries
        .filter((entry) => entry.date.slice(0, 7) === monthKey)
        .reduce((sum, entry) => sum + entry.amount, 0),
      earnings: monthFinance.filter((record) => record.kind === 'earning').reduce((sum, record) => sum + record.amount, 0),
      savings: monthFinance.filter((record) => record.kind !== 'earning').reduce((sum, record) => sum + record.amount, 0),
    };
  }), [entries, allFinanceRecords, selectedMonth]);
  const merchantBreakdown = useMemo(() => {
    const totals = thisMonthEntries.reduce((result, entry) => {
      result.set(entry.merchant, (result.get(entry.merchant) ?? 0) + entry.amount);
      return result;
    }, new Map());
    return [...totals].map(([name, total]) => ({ name, total }))
      .sort((first, second) => second.total - first.total);
  }, [thisMonthEntries]);
  const memberBreakdown = useMemo(() => members.map((member) => {
    const memberEntries = thisMonthEntries.filter((entry) => entry.memberId === member.user_id);
    return {
      ...member,
      total: memberEntries.reduce((sum, entry) => sum + entry.amount, 0),
      count: memberEntries.length,
    };
  }).sort((first, second) => second.total - first.total), [members, thisMonthEntries]);
  const monthTotal = thisMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const allTimeTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const average = thisMonthEntries.length ? monthTotal / thisMonthEntries.length : 0;
  const selectedMonthDate = new Date(`${selectedMonth}-01T00:00:00`);
  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(selectedMonthDate);
  const isCurrentMonth = selectedMonth === localDate(today).slice(0, 7);
  const thisMonthFinanceRecords = allFinanceRecords.filter((record) => record.date.slice(0, 7) === selectedMonth);
  const monthEarnings = thisMonthFinanceRecords.filter((record) => record.kind === 'earning').reduce((sum, record) => sum + record.amount, 0);
  const monthInvestments = thisMonthFinanceRecords.filter((record) => record.kind === 'investment').reduce((sum, record) => sum + record.amount, 0);
  const monthLoanRepayments = thisMonthFinanceRecords.filter((record) => record.kind === 'loan_repayment').reduce((sum, record) => sum + record.amount, 0);
  const monthActiveLoans = loans.filter((loan) => loan.active && loan.startDate.slice(0, 7) <= selectedMonth);
  const monthScheduledEmis = monthActiveLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const monthPaidLoanIds = new Set(loanPayments.filter((payment) => payment.periodMonth === selectedMonth).map((payment) => payment.loanId));
  const monthPaidEmiCount = monthActiveLoans.filter((loan) => monthPaidLoanIds.has(loan.id)).length;
  const dailyTotal = thisMonthEntries
    .filter((entry) => entry.date === localDate(today))
    .reduce((sum, entry) => sum + entry.amount, 0);
  const previousMonthTotal = monthlyTrend[monthlyTrend.length - 2]?.total ?? 0;
  const monthChange = previousMonthTotal ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100 : null;
  const maxMonthlyTotal = Math.max(...monthlyTrend.map((month) => month.total), 1);
  const homeTrendTotal = (month) => month[homeTrendMetric === 'expenses' ? 'total' : homeTrendMetric];
  const maxHomeTrendTotal = Math.max(...monthlyTrend.map(homeTrendTotal), 1);
  const maxMemberTotal = Math.max(...memberBreakdown.map((member) => member.total), 1);
  const topMerchant = merchantBreakdown[0];

  function saveEntries(nextEntries) {
    setEntries(nextEntries);
    if (!supabase || !session) localStorage.setItem(storageKey, JSON.stringify(nextEntries));
  }

  function saveFinanceRecords(nextRecords) {
    setFinanceRecords(nextRecords);
    if (!supabase || !session) localStorage.setItem(financeStorageKey, JSON.stringify(nextRecords));
  }

  function saveLoans(nextLoans) {
    setLoans(nextLoans);
    if (!supabase || !session) localStorage.setItem(loansStorageKey, JSON.stringify(nextLoans));
  }

  function saveLoanPayments(nextPayments) {
    setLoanPayments(nextPayments);
    if (!supabase || !session) localStorage.setItem(loanPaymentsStorageKey, JSON.stringify(nextPayments));
  }

  async function createLoan(loan) {
    setFinanceSaving(true);
    setDataError('');
    const row = {
      household_id: householdId,
      member_id: loan.memberId ?? session?.user.id,
      created_by: session?.user.id,
      name: loan.name,
      lender: loan.lender,
      principal: loan.principal,
      emi_amount: loan.emiAmount,
      due_day: loan.dueDay,
      start_date: loan.startDate,
    };
    if (supabase && session) {
      const { data, error: insertError } = await supabase
        .from('household_loans')
        .insert(row)
        .select('id, household_id, member_id, created_by, name, lender, principal, emi_amount, due_day, start_date, active')
        .single();
      if (insertError) {
        setDataError(`Could not add loan. Run the updated supabase/schema.sql in the Supabase SQL Editor. ${insertError.message}`);
        setFinanceSaving(false);
        return false;
      }
      setLoans((currentLoans) => [fromLoanRow(data), ...currentLoans]);
    } else {
      saveLoans([{
        ...loan,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        householdId: '',
        memberId: row.member_id,
        createdBy: row.created_by,
        active: true,
      }, ...loans]);
    }
    setFinanceSaving(false);
    return true;
  }

  async function recordLoanPayment(payment) {
    setFinanceSaving(true);
    setDataError('');
    const row = {
      household_id: payment.householdId || householdId,
      loan_id: payment.loanId,
      member_id: payment.memberId,
      created_by: session?.user.id,
      period_month: payment.periodMonth,
      payment_date: payment.paymentDate,
      amount: payment.amount,
    };
    if (supabase && session) {
      const { data, error: insertError } = await supabase
        .from('household_loan_payments')
        .insert(row)
        .select('id, household_id, loan_id, member_id, created_by, period_month, payment_date, amount, created_at')
        .single();
      if (insertError) {
        setDataError(`Could not record EMI payment. It may already be recorded for this month. ${insertError.message}`);
        setFinanceSaving(false);
        return false;
      }
      setLoanPayments((currentPayments) => [fromLoanPaymentRow(data), ...currentPayments]);
    } else {
      const localPayment = {
        ...payment,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        householdId: '',
        createdBy: session?.user.id,
        periodMonth: payment.periodMonth.slice(0, 7),
        createdAt: Date.now(),
      };
      saveLoanPayments([localPayment, ...loanPayments]);
    }
    setFinanceSaving(false);
    return true;
  }

  function changeSelectedMonth(month) {
    if (!month) return;
    setSelectedMonth(month);
    setDate(`${month}-01`);
  }

  async function addFinanceRecord(record) {
    setFinanceSaving(true);
    setDataError('');
    const row = {
      household_id: householdId,
      member_id: record.memberId ?? session?.user.id,
      created_by: session?.user.id,
      kind: record.kind,
      category: record.category,
      description: record.description,
      record_date: record.date,
      amount: record.amount,
    };
    if (supabase && session) {
      const { data, error: insertError } = await supabase
        .from('household_finances')
        .insert(row)
        .select('id, household_id, member_id, created_by, kind, category, description, record_date, amount, created_at')
        .single();
      if (insertError) {
        setDataError(`Could not save this record. Run the updated supabase/schema.sql in the Supabase SQL Editor. ${insertError.message}`);
        setFinanceSaving(false);
        return false;
      }
      setFinanceRecords((currentRecords) => [fromFinanceRow(data), ...currentRecords]);
    } else {
      const localRecord = {
        ...record,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        memberId: row.member_id,
        createdBy: row.created_by,
        createdAt: Date.now(),
      };
      saveFinanceRecords([localRecord, ...financeRecords]);
    }
    setFinanceSaving(false);
    return true;
  }

  async function refreshHousehold() {
    if (!session) return;
    setHouseholdReady(false);
    const { data, error: membershipError } = await readHouseholdMembership(session.user.id);
    if (membershipError) {
      setHouseholdError(membershipError.message);
      setHouseholdId('');
      setHouseholdName('');
      setHouseholdRole('');
    } else {
      const relation = data?.households;
      const household = Array.isArray(relation) ? relation[0] : relation;
      setHouseholdError('');
      setHouseholdId(data?.household_id ?? '');
      setHouseholdName(household?.name ?? '');
      setHouseholdRole(data?.role ?? '');
    }
    setHouseholdReady(true);
  }

  async function createHousehold(event, name) {
    event.preventDefault();
    setHouseholdActionBusy(true);
    setHouseholdActionError('');
    const { error: createError } = await supabase.rpc('create_household', { p_name: name.trim() });
    if (createError) {
      setHouseholdActionError(createError.message);
    } else {
      await refreshHousehold();
    }
    setHouseholdActionBusy(false);
  }

  async function acceptHouseholdInvite(event, code) {
    event.preventDefault();
    setHouseholdActionBusy(true);
    setHouseholdActionError('');
    const { error: acceptError } = await supabase.rpc('accept_household_invite', { p_invite_code: code.trim() });
    if (acceptError) {
      setHouseholdActionError(acceptError.message);
    } else {
      await refreshHousehold();
    }
    setHouseholdActionBusy(false);
  }

  async function createHouseholdInvite(event) {
    event.preventDefault();
    setHouseholdActionBusy(true);
    setHouseholdActionError('');
    setInviteCode('');
    setInviteStatus('');
    const { data, error: inviteError } = await supabase.rpc('create_household_invite', {
      p_household_id: householdId,
      p_invited_email: inviteEmail.trim(),
    });
    if (inviteError) {
      setHouseholdActionError(inviteError.message);
    } else {
      setInviteCode(data);
      setInviteEmail('');
    }
    setHouseholdActionBusy(false);
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(inviteCode);
    setInviteStatus('Copied');
  }

  function changeAuthMode(mode, options = {}) {
    setAuthMode(mode);
    if (options.restart) setAuthCodeSent(false);
    setAuthCode('');
    setAuthPassword('');
    setAuthError('');
    setAuthMessage('');
  }

  async function requestAuthCode(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthBusy(true);
    const normalizedPhone = authPhone.trim().replace(/[\s()-]/g, '');
    if (authMethod === 'phone' && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setAuthError('Enter a valid phone number in international format, such as +919876543210.');
      setAuthBusy(false);
      return;
    }
    const isEmail = authMethod === 'email-otp';
    const result = isEmail
      ? await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: { shouldCreateUser: authMode === 'sign-up' },
      })
      : await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: authMode === 'sign-up' },
      });
    if (result.error) {
      setAuthError(result.error.message);
    } else {
      setAuthCodeSent(true);
      setAuthCode('');
      setAuthMessage(`Check your ${isEmail ? 'inbox' : 'phone'} and enter the 6-digit code.`);
    }
    setAuthBusy(false);
  }

  async function verifyAuthCode(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthBusy(true);
    const normalizedPhone = authPhone.trim().replace(/[\s()-]/g, '');
    const isEmail = authMethod === 'email-otp';
    const { error: verifyError } = await supabase.auth.verifyOtp({
      [isEmail ? 'email' : 'phone']: isEmail ? authEmail.trim() : normalizedPhone,
      token: authCode.trim(),
      type: isEmail ? 'email' : 'sms',
    });
    if (verifyError) {
      setAuthError(verifyError.message);
    }
    setAuthBusy(false);
  }

  async function authenticateWithPassword(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthBusy(true);
    const result = authMode === 'sign-up'
      ? await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (result.error) {
      setAuthError(result.error.message);
    } else if (authMode === 'sign-up' && !result.data.session) {
      setAuthMessage('Account created. Check your email to confirm your account, then sign in with your password.');
      setAuthMode('sign-in');
      setAuthPassword('');
    }
    setAuthBusy(false);
  }

  async function sendPasswordReset() {
    if (!authEmail.trim()) {
      setAuthError('Enter your account email first.');
      return;
    }
    setAuthError('');
    setAuthMessage('');
    setAuthBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
      redirectTo: window.location.origin,
    });
    if (resetError) setAuthError(resetError.message);
    else setAuthMessage('If an account exists for this email, a password reset link has been sent.');
    setAuthBusy(false);
  }

  async function updateRecoveredPassword(event) {
    event.preventDefault();
    if (authPassword.length < 8) {
      setAuthError('Use a password with at least 8 characters.');
      return;
    }
    setAuthError('');
    setAuthMessage('');
    setAuthBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: authPassword });
    if (updateError) setAuthError(updateError.message);
    else {
      setAuthRecovery(false);
      setAuthPassword('');
      setAuthMessage('Password updated. You are signed in.');
    }
    setAuthBusy(false);
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setAuthError(signOutError.message);
  }

  async function importLocalExpenses() {
    if (!session || !householdId || !localImportEntries.length) return;
    setImporting(true);
    setDataError('');
    const rows = localImportEntries.map((entry) => ({
      user_id: session.user.id,
      member_id: session.user.id,
      household_id: householdId,
      created_by: session.user.id,
      merchant: entry.merchant,
      merchant_name: entry.merchantName || null,
      expense_date: entry.date,
      amount: entry.amount,
    }));
    const { data, error: importError } = await supabase
      .from('expenses')
      .insert(rows)
      .select('id, household_id, member_id, created_by, merchant, merchant_name, expense_date, amount, created_at');
    if (importError) {
      setDataError(importError.message);
    } else {
      setEntries(data.map(fromDatabaseRow));
      localStorage.setItem(`${storageKey}-imported-${householdId}`, 'true');
      setLocalImportDismissed(true);
    }
    setImporting(false);
  }

  async function addExpense(event) {
    event.preventDefault();
    if (needsMerchantName && !merchantName.trim()) {
      setError('Enter a name for this expense.');
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    setDataError('');
    if (editingId && supabase && session) {
      const { data, error: updateError } = await supabase
        .from('expenses')
        .update({ user_id: expenseMemberId, member_id: expenseMemberId, merchant, merchant_name: needsMerchantName ? merchantName.trim() : null, expense_date: date, amount: parsedAmount })
        .eq('id', editingId)
        .select('id, household_id, member_id, created_by, merchant, merchant_name, expense_date, amount, created_at')
        .single();
      if (updateError) {
        setDataError(updateError.message);
        setSaving(false);
        return;
      }
      const updatedEntry = fromDatabaseRow(data);
      setEntries((currentEntries) => currentEntries.map((entry) => entry.id === editingId ? updatedEntry : entry));
    } else if (editingId) {
      saveEntries(entries.map((entry) => entry.id === editingId
        ? { ...entry, merchant, merchantName: needsMerchantName ? merchantName.trim() : '', date, amount: parsedAmount }
        : entry));
    } else if (supabase && session) {
      const { data, error: insertError } = await supabase
        .from('expenses')
        .insert({ user_id: expenseMemberId, member_id: expenseMemberId, household_id: householdId, created_by: session.user.id, merchant, merchant_name: needsMerchantName ? merchantName.trim() : null, expense_date: date, amount: parsedAmount })
        .select('id, household_id, member_id, created_by, merchant, merchant_name, expense_date, amount, created_at')
        .single();
      if (insertError) {
        setDataError(insertError.message);
        setSaving(false);
        return;
      }
      setEntries((currentEntries) => [fromDatabaseRow(data), ...currentEntries]);
    } else {
    const newEntry = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      memberId: expenseMemberId,
      createdBy: session?.user.id,
      merchant,
      merchantName: needsMerchantName ? merchantName.trim() : '',
      date,
      amount: parsedAmount,
      createdAt: Date.now(),
    };
    saveEntries([newEntry, ...entries]);
    }
    setAmount('');
    setMerchantName('');
    setError('');
    setEditingId('');
    setSaving(false);
  }

  function startEditing(entry) {
    setEditingId(entry.id);
    setMerchant(entry.merchant);
    setMerchantName(entry.merchantName ?? '');
    setDate(entry.date);
    setAmount(String(entry.amount));
    setExpenseMemberId(entry.memberId ?? session?.user.id ?? '');
    setError('');
    document.querySelector('.entry-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function cancelEditing() {
    setEditingId('');
    setAmount('');
    setMerchantName('');
    setError('');
  }

  async function deleteExpense(id) {
    if (supabase && session) {
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
      if (deleteError) {
        setDataError(deleteError.message);
        return;
      }
      setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== id));
    } else {
      saveEntries(entries.filter((entry) => entry.id !== id));
    }
    if (editingId === id) cancelEditing();
  }

  if (supabase && !authReady) {
    return <main className="auth-screen"><p className="auth-loading">Connecting to your account...</p></main>;
  }

  if (supabase && authRecovery) {
    return <AuthScreen recovery mode={authMode} setMode={changeAuthMode} method={authMethod} setMethod={setAuthMethod} email={authEmail} setEmail={setAuthEmail} phone={authPhone} setPhone={setAuthPhone} code={authCode} setCode={setAuthCode} password={authPassword} setPassword={setAuthPassword} codeSent={false} busy={authBusy} error={authError} message={authMessage} onPasswordUpdate={updateRecoveredPassword} />;
  }

  if (supabase && !session) {
    return <AuthScreen mode={authMode} setMode={changeAuthMode} method={authMethod} setMethod={setAuthMethod} email={authEmail} setEmail={setAuthEmail} phone={authPhone} setPhone={setAuthPhone} code={authCode} setCode={setAuthCode} password={authPassword} setPassword={setAuthPassword} codeSent={authCodeSent} recovery={false} busy={authBusy} error={authError} message={authMessage} onRequestCode={requestAuthCode} onVerifyCode={verifyAuthCode} onPasswordAuth={authenticateWithPassword} onPasswordReset={sendPasswordReset} />;
  }

  if (supabase && session && !householdReady) {
    return <main className="auth-screen"><p className="auth-loading">Loading your household...</p></main>;
  }

  if (supabase && session && !householdId) {
    return <HouseholdSetup email={session.user.email ?? session.user.phone} error={householdActionError || householdError} busy={householdActionBusy} onCreate={createHousehold} onJoin={acceptHouseholdInvite} accountMethods={<AccountMethods user={session.user} supabase={supabase} />} />;
  }

  return (
    <div className="app-shell">
      <aside className="history-rail">
        <a className="brand" href="#overview" aria-label="PocketTracker home">
          <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">Pocket<span>Tracker</span></span>
        </a>

        <div className="rail-heading">
          <div>
            <p className="eyebrow">YOUR LEDGER</p>
          </div>
          <span className="entry-count">{entries.length}</span>
        </div>

        <div className="history-list">
          {sortedEntries.length ? sortedEntries.map((entry, index) => (
            <article className="history-item" key={entry.id} style={{ '--item-index': Math.min(index, 8) }}>
              <span className={`merchant-icon ${merchantColor(entry.merchant)}`}>
                <ShoppingBag size={15} />
              </span>
              <div className="history-copy">
                <span className="history-merchant">{entry.merchant}</span>
                <span className="history-date" title={members.find((member) => member.user_id === entry.createdBy)?.email || ''}>
                  {formatDate(entry.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {session ? (members.find((member) => member.user_id === entry.createdBy)?.email || (entry.createdBy === session.user.id ? 'You' : 'Household member')) : 'Saved locally'}
                </span>
              </div>
              <div className="history-value">
                <span>{formatCurrency(entry.amount)}</span>
                <button className="icon-button edit-button" type="button" onClick={() => startEditing(entry)} aria-label={`Edit ${entry.merchant} expense`} title="Edit expense">
                  <Pencil size={13} />
                </button>
                <button className="icon-button delete-button" type="button" onClick={() => deleteExpense(entry.id)} aria-label={`Delete ${entry.merchant} expense`} title="Delete expense">
                  <Trash2 size={13} />
                </button>
              </div>
            </article>
          )) : (
            <div className="empty-history">
              <span className="empty-icon"><ReceiptText size={20} /></span>
              <p>No expenses yet</p>
              <span>Your entries will show up here.</span>
            </div>
          )}
        </div>

        <div className="rail-footer">
          <span className="sync-dot" />
          <span>{session ? 'Synced to your account' : 'Saved on this device'}</span>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>{householdName || 'Personal'}</span><span className="crumb-divider">/</span><strong>{pageTitles[activePage]}</strong></div>
          <div className="topbar-tools">
            <label className="topbar-month"><CalendarDays size={15} /><input aria-label="Choose month" type="month" value={selectedMonth} onChange={(event) => changeSelectedMonth(event.target.value)} /></label>
            {session && <button className="signout-button" type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={15} /></button>}
          </div>
        </header>

        <nav className="module-nav" aria-label="Money modules">
          {[
            ['overview', 'Home'],
            ['earnings', 'Earnings'],
            ['expenses', 'Expenses'],
            ['savings', 'Savings'],
            ['loans', 'Loans & EMIs'],
            ['history', 'History'],
            ['household', 'Household'],
          ].map(([page, label]) => (
            <button type="button" key={page} className={activePage === page ? 'active' : ''} aria-current={activePage === page ? 'page' : undefined} onClick={() => { setActivePage(page); setEditingId(''); }}>
              {label}
            </button>
          ))}
        </nav>

        {activePage === 'household' && !session && (
          <section className="household-panel household-connect-panel" aria-label="Connect a household">
            <div className="household-panel-heading">
              <span className="household-icon"><House size={17} /></span>
              <div className="household-name-block"><p className="eyebrow">HOUSEHOLD SHARING</p><h2>Connect your household</h2></div>
            </div>
            <p>Household membership, invitations, and entering records for another member require Supabase sign-in and a configured cloud project. This browser is currently in local-only mode; data saved here stays on this device.</p>
            <a href="https://supabase.com/docs/guides/getting-started/quickstarts/reactjs" target="_blank" rel="noreferrer">Supabase React setup guide</a>
          </section>
        )}

        {activePage === 'household' && session && householdId && (
          <section className="household-panel" aria-label="Household members and invitations">
            <div className="household-panel-heading">
              <span className="household-icon"><House size={17} /></span>
              <div className="household-name-block"><p className="eyebrow">SHARED HOUSEHOLD</p><h2>{householdName}</h2></div>
              <span className={`household-role ${householdRole}`}>{householdRole}</span>
              <span className="household-member-count"><UsersRound size={14} /> {members.length} {members.length === 1 ? 'member' : 'members'}</span>
            </div>
            <div className="household-member-list">
              {members.map((member) => (
                <span className="household-member-chip" key={member.user_id}>
                  <span className="member-initial">{member.email?.slice(0, 1).toUpperCase() || 'H'}</span>
                  <span>{member.email || 'Household member'}</span>
                  {member.role === 'admin' && <strong>ADMIN</strong>}
                </span>
              ))}
            </div>
            {householdRole === 'admin' && (
              <form className="household-invite-form" onSubmit={createHouseholdInvite}>
                <label><span>INVITE A MEMBER</span><input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" required /></label>
                <button type="submit" disabled={householdActionBusy}><MailPlus size={15} />{householdActionBusy ? 'Creating...' : 'Create invite'}</button>
              </form>
            )}
            {inviteCode && (
              <div className="invite-code-panel">
                <span>Share this one-time code with <strong>{inviteEmail}</strong>. They must sign in using that email.</span>
                <code>{inviteCode}</code>
                <button type="button" onClick={copyInviteCode}><Copy size={14} />{inviteStatus || 'Copy code'}</button>
                <small>Expires in 7 days.</small>
              </div>
            )}
            {householdActionError && <p className="household-inline-error" role="alert">{householdActionError}</p>}
          </section>
        )}
        {activePage === 'household' && session && <AccountMethods user={session.user} supabase={supabase} />}

        {dataError && <div className="cloud-notice cloud-error" role="alert">{dataError}</div>}
        {dataLoading && <div className="cloud-notice" role="status">Loading your saved records...</div>}
        {activePage === 'overview' && session && !dataLoading && !dataError && entries.length === 0 && localImportEntries.length > 0 && !localImportDismissed && (
          <div className="cloud-notice import-notice">
            <span>{localImportEntries.length} expense{localImportEntries.length === 1 ? '' : 's'} saved in this browser. Import them to your account?</span>
            <button type="button" onClick={importLocalExpenses} disabled={importing}>{importing ? 'Importing...' : 'Import expenses'}</button>
          </div>
        )}

        {activePage === 'overview' && (
          <>
            <section className="page-intro">
              <div><p className="eyebrow">MONTHLY HOUSEHOLD PICTURE</p><h1>{householdName || 'PocketTracker'}<span className="title-period">.</span></h1><p className="intro-copy">{monthLabel} · Earnings, expenses, and savings activity.</p></div>
              <div className="intro-mark" aria-hidden="true"><IndianRupee size={33} strokeWidth={1.4} /></div>
            </section>
            <section className="overview-grid finance-overview-grid" aria-label="Monthly household summary">
              <button className="module-summary-card earnings-summary" type="button" onClick={() => setActivePage('earnings')}>
                <span className="metric-label">EARNINGS</span><ArrowDownRight size={18} /><strong>{formatCurrency(monthEarnings)}</strong><span>{monthLabel} · View earnings</span>
              </button>
              <button className="module-summary-card expenses-summary" type="button" onClick={() => setActivePage('expenses')}>
                <span className="metric-label">EXPENSES</span><ShoppingBag size={18} /><strong>{formatCurrency(monthTotal)}</strong><span>{monthLabel} · View expenses</span>
              </button>
              <button className="module-summary-card savings-summary" type="button" onClick={() => setActivePage('savings')}>
                <span className="metric-label">SAVINGS</span><PiggyBank size={18} /><strong>{formatCurrency(monthInvestments)}</strong><span>{monthLabel} · Investments recorded</span>
              </button>
              <button className="module-summary-card loans-summary" type="button" onClick={() => setActivePage('loans')}>
                <span className="metric-label">LOANS &amp; EMIs</span><CreditCard size={18} /><strong>{formatCurrency(monthScheduledEmis)}</strong><span>{monthActiveLoans.length ? `Monthly EMIs · ${monthPaidEmiCount} of ${monthActiveLoans.length} paid · View loans` : 'No loans tracked · View loans'}</span>
              </button>
            </section>
            <div className={`cash-flow-strip ${monthEarnings - monthTotal - monthInvestments - monthLoanRepayments < 0 ? 'cash-flow-negative' : ''}`}>
              <span>Remaining after recorded activity</span>
              <strong>{formatCurrency(monthEarnings - monthTotal - monthInvestments - monthLoanRepayments)}</strong>
              <small>Earnings − expenses − investments − loan repayments</small>
            </div>
            <section className="insights-section overview-insights" aria-labelledby="overview-insights-heading">
              <div className="insights-title-row">
                <div><p className="eyebrow">MONTHLY HISTORY</p><h2 id="overview-insights-heading">{homeTrendMetric === 'expenses' ? 'Expense trend' : homeTrendMetric === 'earnings' ? 'Earnings trend' : 'Savings activity trend'}</h2></div>
                <div className="home-trend-controls" aria-label="Monthly chart module">
                  {['earnings', 'expenses', 'savings'].map((metric) => <button type="button" key={metric} className={homeTrendMetric === metric ? 'active' : ''} onClick={() => setHomeTrendMetric(metric)}>{metric === 'savings' ? 'Savings activity' : metric[0].toUpperCase() + metric.slice(1)}</button>)}
                </div>
              </div>
              <div className="trend-chart overview-month-chart" aria-label={`Monthly ${homeTrendMetric} trend`}>
                {monthlyTrend.map((month) => (
                  <button type="button" className={`trend-column month-chart-button ${month.key === selectedMonth ? 'current-month' : ''}`} key={month.key} onClick={() => { changeSelectedMonth(month.key); setActivePage(homeTrendMetric); }} aria-label={`${month.label}: ${formatCurrency(homeTrendTotal(month))}. Open ${homeTrendMetric}`}>
                    <span className="trend-value">{homeTrendTotal(month) ? formatCurrency(homeTrendTotal(month)) : ''}</span>
                    <span className="trend-bar-track" title={`${month.label}: ${formatCurrency(homeTrendTotal(month))}`}><span className="trend-bar-fill" style={{ height: `${homeTrendTotal(month) ? Math.max((homeTrendTotal(month) / maxHomeTrendTotal) * 100, 5) : 0}%` }} /></span>
                    <span className="trend-month-label">{month.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {activePage === 'earnings' && <FinanceModule module="earnings" month={selectedMonth} records={allFinanceRecords} members={members} session={session} householdId={householdId} householdRole={householdRole} saving={financeSaving} onSave={addFinanceRecord} formatCurrency={formatCurrency} formatDate={formatDate} />}
        {activePage === 'savings' && <FinanceModule module="savings" month={selectedMonth} records={allFinanceRecords} members={members} session={session} householdId={householdId} householdRole={householdRole} saving={financeSaving} onSave={addFinanceRecord} formatCurrency={formatCurrency} formatDate={formatDate} onNavigateLoans={() => setActivePage('loans')} />}
        {activePage === 'loans' && <LoanTracker loans={loans} payments={loanPayments} members={members} session={session} householdRole={householdRole} month={selectedMonth} saving={financeSaving} onCreateLoan={createLoan} onRecordPayment={recordLoanPayment} formatCurrency={formatCurrency} formatDate={formatDate} />}
        {activePage === 'history' && <HistoryModule expenses={entries} records={allFinanceRecords} members={members} month={selectedMonth} formatCurrency={formatCurrency} formatDate={formatDate} onMonthChange={changeSelectedMonth} />}

        {activePage === 'expenses' && <>
        <section className="page-intro">
          <div>
            <p className="eyebrow">EXPENSE MODULE</p>
            <h1>Expenses<span className="title-period">.</span></h1>
            <p className="intro-copy">{monthLabel} · Add, review, and keep your expense history.</p>
          </div>
          <div className="intro-mark" aria-hidden="true"><IndianRupee size={33} strokeWidth={1.4} /></div>
        </section>

        <section className="overview-grid" aria-label="Expense summary">
          <article className="total-card">
            <div className="metric-topline">
              <span className="metric-label">{session ? 'HOUSEHOLD SPENT' : 'TOTAL SPENT'}</span>
              <span className="metric-icon"><Wallet size={17} /></span>
            </div>
            <p className="total-value">{formatCurrency(monthTotal)}</p>
            <div className="metric-caption"><span className="live-dot" /> {monthLabel}</div>
            <div className="total-decoration" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
          </article>

          <article className="stat-card">
            <div className="stat-heading"><span className="stat-icon mint-icon"><ArrowDownRight size={17} /></span><span className="metric-label">{isCurrentMonth ? 'TODAY' : 'MONTH TOTAL'}</span></div>
            <p className="stat-value">{formatCurrency(isCurrentMonth ? dailyTotal : monthTotal)}</p>
            <span className="stat-note">{isCurrentMonth ? (dailyTotal ? 'Spent today' : 'Nothing logged today') : monthLabel}</span>
          </article>

          <article className="stat-card">
            <div className="stat-heading"><span className="stat-icon coral-icon"><ReceiptText size={16} /></span><span className="metric-label">ENTRIES</span></div>
            <p className="stat-value">{thisMonthEntries.length.toString().padStart(2, '0')}</p>
            <span className="stat-note">Average {formatCurrency(average)}</span>
          </article>
        </section>

        <section className="insights-section" aria-labelledby="insights-heading">
          <div className="insights-title-row">
            <div>
              <p className="eyebrow">THE BIG PICTURE</p>
              <h2 id="insights-heading">Spending insights</h2>
            </div>
            <span className="insights-period"><CalendarDays size={14} /> Last 6 months</span>
          </div>

          <div className="insights-grid">
            <article className="insight-panel trend-panel">
              <div className="insight-panel-heading">
                <span className="insight-icon chart-icon"><BarChart3 size={17} /></span>
                <div><h3>Monthly trend</h3><span>{session ? 'Compare household spending over time' : 'Compare your spending over time'}</span></div>
              </div>
              <div className="trend-summary">
                <strong>{formatCurrency(monthTotal)}</strong>
                {monthChange === null ? (
                  <span className="trend-comparison neutral-change">No previous-month data yet</span>
                ) : (
                  <span className={`trend-comparison ${monthChange > 0 ? 'higher-spend' : 'lower-spend'}`}>
                    {monthChange > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {Math.abs(monthChange).toFixed(0)}% {monthChange > 0 ? 'more' : 'less'} than last month
                  </span>
                )}
              </div>
              <div className="trend-chart" aria-label={`Monthly spending for the six months through ${monthLabel}.`}>
                {monthlyTrend.map((month) => (
                  <button type="button" className={`trend-column month-chart-button ${month.key === selectedMonth ? 'current-month' : ''}`} key={month.key} onClick={() => setSelectedMonth(month.key)} aria-label={`${month.label}: ${formatCurrency(month.total)}. Filter expenses to this month`}>
                    <span className="trend-value">{month.total ? formatCurrency(month.total) : ''}</span>
                    <span className="trend-bar-track" title={`${month.label}: ${formatCurrency(month.total)}`}>
                      <span className="trend-bar-fill" style={{ height: `${month.total ? Math.max((month.total / maxMonthlyTotal) * 100, 5) : 0}%` }} />
                    </span>
                    <span className="trend-month-label">{month.label}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="insight-panel merchant-panel">
              <div className="insight-panel-heading">
                <span className="insight-icon spend-icon"><ShoppingBag size={16} /></span>
                <div><h3>Where it goes</h3><span>Spending by expense type</span></div>
              </div>
              {topMerchant ? (
                <>
                  <div className="top-spend-callout">
                    <span className="top-spend-label">HIGHEST THIS MONTH</span>
                    <div><strong>{topMerchant.name}</strong><span>{formatCurrency(topMerchant.total)}</span></div>
                  </div>
                  <div className="merchant-breakdown">
                    {merchantBreakdown.map((item) => (
                      <div className="merchant-breakdown-row" key={item.name}>
                        <div className="merchant-breakdown-label"><span>{item.name}</span><strong>{formatCurrency(item.total)}</strong></div>
                        <div className="merchant-progress-track">
                          <span className={`merchant-progress-fill ${merchantColor(item.name)}`} style={{ width: `${monthTotal ? (item.total / monthTotal) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="insight-empty">Add expenses to see your top spending types.</div>
              )}
            </article>
          </div>
        </section>

        {session && (
          <section className="member-insights" aria-labelledby="member-insights-heading">
            <div className="member-insights-heading">
              <div><p className="eyebrow">HOUSEHOLD VIEW</p><h2 id="member-insights-heading">By member</h2></div>
              <span>{monthLabel}</span>
            </div>
            <div className="member-spend-grid">
              {memberBreakdown.map((member, index) => (
                <article className="member-spend-item" key={member.user_id} style={{ '--member-index': Math.min(index, 5) }}>
                  <div className="member-spend-topline">
                    <span className="member-avatar">{member.email?.slice(0, 1).toUpperCase() || 'H'}</span>
                    <div className="member-spend-identity"><strong>{member.email || 'Household member'}</strong><span>{member.role === 'admin' ? 'Household admin' : 'Household member'}</span></div>
                  </div>
                  <strong className="member-spend-total">{formatCurrency(member.total)}</strong>
                  <div className="member-progress-track"><span style={{ width: `${monthTotal ? (member.total / monthTotal) * 100 : 0}%` }} /></div>
                  <span className="member-spend-footnote">{member.count} {member.count === 1 ? 'expense' : 'expenses'} · {monthTotal ? Math.round((member.total / monthTotal) * 100) : 0}% of household total</span>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="entry-section" aria-labelledby="add-heading">
          <div className="section-heading">
            <div className="section-title-wrap">
              <span className="section-icon"><CirclePlus size={18} /></span>
              <div><p className="eyebrow">{editingId ? 'UPDATE RECORD' : 'NEW RECORD'}</p><h2 id="add-heading">{editingId ? 'Edit expense' : 'Add an expense'}</h2></div>
            </div>
            <span className="private-note"><CreditCard size={14} /> {session ? 'Shared with household' : 'Private to you'}</span>
          </div>

          <form className={`expense-form${needsMerchantName ? ' has-merchant-name' : ''}`} onSubmit={addExpense}>
            <label className="field merchant-field">
              <span className="field-label">EXPENSE TYPE</span>
              <span className="select-wrap">
                <ShoppingBag className="field-leading-icon" size={16} />
                <select value={merchant} onChange={(event) => { setMerchant(event.target.value); setMerchantName(''); }}>
                  {merchants.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <ChevronDown className="select-chevron" size={15} />
              </span>
            </label>

            {needsMerchantName && (
              <label className="field merchant-name-field">
                <span className="field-label">{merchant === 'Restaurant' ? 'RESTAURANT NAME' : merchant === 'OTT Subscriptions' ? 'SERVICE NAME' : 'EXPENSE NAME'}</span>
                <span className="input-wrap">
                  <input type="text" maxLength="120" placeholder={merchant === 'Restaurant' ? 'e.g. Cafe name' : merchant === 'OTT Subscriptions' ? 'e.g. Netflix' : 'What was this expense?'} value={merchantName} onChange={(event) => { setMerchantName(event.target.value); setError(''); }} required />
                </span>
              </label>
            )}

            <label className="field date-field">
              <span className="field-label">DATE</span>
              <span className="input-wrap">
                <CalendarDays className="field-leading-icon" size={16} />
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </span>
            </label>

            <label className="field amount-field">
              <span className="field-label">AMOUNT</span>
              <span className="input-wrap amount-wrap">
                <IndianRupee className="field-leading-icon rupee-icon" size={16} />
                <input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} required aria-describedby={error ? 'amount-error' : undefined} />
              </span>
            </label>

            {session && householdRole === 'admin' && (
              <label className="field member-field">
                <span className="field-label">FOR HOUSEHOLD MEMBER</span>
                <select value={expenseMemberId} onChange={(event) => setExpenseMemberId(event.target.value)} required>
                  {members.map((member) => <option key={member.user_id} value={member.user_id}>{member.email || 'Household member'}</option>)}
                </select>
              </label>
            )}

            <button className="add-button" type="submit" disabled={saving || dataLoading}><span>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add expense'}</span><ArrowUpRight size={17} /></button>
            {editingId && <button className="cancel-edit-button" type="button" onClick={cancelEditing}>Cancel</button>}
            {error && <p className="form-error" id="amount-error">{error}</p>}
          </form>
        </section>

        <section className="ledger-section" aria-labelledby="ledger-heading">
          <div className="ledger-heading">
            <div><p className="eyebrow">THE BREAKDOWN</p><h2 id="ledger-heading">This month</h2></div>
            <span className="ledger-total">{formatCurrency(monthTotal)} <span>total</span></span>
          </div>

          {thisMonthEntries.length ? (
            <div className="ledger-table-wrap">
              <table className="ledger-table">
                <thead><tr><th>MERCHANT</th><th>DATE</th><th>FOR</th><th>ADDED BY</th><th>AMOUNT</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {[...thisMonthEntries].sort((first, second) => second.date.localeCompare(first.date) || second.createdAt - first.createdAt).map((entry) => (
                    <tr key={entry.id}>
                      <td><span className={`table-merchant-icon ${merchantColor(entry.merchant)}`}><ShoppingBag size={14} /></span><span className="table-merchant-name">{entry.merchantName ? `${entry.merchant} · ${entry.merchantName}` : entry.merchant}</span></td>
                      <td><span className="table-date"><Clock3 size={13} /> {formatDate(entry.date, { day: 'numeric', month: 'short' })}</span></td>
                      <td className="table-creator">{members.find((member) => member.user_id === entry.memberId)?.email || (entry.memberId === session?.user.id ? 'You' : 'Household member')}</td>
                      <td className="table-creator">{members.find((member) => member.user_id === entry.createdBy)?.email || (entry.createdBy === session?.user.id ? 'You' : 'Household member')}</td>
                      <td className="table-amount">{formatCurrency(entry.amount)}</td>
                      <td className="row-actions"><button className="icon-button row-edit" type="button" onClick={() => startEditing(entry)} aria-label={`Edit ${entry.merchant} expense`} title="Edit expense"><Pencil size={14} /></button><button className="icon-button row-delete" type="button" onClick={() => deleteExpense(entry.id)} aria-label={`Delete ${entry.merchant} expense`} title="Delete expense"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-ledger">
              <span className="empty-ledger-icon"><Check size={18} /></span>
              <div><strong>A fresh page.</strong><span>Add your first expense above and it will land here.</span></div>
            </div>
          )}
          <div className="ledger-footnote"><span>{entries.length} {entries.length === 1 ? 'expense' : 'expenses'} recorded</span><span>All time <strong>{formatCurrency(allTimeTotal)}</strong></span></div>
        </section>
        </>}
      </main>
    </div>
  );
}

export default ExpenseTracker;