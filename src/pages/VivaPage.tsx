import { useMemo, useState } from 'react';
import { VIVA_QUESTIONS } from '../data/viva';
import './viva.css';

type Mode = 'study' | 'test';

interface AnswerState {
  readonly selected: number;
  readonly correct: boolean;
}

export default function VivaPage() {
  const [mode, setMode] = useState<Mode>('study');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = VIVA_QUESTIONS[index];
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(
    () => Object.values(answers).filter((answer) => answer.correct).length,
    [answers],
  );

  const current = answers[question.id];

  const choose = (optionIndex: number) => {
    if (current) return; // a locked answer stays locked until retry
    const correct = optionIndex === question.answerIndex;
    setAnswers((previous) => ({ ...previous, [question.id]: { selected: optionIndex, correct } }));
    if (mode === 'study') setRevealed(true);
  };

  const goNext = () => {
    if (index >= VIVA_QUESTIONS.length - 1) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setRevealed(mode === 'study' ? Boolean(answers[VIVA_QUESTIONS[index + 1]?.id]) : false);
  };

  const goPrevious = () => {
    if (index === 0) return;
    setIndex(index - 1);
    setRevealed(mode === 'study');
  };

  const retry = () => {
    setAnswers({});
    setIndex(0);
    setRevealed(false);
    setFinished(false);
  };

  if (finished) {
    const percent = Math.round((score / VIVA_QUESTIONS.length) * 100);
    return (
      <div className="shell page viva">
        <header className="page__head">
          <p className="eyebrow">SECTION 07 · VIVA</p>
          <h1 className="display page__title">VIVA RESULT</h1>
        </header>
        <section className="panel bracketed viva__result">
          <p className="viva__score numeric">
            {score}
            <span>/{VIVA_QUESTIONS.length}</span>
          </p>
          <p className="viva__percent mono">{percent}% correct</p>
          <p className="lede">
            {percent >= 85
              ? 'Strong command of the experiment — you can defend the physics and the data.'
              : percent >= 60
                ? 'Solid foundation. Review the questions you missed, especially the distinction between the sampled minimum and the reported angle.'
                : 'Worth a second pass through the theory section, then retry. Every answer has an explanation.'}
          </p>
          <div className="viva__result-actions">
            <button type="button" className="btn btn--primary" onClick={retry}>
              RETRY FULL SET
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setFinished(false);
                setIndex(0);
              }}
            >
              REVIEW ANSWERS
            </button>
          </div>
        </section>

        <section className="viva__review">
          {VIVA_QUESTIONS.map((item) => {
            const answer = answers[item.id];
            return (
              <article key={item.id} className={`viva__review-item${answer?.correct ? ' is-correct' : ' is-wrong'}`}>
                <div className="spread">
                  <span className="mono tiny muted">Q{String(item.id).padStart(2, '0')} · {item.topic}</span>
                  <span className={`chip ${answer?.correct ? 'chip--live' : 'chip--red'}`}>
                    {answer?.correct ? 'CORRECT' : 'REVIEW'}
                  </span>
                </div>
                <p className="viva__review-question">{item.question}</p>
                <p className="note">
                  Correct: <strong className="viva__review-answer">{item.options[item.answerIndex]}</strong>
                </p>
                <p className="note">{item.explanation}</p>
              </article>
            );
          })}
        </section>
      </div>
    );
  }

  return (
    <div className="shell page viva">
      <header className="page__head">
        <p className="eyebrow">SECTION 07 · VIVA</p>
        <h1 className="display page__title">TEST YOUR OPTICS</h1>
        <p className="lede">
          {VIVA_QUESTIONS.length} questions on the physics and the data of this specific experiment.
          In study mode the explanation appears immediately; in test mode feedback is withheld until
          the end.
        </p>
      </header>

      <div className="viva__bar">
        <div className="viva__modes" role="group" aria-label="Viva mode">
          <button
            type="button"
            className={`chip${mode === 'study' ? ' is-active' : ''}`}
            onClick={() => setMode('study')}
            aria-pressed={mode === 'study'}
          >
            STUDY MODE
          </button>
          <button
            type="button"
            className={`chip${mode === 'test' ? ' is-active' : ''}`}
            onClick={() => setMode('test')}
            aria-pressed={mode === 'test'}
          >
            TEST MODE
          </button>
        </div>
        <div className="viva__score-mini mono">
          SCORE {score}/{answeredCount || 0} · Q{index + 1} OF {VIVA_QUESTIONS.length}
        </div>
      </div>

      <div className="viva__progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / VIVA_QUESTIONS.length) * 100}%` }} />
      </div>

      <section className="panel bracketed viva__card">
        <div className="viva__card-head">
          <span className="chip">{question.level.toUpperCase()}</span>
          <span className="chip chip--off">{question.topic}</span>
        </div>
        <h2 className="viva__question">{question.question}</h2>

        <ul className="viva__options">
          {question.options.map((option, optionIndex) => {
            const isSelected = current?.selected === optionIndex;
            const isCorrect = optionIndex === question.answerIndex;
            const showCorrectness = Boolean(current) && (mode === 'study' || revealed);
            let className = 'viva__option';
            if (isSelected) className += ' is-selected';
            if (showCorrectness && isCorrect) className += ' is-correct';
            if (showCorrectness && isSelected && !isCorrect) className += ' is-wrong';
            return (
              <li key={option}>
                <button
                  type="button"
                  className={className}
                  onClick={() => choose(optionIndex)}
                  disabled={Boolean(current)}
                  aria-pressed={isSelected}
                >
                  <span className="viva__option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                  <span>{option}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {current && (mode === 'study' || revealed) && (
          <div className={`viva__feedback${current.correct ? ' is-correct' : ' is-wrong'}`} role="status">
            <p className="viva__feedback-title">
              {current.correct ? '✓ Correct' : '✗ Not quite'}
            </p>
            <p>{question.explanation}</p>
          </div>
        )}

        {current && mode === 'test' && !revealed && (
          <div className="viva__feedback" role="status">
            <p className="viva__feedback-title">Answer recorded</p>
            <p className="note">Test mode withholds the explanation until you review the full set.</p>
          </div>
        )}

        <div className="viva__nav">
          <button type="button" className="btn btn--sm" onClick={goPrevious} disabled={index === 0}>
            ← PREVIOUS
          </button>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={goNext}
            disabled={!current}
          >
            {index === VIVA_QUESTIONS.length - 1 ? 'FINISH' : 'NEXT →'}
          </button>
        </div>
        {!current && <p className="note">Select an option to continue.</p>}
      </section>
    </div>
  );
}
