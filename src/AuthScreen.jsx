import React from 'react';
import { KeyRound, Wallet } from 'lucide-react';

function AuthScreen({ mode, setMode, email, setEmail, password, setPassword, error, message, onSubmit }) {
  const isSignUp = mode === 'sign-up';

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <a className="brand auth-brand" href="#" aria-label="PocketTracker">
          <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">Pocket<span>Tracker</span></span>
        </a>
        <div className="auth-heading">
          <p className="eyebrow">YOUR PRIVATE LEDGER</p>
          <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p>Sign in to keep your expenses in sync across devices.</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Account action">
          <button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''} onClick={() => setMode('sign-in')}>Sign in</button>
          <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => setMode('sign-up')}>Create account</button>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email address</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} required />
          </label>
          <button className="auth-submit" type="submit"><KeyRound size={16} />{isSignUp ? 'Create account' : 'Sign in'}</button>
        </form>
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-message" role="status">{message}</p>}
        <p className="auth-footnote">Your expenses are private to your account.</p>
      </section>
    </main>
  );
}

export default AuthScreen;