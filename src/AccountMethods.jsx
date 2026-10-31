import React, { useState } from 'react';
import { Check, KeyRound, Mail, Phone } from 'lucide-react';

function AccountMethods({ user, supabase }) {
  const [method, setMethod] = useState(user.email ? 'phone' : 'email');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const hasEmail = Boolean(user.email);
  const hasPhone = Boolean(user.phone);
  const hasBoth = hasEmail && hasPhone;

  async function requestCode(event) {
    event?.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const normalizedContact = method === 'phone'
      ? contact.trim().replace(/[\s()-]/g, '')
      : contact.trim();
    if (method === 'phone' && !/^\+[1-9]\d{7,14}$/.test(normalizedContact)) {
      setError('Enter a valid phone number in international format, such as +919876543210.');
      setBusy(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser(
      method === 'email' ? { email: normalizedContact } : { phone: normalizedContact },
    );
    if (updateError) {
      setError(updateError.message);
    } else {
      setCodeSent(true);
      setMessage(`Enter the verification code sent to ${normalizedContact}.`);
    }
    setBusy(false);
  }

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const normalizedContact = method === 'phone'
      ? contact.trim().replace(/[\s()-]/g, '')
      : contact.trim();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      [method]: normalizedContact,
      token: code.trim(),
      type: method === 'phone' ? 'phone_change' : 'email_change',
    });
    if (verifyError) {
      setError(verifyError.message);
    } else {
      setCodeSent(false);
      setContact('');
      setCode('');
      setMethod(method === 'email' ? 'phone' : 'email');
      setMessage(`${method === 'email' ? 'Email' : 'Phone number'} verified and linked to this account.`);
    }
    setBusy(false);
  }

  function changeMethod(nextMethod) {
    setMethod(nextMethod);
    setContact('');
    setCode('');
    setCodeSent(false);
    setError('');
    setMessage('');
  }

  return (
    <section className="account-methods household-panel" aria-label="Account sign-in methods">
      <div className="account-methods-heading">
        <div>
          <p className="eyebrow">ACCOUNT ACCESS</p>
          <h2>Sign-in methods</h2>
        </div>
        {hasBoth && <span className="account-methods-verified"><Check size={13} /> Email and phone linked</span>}
      </div>
      <div className="account-methods-status">
        <span className={hasEmail ? 'verified' : ''}><Mail size={14} /> {hasEmail ? user.email : 'No email linked'}</span>
        <span className={hasPhone ? 'verified' : ''}><Phone size={14} /> {hasPhone ? user.phone : 'No phone linked'}</span>
      </div>
      {!hasBoth && (
        <>
          <p className="account-methods-copy">Add and verify your other contact method to use either email or phone for this same account.</p>
          {!codeSent ? (
            <form className="account-methods-form" onSubmit={requestCode}>
              <div className="auth-tabs auth-method-tabs" role="tablist" aria-label="Contact method to link">
                {!hasEmail && <button type="button" role="tab" aria-selected={method === 'email'} className={method === 'email' ? 'active' : ''} onClick={() => changeMethod('email')}><Mail size={13} /> Link email</button>}
                {!hasPhone && <button type="button" role="tab" aria-selected={method === 'phone'} className={method === 'phone' ? 'active' : ''} onClick={() => changeMethod('phone')}><Phone size={13} /> Link phone</button>}
              </div>
              <label className="household-field">
                <span>{method === 'email' ? 'EMAIL ADDRESS' : 'MOBILE NUMBER WITH COUNTRY CODE'}</span>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  inputMode={method === 'email' ? 'email' : 'tel'}
                  autoComplete={method === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder={method === 'email' ? 'you@example.com' : '+919876543210'}
                  required
                />
              </label>
              <button className="auth-submit" type="submit" disabled={busy}><KeyRound size={15} />{busy ? 'Sending...' : 'Send verification code'}</button>
            </form>
          ) : (
            <form className="account-methods-form" onSubmit={verifyCode}>
              <label className="household-field">
                <span>VERIFICATION CODE</span>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" required />
              </label>
              <button className="auth-submit" type="submit" disabled={busy}><Check size={15} />{busy ? 'Verifying...' : 'Verify and link'}</button>
              <div className="auth-code-actions">
                <button type="button" onClick={() => requestCode()} disabled={busy}>Resend code</button>
                <button type="button" onClick={() => changeMethod(method)} disabled={busy}>Change contact</button>
              </div>
            </form>
          )}
        </>
      )}
      {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
      {message && <p className="auth-feedback auth-message" role="status">{message}</p>}
    </section>
  );
}

export default AccountMethods;
