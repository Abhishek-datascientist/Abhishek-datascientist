import React, { useMemo, useState } from 'react';
import { CalendarDays, Check, CirclePlus, CreditCard, IndianRupee } from 'lucide-react';

function expectedDueDate(month, dueDay) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(dueDay, lastDay)).padStart(2, '0')}`;
}

function currentLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function LoanTracker({ loans, payments, members, session, householdRole, month, saving, onCreateLoan, onRecordPayment, formatCurrency, formatDate }) {
  const [name, setName] = useState('');
  const [lender, setLender] = useState('');
  const [principal, setPrincipal] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [startDate, setStartDate] = useState(`${month}-01`);
  const [memberId, setMemberId] = useState(session?.user.id ?? '');
  const [paymentFor, setPaymentFor] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(currentLocalDate);
  const [error, setError] = useState('');
  const showMemberPicker = householdRole === 'admin' && members.length > 1;
  const monthLoans = useMemo(
    () => loans.filter((loan) => loan.active && loan.startDate.slice(0, 7) <= month),
    [loans, month],
  );

  function beginPayment(loan) {
    setPaymentFor(loan.id);
    setPaidAmount(String(loan.emiAmount));
    setPaymentDate(currentLocalDate());
    setError('');
  }

  async function submitLoan(event) {
    event.preventDefault();
    setError('');
    const parsedPrincipal = Number(principal);
    const parsedEmi = Number(emiAmount);
    const parsedDueDay = Number(dueDay);
    if (!Number.isFinite(parsedPrincipal) || parsedPrincipal <= 0 || !Number.isFinite(parsedEmi) || parsedEmi <= 0) {
      setError('Enter a loan amount and EMI greater than zero.');
      return;
    }
    if (!Number.isInteger(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      setError('Choose an EMI due day between 1 and 31.');
      return;
    }
    const result = await onCreateLoan({
      name: name.trim(),
      lender: lender.trim(),
      principal: parsedPrincipal,
      emiAmount: parsedEmi,
      dueDay: parsedDueDay,
      startDate,
      memberId: householdRole === 'admin' ? memberId : session?.user.id,
    });
    if (!result) {
      setError('Could not save the loan. See the message above and try again.');
      return;
    }
    setName('');
    setLender('');
    setPrincipal('');
    setEmiAmount('');
  }

  async function submitPayment(event, loan) {
    event.preventDefault();
    setError('');
    const parsedAmount = Number(paidAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an EMI payment amount greater than zero.');
      return;
    }
    const result = await onRecordPayment({
      loanId: loan.id,
      householdId: loan.householdId,
      memberId: loan.memberId,
      amount: parsedAmount,
      paymentDate,
      periodMonth: `${month}-01`,
    });
    if (!result) {
      setError('Could not record the EMI payment. See the message above and try again.');
      return;
    }
    setPaymentFor('');
  }

  return (
    <div className="finance-module loan-module">
      <section className="module-total-card loan-total">
        <div><p className="eyebrow">MONTHLY EMI TRACKER</p><h2>Loans &amp; EMIs</h2></div>
        <CreditCard size={22} />
        <strong>{monthLoans.length}</strong>
        <span>{monthLoans.length === 1 ? 'active loan' : 'active loans'} · {formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</span>
      </section>

      <section className="entry-section finance-entry-section">
        <div className="section-heading">
          <div className="section-title-wrap"><span className="section-icon"><CirclePlus size={18} /></span><div><p className="eyebrow">LOAN DETAILS</p><h2>Add a loan to track</h2></div></div>
          <span className="private-note">{householdRole === 'admin' ? 'Recording for household' : 'For you'}</span>
        </div>
        <form className="finance-record-form" onSubmit={submitLoan}>
          <label className="field"><span className="field-label">LOAN NAME</span><input type="text" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Home loan" required /></label>
          <label className="field"><span className="field-label">LENDER</span><input type="text" maxLength={120} value={lender} onChange={(event) => setLender(event.target.value)} placeholder="e.g. Bank name" required /></label>
          <label className="field"><span className="field-label">ORIGINAL LOAN AMOUNT</span><span className="input-wrap amount-wrap"><IndianRupee className="field-leading-icon rupee-icon" size={16} /><input type="number" min="0.01" step="0.01" value={principal} onChange={(event) => setPrincipal(event.target.value)} required /></span></label>
          <label className="field"><span className="field-label">MONTHLY EMI</span><span className="input-wrap amount-wrap"><IndianRupee className="field-leading-icon rupee-icon" size={16} /><input type="number" min="0.01" step="0.01" value={emiAmount} onChange={(event) => setEmiAmount(event.target.value)} required /></span></label>
          <label className="field"><span className="field-label">EMI DUE DAY</span><input type="number" min="1" max="31" value={dueDay} onChange={(event) => setDueDay(event.target.value)} required /></label>
          <label className="field"><span className="field-label">FIRST EMI MONTH</span><span className="input-wrap"><CalendarDays className="field-leading-icon" size={16} /><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></span></label>
          {showMemberPicker && <label className="field"><span className="field-label">FOR HOUSEHOLD MEMBER</span><select value={memberId} onChange={(event) => setMemberId(event.target.value)} required>{members.map((member) => <option value={member.user_id} key={member.user_id}>{member.email || 'Household member'}</option>)}</select></label>}
          <button className="add-button" type="submit" disabled={saving}><span>{saving ? 'Saving...' : 'Add loan'}</span><Check size={16} /></button>
        </form>
      </section>

      {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}

      <section className="ledger-section" aria-label="Loans and EMI payments">
        <div className="ledger-heading"><div><p className="eyebrow">DUE THIS MONTH</p><h2>{formatDate(`${month}-01`, { month: 'long', year: 'numeric' })}</h2></div><span className="ledger-total">{monthLoans.length} <span>loans</span></span></div>
        {monthLoans.length ? (
          <div className="loan-list">
            {monthLoans.map((loan) => {
              const payment = payments.find((item) => item.loanId === loan.id && item.periodMonth === month);
              const dueDate = expectedDueDate(month, loan.dueDay);
              const member = members.find((item) => item.user_id === loan.memberId);
              const today = currentLocalDate();
              const duePassed = dueDate < today;
              const isDueToday = dueDate === today;
              return (
                <article className="loan-card" key={loan.id}>
                  <div className="loan-card-heading"><span className="loan-card-icon"><CreditCard size={17} /></span><div><h3>{loan.name}</h3><p>{loan.lender}{member && showMemberPicker ? ` · ${member.email || 'Household member'}` : ''}</p></div><span className={`loan-status ${payment ? 'paid' : duePassed ? 'overdue' : isDueToday ? 'due' : 'upcoming'}`}>{payment ? 'Paid' : duePassed ? 'Overdue' : isDueToday ? 'Due today' : 'Upcoming'}</span></div>
                  <div className="loan-card-metrics"><div><span>MONTHLY EMI</span><strong>{formatCurrency(loan.emiAmount)}</strong></div><div><span>ORIGINAL AMOUNT</span><strong>{formatCurrency(loan.principal)}</strong></div><div><span>DUE DATE</span><strong>{formatDate(dueDate, { day: 'numeric', month: 'short' })}</strong></div></div>
                  {payment ? (
                    <div className="loan-payment-confirmation"><Check size={15} /><span>Paid {formatCurrency(payment.amount)} on {formatDate(payment.paymentDate)}</span></div>
                  ) : paymentFor === loan.id ? (
                    <form className="loan-payment-form" onSubmit={(event) => submitPayment(event, loan)}>
                      <label className="field"><span className="field-label">PAYMENT AMOUNT</span><input type="number" min="0.01" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} required /></label>
                      <label className="field"><span className="field-label">PAID ON</span><input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required /></label>
                      <button className="add-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Confirm EMI paid'}</button>
                      <button className="cancel-edit-button" type="button" onClick={() => setPaymentFor('')}>Cancel</button>
                    </form>
                  ) : (
                    <button className="loan-pay-button" type="button" onClick={() => beginPayment(loan)}>Record this month’s EMI payment</button>
                  )}
                  <div className="loan-payment-history"><strong>Recent payments</strong>{payments.filter((item) => item.loanId === loan.id).sort((first, second) => second.periodMonth.localeCompare(first.periodMonth)).slice(0, 4).map((item) => <span key={item.id}>{formatDate(`${item.periodMonth}-01`, { month: 'short', year: 'numeric' })} · {formatCurrency(item.amount)} · Paid {formatDate(item.paymentDate)}</span>)}{!payments.some((item) => item.loanId === loan.id) && <span>No EMI payments recorded yet.</span>}</div>
                </article>
              );
            })}
          </div>
        ) : <div className="empty-ledger"><span className="empty-ledger-icon"><CreditCard size={17} /></span><div><strong>No loan EMIs to show for this month.</strong><span>Add your loan details above to create a monthly EMI tracker.</span></div></div>}
      </section>

      {householdRole !== 'admin' && <p className="finance-permission-note">Household admins can add and record EMIs for household members.</p>}
    </div>
  );
}

export default LoanTracker;
