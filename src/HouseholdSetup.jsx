import React, { useState } from 'react';
import { House, KeyRound, UsersRound, Wallet } from 'lucide-react';

function HouseholdSetup({ email, error, busy, onCreate, onJoin }) {
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  return (
    <main className="auth-screen">
      <section className="household-setup-panel">
        <a className="brand auth-brand" href="#" aria-label="PocketTracker">
          <span className="brand-mark"><Wallet size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">Pocket<span>Tracker</span></span>
        </a>
        <div className="auth-heading">
          <p className="eyebrow">SHARED SPENDING</p>
          <h1>Set up your household</h1>
          <p>Signed in as {email}. Create a household or join one with an invite code.</p>
        </div>

        <form className="household-action" onSubmit={(event) => onCreate(event, householdName)}>
          <span className="household-action-icon"><House size={17} /></span>
          <div className="household-action-copy"><strong>Create a household</strong><span>You will be its admin and can invite members.</span></div>
          <label className="household-field"><span>HOUSEHOLD NAME</span><input value={householdName} onChange={(event) => setHouseholdName(event.target.value)} minLength={2} maxLength={60} placeholder="e.g. Our home" required /></label>
          <button className="auth-submit" type="submit" disabled={busy}><House size={15} />{busy ? 'Creating...' : 'Create household'}</button>
        </form>

        <div className="household-or"><span />OR<span /></div>

        <form className="household-action" onSubmit={(event) => onJoin(event, inviteCode)}>
          <span className="household-action-icon join-icon"><UsersRound size={17} /></span>
          <div className="household-action-copy"><strong>Join a household</strong><span>Use the invite code sent by its admin.</span></div>
          <label className="household-field"><span>INVITE CODE</span><input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Paste household invite code" required /></label>
          <button className="auth-submit join-submit" type="submit" disabled={busy}><KeyRound size={15} />{busy ? 'Joining...' : 'Join household'}</button>
        </form>

        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        <p className="auth-footnote">Invite codes are single-use and tied to the invited email address.</p>
      </section>
    </main>
  );
}

export default HouseholdSetup;