import React from 'react';
import { ArrowLeft, KeyRound, Mail, Phone, Wallet } from 'lucide-react';

function AuthScreen({
  mode,
  setMode,
  method,
  setMethod,
  email,
  setEmail,
  phone,
  setPhone,
  code,
  setCode,
  password,
  setPassword,
  codeSent,
  recovery,
  busy,
  error,
  message,
  onRequestCode,
  onVerifyCode,
  onPasswordAuth,
  onPasswordReset,
  onPasswordUpdate,
}) {
  const isSignUp = mode === 'sign-up';
  const isEmail = method !== 'phone';
  const contact = isEmail ? email : phone;
  const setContact = isEmail ? setEmail : setPhone;

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <a className="brand auth-brand" href="#" aria-label="PocketTracker">
          <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">Pocket<span>Tracker</span></span>
        </a>
        <div className="auth-heading">
          <p className="eyebrow">YOUR PRIVATE LEDGER</p>
          <h1>{recovery ? 'Choose a new password' : codeSent ? 'Enter your sign-in code' : isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p>{recovery
            ? 'Your password reset link is verified. Choose a new password to continue.'
            : codeSent
              ? `We sent a one-time code to ${contact}.`
              : method === 'phone'
                ? 'Use a one-time code sent to your mobile number.'
                : method === 'email-password'
                  ? 'Sign in with your existing email and password, or create a new account.'
                  : 'Use a one-time code sent to your email address.'}</p>
        </div>

        {recovery ? (
          <form className="auth-form" onSubmit={onPasswordUpdate}>
            <label>
              <span>New password</span>
              <input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button className="auth-submit" type="submit" disabled={busy}><KeyRound size={16} />{busy ? 'Updating...' : 'Update password'}</button>
          </form>
        ) : !codeSent ? (
          <>
            <div className="auth-tabs" role="tablist" aria-label="Account action">
              <button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''} onClick={() => setMode('sign-in')}>Sign in</button>
              <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => setMode('sign-up')}>Create account</button>
            </div>
            <div className="auth-tabs auth-method-tabs" role="tablist" aria-label="Sign-in method">
              <button type="button" role="tab" aria-selected={method === 'email-otp'} className={method === 'email-otp' ? 'active' : ''} onClick={() => setMethod('email-otp')}><Mail size={13} /> Email code</button>
              <button type="button" role="tab" aria-selected={method === 'email-password'} className={method === 'email-password' ? 'active' : ''} onClick={() => setMethod('email-password')}><KeyRound size={13} /> Password</button>
              <button type="button" role="tab" aria-selected={method === 'phone'} className={method === 'phone' ? 'active' : ''} onClick={() => setMethod('phone')}><Phone size={13} /> Phone</button>
            </div>
            <form className="auth-form" onSubmit={method === 'email-password' ? onPasswordAuth : onRequestCode}>
              <label>
                <span>{isEmail ? 'Email address' : 'Mobile number (include country code)'}</span>
                <input
                  type={isEmail ? 'email' : 'tel'}
                  inputMode={isEmail ? 'email' : 'tel'}
                  autoComplete={method === 'email-password' ? 'username' : isEmail ? 'email' : 'tel'}
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder={isEmail ? 'you@example.com' : '+919876543210'}
                  required
                />
              </label>
              {method === 'email-password' && (
                <label>
                  <span>Password</span>
                  <input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
                </label>
              )}
              <button className="auth-submit" type="submit" disabled={busy}>
                {method === 'email-password'
                  ? <><KeyRound size={16} />{busy ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in with password'}</>
                  : <><Mail size={16} />{busy ? 'Sending code...' : isSignUp ? 'Send sign-up code' : 'Send one-time code'}</>}
              </button>
            </form>
            {method === 'email-password' && !isSignUp && <button className="auth-forgot-link" type="button" onClick={onPasswordReset} disabled={busy}>Forgot password?</button>}
          </>
        ) : (
          <>
            <form className="auth-form" onSubmit={onVerifyCode}>
              <label>
                <span>One-time code</span>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" required />
              </label>
              <button className="auth-submit" type="submit" disabled={busy}><KeyRound size={16} />{busy ? 'Verifying...' : 'Verify and continue'}</button>
            </form>
            <div className="auth-code-actions">
              <button type="button" onClick={onRequestCode} disabled={busy}>Resend code</button>
              <button type="button" onClick={() => { setCode(''); setMode(mode, { restart: true }); }}><ArrowLeft size={13} /> Change {isEmail ? 'email' : 'phone'}</button>
            </div>
          </>
        )}
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-message" role="status">{message}</p>}
        {!recovery && <p className="auth-footnote">Use the same email address to access your existing account and transactions. Verify and link your phone after signing in to use phone codes with this account.</p>}
      </section>
    </main>
  );
}

export default AuthScreen;
