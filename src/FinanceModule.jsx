import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, IndianRupee, PiggyBank } from 'lucide-react';

const earningCategories = ['Salary', 'Business income', 'Freelance', 'Rental income', 'Other income'];
const savingsCategories = ['Investment'];

function FinanceModule({ module, month, records, members, session, householdId, householdRole, saving, onSave, formatCurrency, formatDate, onNavigateLoans }) {
  const isEarnings = module === 'earnings';
  const title = isEarnings ? 'Earnings' : 'Savings';
  const categories = isEarnings ? earningCategories : savingsCategories;
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(`${month}-01`);
  const [memberId, setMemberId] = useState(session?.user.id ?? '');
  const [error, setError] = useState('');
  useEffect(() => {
    setDate(`${month}-01`);
  }, [month]);

  useEffect(() => {
    if (session?.user.id) setMemberId(session.user.id);
  }, [session]);
  const monthRecords = useMemo(
    () => records.filter((record) => record.date.slice(0, 7) === month && (isEarnings ? record.kind === 'earning' : record.kind !== 'earning')),
    [records, month, isEarnings],
  );
  const total = monthRecords.reduce((sum, record) => sum + record.amount, 0);
  const showMemberPicker = householdRole === 'admin' && members.length > 1;

  async function submit(event) {
    event.preventDefault();
    setError('');
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    const result = await onSave({
      kind: isEarnings ? 'earning' : 'investment',
      category,
      description: description.trim(),
      amount: parsedAmount,
      date,
      memberId: householdRole === 'admin' ? memberId : session?.user.id,
    });
    if (!result) {
      setError('Could not save this record. Check the message above and try again.');
      return;
    }
    setDescription('');
    setAmount('');
  }

  return (
    <div className="finance-module">
      <section className={`module-total-card ${isEarnings ? 'earnings-total' : 'savings-total'}`}>
        <div><p className="eyebrow">{isEarnings ? 'HOUSEHOLD EARNINGS' : 'INVESTMENTS & LOAN REPAYMENTS'}</p><h2>{title}</h2></div>
        {isEarnings ? <ArrowDownRight size={22} /> : <PiggyBank size={22} />}
        <strong>{formatCurrency(total)}</strong>
        <span>{monthRecords.length} {monthRecords.length === 1 ? 'record' : 'records'} in {formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</span>
      </section>

      {!isEarnings && <button className="loans-module-callout" type="button" onClick={onNavigateLoans}><span><strong>Tracking loan EMIs?</strong><small>Open Loans &amp; EMIs to add loans, see due dates, and record each monthly payment.</small></span><span>Open tracker →</span></button>}

      <section className="entry-section finance-entry-section">
        <div className="section-heading">
          <div className="section-title-wrap">
            <span className="section-icon">{isEarnings ? <ArrowDownRight size={18} /> : <PiggyBank size={18} />}</span>
            <div><p className="eyebrow">NEW RECORD</p><h2>{isEarnings ? 'Add earnings' : 'Add savings activity'}</h2></div>
          </div>
          <span className="private-note">{householdRole === 'admin' ? 'Recording for household' : 'For you'}</span>
        </div>
        <form className="finance-record-form" onSubmit={submit}>
          <label className="field">
            <span className="field-label">{isEarnings ? 'EARNING TYPE' : 'SAVINGS TYPE'}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">DESCRIPTION</span>
            <input type="text" maxLength={120} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={isEarnings ? 'e.g. Monthly salary' : category === 'Investment' ? 'e.g. Mutual fund SIP' : 'e.g. Home loan EMI'} required />
          </label>
          <label className="field">
            <span className="field-label">DATE</span>
            <span className="input-wrap"><CalendarDays className="field-leading-icon" size={16} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></span>
          </label>
          <label className="field">
            <span className="field-label">AMOUNT</span>
            <span className="input-wrap amount-wrap"><IndianRupee className="field-leading-icon rupee-icon" size={16} /><input type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} required /></span>
          </label>
          {showMemberPicker && (
            <label className="field">
              <span className="field-label">FOR HOUSEHOLD MEMBER</span>
              <select value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
                {members.map((member) => <option value={member.user_id} key={member.user_id}>{member.email || 'Household member'}</option>)}
              </select>
            </label>
          )}
          <button className="add-button" type="submit" disabled={saving}><span>{saving ? 'Saving...' : `Add ${isEarnings ? 'earning' : 'record'}`}</span><ArrowUpRight size={17} /></button>
        </form>
        {error && <p className="form-error finance-form-error" role="alert">{error}</p>}
        {householdId && householdRole !== 'admin' && <p className="finance-permission-note">Household admins can also record this for another member.</p>}
      </section>

      <section className="ledger-section" aria-label={`${title} history`}>
        <div className="ledger-heading">
          <div><p className="eyebrow">MONTHLY HISTORY</p><h2>{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</h2></div>
          <span className="ledger-total">{formatCurrency(total)} <span>total</span></span>
        </div>
        {monthRecords.length ? (
          <div className="finance-record-list">
            {monthRecords.map((record) => {
              const member = members.find((candidate) => candidate.user_id === record.memberId);
              const enteredBy = members.find((candidate) => candidate.user_id === record.createdBy);
              return (
                <article className="finance-record-row" key={record.id}>
                  <span className={`table-merchant-icon ${isEarnings ? 'mint' : 'lavender'}`}>{isEarnings ? <ArrowDownRight size={14} /> : <PiggyBank size={14} />}</span>
                  <div className="finance-record-copy"><strong>{record.description}</strong><span>{record.category} · {formatDate(record.date)}{showMemberPicker && member ? ` · For ${member.email || 'Household member'}` : ''}{record.createdBy && record.createdBy !== record.memberId && enteredBy ? ` · Added by ${enteredBy.email || 'Household admin'}` : ''}</span></div>
                  <strong className="table-amount">{formatCurrency(record.amount)}</strong>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-ledger"><span className="empty-ledger-icon"><PiggyBank size={17} /></span><div><strong>No {title.toLowerCase()} recorded for this month.</strong><span>Add a record above; earlier months remain in history.</span></div></div>
        )}
      </section>
    </div>
  );
}

export default FinanceModule;
