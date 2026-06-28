import { useEffect, useRef, useState } from 'react';
import { auth } from '../analytics/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { signInWithGoogle, signOutGoogle, savePrediction, getExistingPrediction } from './firebaseAuth';
import { initialRoundOf32, createNextRound } from './predictionData';
import './WorldCupPredictor.css';

const createEmptyMatch = (id) => ({ id, teamA: '', teamB: '', selected: '' });

const createEmptyRound = (count, prefix) =>
  Array.from({ length: count }, (_, index) => createEmptyMatch(`${prefix}-${index + 1}`));

const createFinalMatch = (semifinals) => {
  const [sf1, sf2] = semifinals;
  if (!sf1 || !sf2) {
    return createEmptyMatch('final-1');
  }

  return {
    id: 'final-1',
    teamA: sf1.selected || '',
    teamB: sf2.selected || '',
    selected: ''
  };
};

const createThirdPlaceMatch = (semifinals) => {
  const [sf1, sf2] = semifinals;

  const findLoser = (match) => {
    if (!match?.selected) {
      return '';
    }
    return match.teamA === match.selected ? match.teamB : match.teamA;
  };

  return {
    id: 'third-1',
    teamA: findLoser(sf1),
    teamB: findLoser(sf2),
    selected: ''
  };
};

// Note: we intentionally do not carry selections forward automatically.
// Next-round matches are populated with team names only; winners must be chosen by the user.

const isMatchComplete = (match) => {
  return Boolean(match.teamA && match.teamB && match.selected);
};

const areAllRoundsComplete = (rounds) => {
  return rounds.every((round) => round.every(isMatchComplete));
};

const roundLabels = [
  { key: 'roundOf32', label: 'Round of 32' },
  { key: 'roundOf16', label: 'Round of 16' },
  { key: 'quarterfinals', label: 'Quarterfinals' },
  { key: 'semifinals', label: 'Semifinals' },
  { key: 'thirdPlace', label: 'Third Place' },
  { key: 'finalMatch', label: 'Final' }
];

const buildPredictionPayload = ({ roundOf32, roundOf16, quarterfinals, semifinals, thirdPlace, finalMatch }) => ({
  roundOf32: roundOf32.map(({ id, teamA, teamB, selected }) => ({ id, teamA, teamB, winner: selected })),
  roundOf16: roundOf16.map(({ id, teamA, teamB, selected }) => ({ id, teamA, teamB, winner: selected })),
  quarterfinals: quarterfinals.map(({ id, teamA, teamB, selected }) => ({ id, teamA, teamB, winner: selected })),
  semifinals: semifinals.map(({ id, teamA, teamB, selected }) => ({ id, teamA, teamB, winner: selected })),
  thirdPlace: { id: thirdPlace[0].id, teamA: thirdPlace[0].teamA, teamB: thirdPlace[0].teamB, winner: thirdPlace[0].selected },
  final: { id: finalMatch[0].id, teamA: finalMatch[0].teamA, teamB: finalMatch[0].teamB, winner: finalMatch[0].selected }
});

function RoundBlock({ title, matches, onSelect, isLocked }) {
  return (
    <section className="wc-section">
      <h2>{title}</h2>
      {matches.map((match, index) => (
        <div key={match.id} className="wc-match">
          <div className="wc-match-label">Match {index + 1}</div>
          <button
            type="button"
            className={`wc-team-button ${match.selected === match.teamA ? 'selected' : ''}`}
            onClick={() => onSelect(match.id, match.teamA)}
            disabled={!match.teamA || isLocked}
          >
            {match.teamA || 'Winner TBD'}
          </button>
          <button
            type="button"
            className={`wc-team-button ${match.selected === match.teamB ? 'selected' : ''}`}
            onClick={() => onSelect(match.id, match.teamB)}
            disabled={!match.teamB || isLocked}
          >
            {match.teamB || 'Winner TBD'}
          </button>
        </div>
      ))}
    </section>
  );
}

export default function WorldCupPredictor() {
  const [user, setUser] = useState(null);
  const [roundOf32, setRoundOf32] = useState(initialRoundOf32);
  const [roundOf16, setRoundOf16] = useState(() => createNextRound(initialRoundOf32, 'r16'));
  const [quarterfinals, setQuarterfinals] = useState(() => createNextRound(createNextRound(initialRoundOf32, 'r16'), 'qf'));
  const [semifinals, setSemifinals] = useState(() => createNextRound(createNextRound(createNextRound(initialRoundOf32, 'r16'), 'qf'), 'sf'));
  const [finalMatch, setFinalMatch] = useState([createEmptyMatch('final-1')]);
  const [thirdPlace, setThirdPlace] = useState([createEmptyMatch('third-1')]);
  const [nameInput, setNameInput] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [status, setStatus] = useState({ loading: false, message: '', error: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [scrollTrackWidth, setScrollTrackWidth] = useState(0);
  const gridRef = useRef(null);
  const topScrollRef = useRef(null);
  const isSyncingScrollRef = useRef(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      const initialName = nextUser?.displayName || nextUser?.email?.split('@')[0] || '';
      setNameInput(initialName);
      setRoundOf32(initialRoundOf32);
      setRoundOf16(createNextRound(initialRoundOf32, 'r16'));
      setQuarterfinals(createNextRound(createNextRound(initialRoundOf32, 'r16'), 'qf'));
      setSemifinals(createNextRound(createNextRound(createNextRound(initialRoundOf32, 'r16'), 'qf'), 'sf'));
      setFinalMatch([createEmptyMatch('final-1')]);
      setThirdPlace([createEmptyMatch('third-1')]);
      setIsSubmitted(false);
      setStatus({ loading: true, message: 'Checking saved predictions...', error: '' });

      if (!nextUser || !active) {
        if (!nextUser) {
          setStatus({ loading: false, message: '', error: '' });
        }
        return;
      }

      try {
        const existingPrediction = await getExistingPrediction({ uid: nextUser.uid, email: nextUser.email });
        if (!active) {
          return;
        }

        if (!existingPrediction) {
          setStatus({ loading: false, message: '', error: '' });
          return;
        }

        const savedPayload =
          typeof existingPrediction.predictions === 'string'
            ? JSON.parse(existingPrediction.predictions)
            : existingPrediction.predictions;

        const hydrateRound = (savedRound) =>
          (savedRound || []).map(({ id, teamA, teamB, winner, selected }) => ({
            id,
            teamA,
            teamB,
            selected: winner || selected || ''
          }));

        const round32 = hydrateRound(savedPayload.roundOf32 || []);
        const round16 = hydrateRound(savedPayload.roundOf16 || []);
        const qf = hydrateRound(savedPayload.quarterfinals || []);
        const sf = hydrateRound(savedPayload.semifinals || []);
        const finalData = savedPayload.final || {};
        const thirdData = savedPayload.thirdPlace || {};

        if (!active) {
          return;
        }

        setRoundOf32(round32.length ? round32 : initialRoundOf32);
        setRoundOf16(round16.length ? round16 : createNextRound(round32.length ? round32 : initialRoundOf32, 'r16'));
        setQuarterfinals(qf.length ? qf : createNextRound(round16.length ? round16 : createNextRound(round32.length ? round32 : initialRoundOf32, 'r16'), 'qf'));
        setSemifinals(sf.length ? sf : createNextRound(qf.length ? qf : createNextRound(round16.length ? round16 : createNextRound(round32.length ? round32 : initialRoundOf32, 'r16'), 'qf'), 'sf'));
        setFinalMatch([
          {
            id: finalData.id || 'final-1',
            teamA: finalData.teamA || '',
            teamB: finalData.teamB || '',
            selected: finalData.winner || finalData.selected || ''
          }
        ]);
        setThirdPlace([
          {
            id: thirdData.id || 'third-1',
            teamA: thirdData.teamA || '',
            teamB: thirdData.teamB || '',
            selected: thirdData.winner || thirdData.selected || ''
          }
        ]);
        setNameInput(existingPrediction.name || initialName);
        setIsSubmitted(true);
        setStatus({ loading: false, message: 'Prediction has been submitted.', error: '' });
      } catch (error) {
        console.error('Error checking existing prediction:', error);
        setStatus({ loading: false, message: '', error: 'Unable to load saved predictions.' });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncScrollbars = () => {
      const grid = gridRef.current;
      const top = topScrollRef.current;
      if (!grid || !top) {
        return;
      }

      setScrollTrackWidth(grid.scrollWidth || grid.clientWidth || 0);
      top.scrollLeft = grid.scrollLeft;
    };

    syncScrollbars();
    window.addEventListener('resize', syncScrollbars);
    return () => window.removeEventListener('resize', syncScrollbars);
  }, [roundOf32, roundOf16, quarterfinals, semifinals, finalMatch, thirdPlace]);

  const handleSelection = (roundKey, matchId, winner) => {
    if (!user) {
      setStatus({ loading: false, message: '', error: 'Sign in to make predictions.' });
      return;
    }

    const currentRounds = { roundOf32, roundOf16, quarterfinals, semifinals, finalMatch, thirdPlace };
    const updatedRound = currentRounds[roundKey].map((match) => (match.id === matchId ? { ...match, selected: winner } : match));
    const nextRounds = { ...currentRounds, [roundKey]: updatedRound };

    if (roundKey === 'roundOf32') {
      nextRounds.roundOf16 = createNextRound(updatedRound, 'r16');
      nextRounds.quarterfinals = createEmptyRound(4, 'qf');
      nextRounds.semifinals = createEmptyRound(2, 'sf');
      nextRounds.finalMatch = [createEmptyMatch('final-1')];
      nextRounds.thirdPlace = [createEmptyMatch('third-1')];
    } else if (roundKey === 'roundOf16') {
      nextRounds.quarterfinals = createNextRound(updatedRound, 'qf');
      nextRounds.semifinals = createEmptyRound(2, 'sf');
      nextRounds.finalMatch = [createEmptyMatch('final-1')];
      nextRounds.thirdPlace = [createEmptyMatch('third-1')];
    } else if (roundKey === 'quarterfinals') {
      nextRounds.semifinals = createNextRound(updatedRound, 'sf');
      nextRounds.finalMatch = [createEmptyMatch('final-1')];
      nextRounds.thirdPlace = [createEmptyMatch('third-1')];
    } else if (roundKey === 'semifinals') {
      nextRounds.finalMatch = [createFinalMatch(updatedRound)];
      nextRounds.thirdPlace = [createThirdPlaceMatch(updatedRound)];
    }

    setRoundOf32(nextRounds.roundOf32);
    setRoundOf16(nextRounds.roundOf16);
    setQuarterfinals(nextRounds.quarterfinals);
    setSemifinals(nextRounds.semifinals);
    setFinalMatch(nextRounds.finalMatch);
    setThirdPlace(nextRounds.thirdPlace);

    setStatus({ loading: false, message: '', error: '' });
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setStatus({ loading: false, message: 'Signed in successfully.', error: '' });
    } catch (error) {
      setStatus({ loading: false, message: '', error: error?.message || 'Google sign-in failed.' });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setStatus({ loading: false, message: '', error: 'Please sign in before submitting.' });
      return;
    }

    if (!trimmedName) {
      setStatus({ loading: false, message: '', error: 'Please enter your name before submitting.' });
      return;
    }

    const allComplete = areAllRoundsComplete([roundOf32, roundOf16, quarterfinals, semifinals, thirdPlace, finalMatch]);
    if (!allComplete) {
      setStatus({ loading: false, message: '', error: 'Please pick every match winner before submitting.' });
      return;
    }

    setIsSaving(true);
    setStatus({ loading: false, message: '', error: '' });

    try {
      const docId = await savePrediction({
        email: user.email,
        uid: user.uid,
        name: trimmedName,
        predictions: buildPredictionPayload({ roundOf32, roundOf16, quarterfinals, semifinals, thirdPlace, finalMatch })
      });

      setIsSubmitted(true);
      setStatus({ loading: false, message: `Predictions saved successfully (ID: ${docId}).`, error: '' });
    } catch (error) {
      setIsSubmitted(false);
      setStatus({ loading: false, message: '', error: error?.message || 'Unable to save predictions.' });
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Guest';
  const isReadOnly = !user || isSubmitted;
  const isModalLocked = !user;
  const trimmedName = nameInput.trim();
  const incompleteRoundLabels = roundLabels
    .filter(({ key }) => {
      const round = {
        roundOf32,
        roundOf16,
        quarterfinals,
        semifinals,
        thirdPlace,
        finalMatch
      }[key];

      return !round.every(isMatchComplete);
    })
    .map(({ label }) => label);
  const blockingFields = [!trimmedName ? 'Name' : null, ...incompleteRoundLabels].filter(Boolean);

  const handleGridScroll = () => {
    const grid = gridRef.current;
    const top = topScrollRef.current;
    if (!grid || !top || isSyncingScrollRef.current) {
      return;
    }

    isSyncingScrollRef.current = true;
    top.scrollLeft = grid.scrollLeft;
    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const handleTopScroll = () => {
    const grid = gridRef.current;
    const top = topScrollRef.current;
    if (!grid || !top || isSyncingScrollRef.current) {
      return;
    }

    isSyncingScrollRef.current = true;
    grid.scrollLeft = top.scrollLeft;
    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const submitButton = isSubmitted ? (
      <div className="wc-submit-panel wc-submit-panel-top wc-submitted-panel">
        <p className="wc-submitted-text">Prediction has been submitted.</p>
        <p className="wc-submitted-contact">
          If you want to edit, contact admin: <a href="mailto:supratim.kar099@gmail.com">supratim.kar099@gmail.com</a> / <a href="https://wa.me/918876083791" target="_blank" rel="noreferrer">+91 88760 83791 (WhatsApp)</a>
        </p>
      </div>
    ) : (
      <div className="wc-submit-panel wc-submit-panel-top">
        <button
          className="wc-button"
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !user || !trimmedName || !areAllRoundsComplete([roundOf32, roundOf16, quarterfinals, semifinals, thirdPlace, finalMatch])}
        >
          {isSaving ? 'Saving predictions...' : 'Submit predictions'}
        </button>
        {blockingFields.length > 0 && (
          <p className="wc-submit-hint">
            Missing required fields: {blockingFields.join(', ')}
          </p>
        )}
        {(status.message || status.error) && (
          <p className={`wc-status ${status.error ? 'wc-status-error' : 'wc-status-message'}`}>
            {status.error || status.message}
          </p>
        )}
      </div>
  );

  return (
    <div className="wc-container">
      <div className="wc-header">
        <div>
          <h1>World Cup Predictor</h1>
        </div>
        <div className="wc-auth">
          {user ? (
            <>
              <span className="wc-user">{displayName}</span>
              <button className="wc-button" type="button" onClick={signOutGoogle}>
                Sign out
              </button>
            </>
          ) : (
            <button className="wc-button" type="button" onClick={handleSignIn}>
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      <section className="wc-rules">
        <h2>Rules</h2>
        <p>1. Pick winners for every match from Round of 32 through the Final.</p>
        <p>2. Don't miss out on the 3rd place prediction at the end (after final).</p>
        <p>3. Check your name before submitting (auto-filled with your Google Account).</p>
        <p>4. Submit once every selection is filled so your bracket is saved.</p>
        <p>5. The updated points after each match can be tracked via a sheet that will be shared to your email id shortly.</p>
        <br />
        <h2>Point System</h2>
        <p>1. Each correct prediction earns you 2 points.</p>
        <p>2. If a match goes to penalties: correct prediction = 2 points & incorrect prediction = 1 point.</p>
        <p>3. Predicting the correct champion gets you an additional 2 points.</p>
      </section>
      
      <div className="wc-submit-panel wc-submit-panel-top wc-deadline-panel">
        <p className="wc-deadline-text">Deadline notice</p>
        <p className="wc-deadline-copy">
          The deadline was past as of 12:30 AM IST. You can still add your predictions, but you will not receive points for the Round of 32 match between South Africa &amp; Canada.
        </p>
        <p className="wc-deadline-copy">Final deadline: 29th June, 10:30 PM IST.</p>
      </div>

      <div className="wc-name-field">
        <label htmlFor="predictor-name">Your name</label>
        <input
          id="predictor-name"
          type="text"
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          placeholder="Enter your name"
          readOnly={isSubmitted}
          disabled={isSubmitted}
        />
      </div>

      {submitButton}

      <div className="wc-scroll-container">
        <div className="wc-scroll-track-top" ref={topScrollRef} onScroll={handleTopScroll}>
          <div className="wc-scroll-track-fill" style={{ width: scrollTrackWidth }} />
        </div>
        <div className="wc-grid" ref={gridRef} onScroll={handleGridScroll}>
          <RoundBlock
            title="Round of 32"
            matches={roundOf32}
            onSelect={(matchId, winner) => handleSelection('roundOf32', matchId, winner)}
            isLocked={isReadOnly}
          />
          <RoundBlock
            title="Round of 16"
            matches={roundOf16}
            onSelect={(matchId, winner) => handleSelection('roundOf16', matchId, winner)}
            isLocked={isReadOnly}
          />
          <RoundBlock
            title="Quarterfinals"
            matches={quarterfinals}
            onSelect={(matchId, winner) => handleSelection('quarterfinals', matchId, winner)}
            isLocked={isReadOnly}
          />
          <RoundBlock
            title="Semifinals"
            matches={semifinals}
            onSelect={(matchId, winner) => handleSelection('semifinals', matchId, winner)}
            isLocked={isReadOnly}
          />
          <RoundBlock
            title="Final"
            matches={finalMatch}
            onSelect={(matchId, winner) => handleSelection('finalMatch', matchId, winner)}
            isLocked={isReadOnly}
          />
          <RoundBlock
            title="Third Place"
            matches={thirdPlace}
            onSelect={(matchId, winner) => handleSelection('thirdPlace', matchId, winner)}
            isLocked={isReadOnly}
          />
        </div>
      </div>

      <br />
      {submitButton}

      {isModalLocked && (
        <>
          <div className="wc-modal-backdrop" />
          <div className="wc-modal">
            <div className="wc-modal-content">
              <h2>Sign in required</h2>
              <p>Google sign-in is required before you can make predictions.</p>
              <button className="wc-button" type="button" onClick={handleSignIn}>
                Continue with Google
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
