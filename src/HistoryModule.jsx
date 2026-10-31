import React, { useMemo, useState } from 'react';
import { Clock3, Search } from 'lucide-react';

function HistoryModule({ expenses, records, members, month, formatCurrency, formatDate, onMonthChange }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [memberId, setMemberId] = useState('all');
  const categories = useMemo(
    () => [...new Set([...expenses.map((expense) => expense.merchant), ...records.map((record) => record.category)])].sort(),
    [expenses, records],
  );
  const transactions = useMemo(() => [
    ...expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      kind: 'expense',
      title: expense.merchantName ? `${expense.merchant} · ${expense.merchantName}` : expense.merchant,
      category: expense.merchant,
      date: expense.date,
      amount: expense.amount,
      memberId: expense.memberId,
      createdBy: expense.createdBy,
    })),
    ...records.map((record) => ({
      id: `finance-${record.id}`,
      kind: record.kind,
      title: record.description,
      category: record.category,
      date: record.date,
      amount: record.amount,
      memberId: record.memberId,
      createdBy: record.createdBy,
    })),
  ].filter((transaction) => transaction.date.slice(0, 7) === month)
    .filter((transaction) => type === 'all' || transaction.kind === type)
  .filter((transaction) => category === 'all' || transaction.category === category)
  .filter((transaction) => memberId === 'all' || transaction.memberId === memberId)
    .filter((transaction) => `${transaction.title} ${transaction.category}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((first, second) => second.date.localeCompare(first.date)), [expenses, records, month, type, category, memberId, search]);

  return (
    <section className="ledger-section history-module" aria-labelledby="history-heading">
      <div className="ledger-heading">
        <div><p className="eyebrow">ALL MODULES</p><h2 id="history-heading">Transaction history</h2></div>
        <label className="history-month"><span>MONTH</span><input type="month" value={month} onChange={(event) => { if (event.target.value) onMonthChange(event.target.value); }} /></label>
      </div>
      <div className="history-filters">
        <label className="history-search"><Search size={15} /><input type="search" placeholder="Search descriptions and types" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <select aria-label="Filter by module" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All modules</option><option value="expense">Expenses</option><option value="earning">Earnings</option><option value="investment">Investments</option><option value="loan_repayment">Loan repayments</option>
        </select>
        <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        {members.length > 0 && <select aria-label="Filter by member" value={memberId} onChange={(event) => setMemberId(event.target.value)}><option value="all">All members</option>{members.map((member) => <option value={member.user_id} key={member.user_id}>{member.email || 'Member'}</option>)}</select>}
      </div>
      <p className="history-result-count">{transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'} in {formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</p>
      {transactions.length ? (
        <div className="finance-record-list">
          {transactions.map((transaction) => {
            const forMember = members.find((member) => member.user_id === transaction.memberId);
            const enteredBy = members.find((member) => member.user_id === transaction.createdBy);
            return (
              <article className="finance-record-row" key={transaction.id}>
                <span className={`transaction-type-mark ${transaction.kind}`} />
                <div className="finance-record-copy"><strong>{transaction.title}</strong><span>{transaction.category} · <Clock3 size={12} /> {formatDate(transaction.date)}{forMember ? ` · For ${forMember.email || 'Household member'}` : ''}{transaction.createdBy && transaction.createdBy !== transaction.memberId && enteredBy ? ` · Added by ${enteredBy.email || 'Household admin'}` : ''}</span></div>
                <strong className={`table-amount transaction-amount ${transaction.kind}`}>{transaction.kind === 'earning' ? '+' : transaction.kind === 'expense' ? '−' : ''}{formatCurrency(transaction.amount)}</strong>
              </article>
            );
          })}
        </div>
      ) : <div className="empty-ledger"><div><strong>No matching transactions.</strong><span>Try a different month, filter, or search.</span></div></div>}
    </section>
  );
}

export default HistoryModule;
